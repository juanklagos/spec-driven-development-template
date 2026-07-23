// The SDD HTTP server as a value you can start, hold and close — spec 023 R1/R2.
//
// This module used to be the top half of http.ts, where `port`, `host` and
// `projectRoot` were read at module scope and `server.listen` ran as an import
// side effect. That shape has exactly one caller: a CLI that starts one server
// and never reconfigures it. The desktop shell needs the opposite — start a
// server, switch workspace, start another — and so does any test that wants two
// servers in one process.
//
// Three separated reasons to change, one per layer:
//   - CONFIGURATION  lives in the caller (http.ts reads the environment; the
//                    desktop app reads its own settings). Nothing here touches
//                    `process.env`, so the same code serves both.
//   - ROUTING        `createRequestListener` — which URL reaches which handler.
//   - LIFECYCLE      `startSddHttpServer` — binding a port, and letting go.
//
// Deliberately NOT here: `process.on("SIGINT")`, `uncaughtException`, and the
// startup banner. Those are process-wide concerns. A library that installs
// them hijacks the lifecycle of whatever embeds it — which, for Electron, is
// the entire application. They stay in the CLI that owns the process.

import http from "node:http";
import type { AddressInfo } from "node:net";
import { createApiHandler } from "./api.js";
import { renderDashboard, resolveDashboardLang } from "./dashboard.js";
import { createEventHub } from "./events.js";
import { DEFAULT_HTTP_HOST, guardRequest, hostForUrl } from "./security.js";
import { serveBuilder } from "./static.js";
import { createMcpTransportHandler } from "./transport.js";

/** The port the project has always used, and still the default. */
export const DEFAULT_HTTP_PORT = 3334;

/**
 * How many consecutive ports to try before giving up. Ten is enough to walk
 * past a handful of stale servers and few enough that a genuinely wrong bind
 * host fails fast instead of scanning.
 */
export const DEFAULT_PORT_ATTEMPTS = 10;

export interface SddHttpServerOptions {
  /** Absolute path of the SDD workspace this server operates on. */
  projectRoot: string;
  /** Preferred port. `0` asks the OS for a free one and disables the fallback. */
  port?: number;
  /** Bind address. Defaults to loopback, and callers should keep it that way. */
  host?: string;
  /** Consecutive ports to try when the preferred one is taken. */
  portAttempts?: number;
}

/**
 * A running server. The URLs are derived from the port actually bound, never
 * from the one requested — that difference is the entire point of R2.
 */
export interface SddHttpServer {
  readonly projectRoot: string;
  readonly host: string;
  readonly port: number;
  readonly baseUrl: string;
  readonly builderUrl: string;
  readonly dashboardUrl: string;
  readonly mcpUrl: string;
  /** Idempotent: closing twice is not an error, because shutdown paths race. */
  close(): Promise<void>;
}

/**
 * One route. Adding a URL to this server means adding an entry to the table in
 * `createRequestListener`, not editing a chain of conditionals that every
 * existing route has to be re-read to modify.
 */
interface Route {
  readonly matches: (req: http.IncomingMessage, url: URL) => boolean;
  readonly handle: (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<void> | void;
}

interface RequestListenerDeps {
  readonly projectRoot: string;
  readonly host: string;
  readonly handleEvents: ReturnType<typeof createEventHub>["handleConnection"];
  readonly handleMcp: ReturnType<typeof createMcpTransportHandler>["handleRequest"];
}

function isGet(req: http.IncomingMessage): boolean {
  return req.method === "GET";
}

/**
 * Compose the routing table. Exported for tests: it needs no port, no socket
 * and no shutdown, so a request can be exercised without binding anything.
 */
export function createRequestListener(deps: RequestListenerDeps): http.RequestListener {
  const handleApi = createApiHandler({ projectRoot: deps.projectRoot, handleEvents: deps.handleEvents });

  const routes: Route[] = [
    {
      // Anything under /api/ belongs to the REST API, so an unknown path here
      // is a 404 from the API — not a fall-through into the MCP catch-all.
      matches: (_req, url) => url.pathname.startsWith("/api/"),
      handle: async (req, res, url) => {
        if (await handleApi(req, res, url)) return;
        res.writeHead(404).end("Unknown API route");
      }
    },
    {
      matches: (req, url) => isGet(req) && (url.pathname === "/builder" || url.pathname.startsWith("/builder/")),
      handle: (_req, res, url) => serveBuilder(res, url.pathname)
    },
    {
      matches: (req, url) => isGet(req) && url.pathname === "/dashboard",
      handle: async (req, res, url) => {
        try {
          // One language at a time: ?lang=es|en wins, then Accept-Language, then es.
          const lang = resolveDashboardLang(url, req.headers["accept-language"]);
          const html = await renderDashboard(deps.projectRoot, { lang });
          res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          res.end(html);
        } catch (error) {
          console.error(error);
          if (!res.headersSent) {
            res.writeHead(500, { "content-type": "text/plain" }).end("Dashboard error");
          }
        }
      }
    },
    {
      matches: (_req, url) => url.pathname === "/mcp" || url.pathname.startsWith("/mcp/"),
      handle: (req, res) => deps.handleMcp(req, res)
    }
  ];

  return async (req, res) => {
    // One guard, before any route: nothing mutating runs until it passes.
    const rejection = guardRequest(req, deps.host);
    if (rejection) {
      res.writeHead(rejection.status, { "content-type": "text/plain; charset=utf-8" });
      res.end(rejection.message);
      // 413 means the client announced more than we will ever read: hang up
      // instead of draining it. Smaller rejected bodies are drained so the
      // connection can be reused cleanly.
      if (rejection.status === 413) req.destroy();
      else req.resume();
      return;
    }

    // A request with no URL cannot match anything; treat it as the 404 it is
    // rather than letting `new URL` throw inside the connection handler.
    if (!req.url) {
      res.writeHead(404).end("Not Found");
      return;
    }
    const url = new URL(req.url, "http://localhost");

    const route = routes.find((candidate) => candidate.matches(req, url));
    if (!route) {
      res.writeHead(404).end("Not Found");
      return;
    }
    await route.handle(req, res, url);
  };
}

/** EADDRINUSE is the ordinary case; EACCES covers privileged low ports. */
function isPortUnavailable(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code === "EADDRINUSE" || code === "EACCES";
}

/**
 * One bind attempt. Both listeners are removed on settle: a server that is
 * retried on the next port would otherwise accumulate handlers and reject an
 * already-resolved promise on a later, unrelated error.
 */
function listenOnce(server: http.Server, host: string, port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.removeListener("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.removeListener("error", onError);
      const address = server.address() as AddressInfo | string | null;
      resolve(typeof address === "object" && address !== null ? address.port : port);
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

/**
 * Bind the first available port at or after `port`. Port 0 means "any free
 * port", which cannot be in use, so it never retries.
 */
async function listenWithFallback(
  server: http.Server,
  host: string,
  port: number,
  attempts: number
): Promise<number> {
  if (port === 0) return listenOnce(server, host, 0);

  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await listenOnce(server, host, port + attempt);
    } catch (error) {
      if (!isPortUnavailable(error)) throw error;
      lastError = error;
    }
  }
  throw new Error(
    `EN: no free port between ${port} and ${port + attempts - 1} on ${host}.\n` +
      `ES: no hay puerto libre entre ${port} y ${port + attempts - 1} en ${host}.\n` +
      `(${(lastError as Error | undefined)?.message ?? "unknown error"})`
  );
}

/**
 * Start a server and hand back the handle to it. Every URL it reports is built
 * from the port that was actually bound.
 */
export async function startSddHttpServer(options: SddHttpServerOptions): Promise<SddHttpServer> {
  const { projectRoot } = options;
  const host = options.host ?? DEFAULT_HTTP_HOST;
  const port = options.port ?? DEFAULT_HTTP_PORT;
  const attempts = options.portAttempts ?? DEFAULT_PORT_ATTEMPTS;

  const eventHub = createEventHub(projectRoot);
  const mcpTransport = createMcpTransportHandler();
  const server = http.createServer(
    createRequestListener({
      projectRoot,
      host,
      handleEvents: eventHub.handleConnection,
      handleMcp: mcpTransport.handleRequest
    })
  );

  let boundPort: number;
  try {
    boundPort = await listenWithFallback(server, host, port, attempts);
  } catch (error) {
    // Nothing is listening, but the hub already installed filesystem watchers.
    // Leaking them would keep the process alive after a failed start.
    eventHub.dispose();
    mcpTransport.dispose();
    throw error;
  }

  const baseUrl = `http://${hostForUrl(host)}:${boundPort}`;
  let closed = false;

  return {
    projectRoot,
    host,
    port: boundPort,
    baseUrl,
    builderUrl: `${baseUrl}/builder`,
    dashboardUrl: `${baseUrl}/dashboard`,
    mcpUrl: `${baseUrl}/mcp`,
    close: async () => {
      if (closed) return;
      closed = true;
      eventHub.dispose();
      mcpTransport.dispose();
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        // Open SSE streams never end on their own; without this, closing the
        // server would wait for clients that are designed never to disconnect.
        server.closeAllConnections();
      });
    }
  };
}
