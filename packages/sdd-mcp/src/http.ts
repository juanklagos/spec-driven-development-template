import { randomUUID } from "node:crypto";
import { existsSync, watch, type FSWatcher } from "node:fs";
import http from "node:http";
import path from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import {
  checkGate,
  createSpec,
  listSpecs,
  parseTasksMarkdown,
  readBoard,
  readSpecDocument,
  setTaskDone,
  specsRoot,
  writeBoard,
  writeSpecDocument
} from "@juanklagos/sdd-core";
import { fileURLToPath } from "node:url";
import { createSddMcpServer } from "./server.js";

const port = Number(process.env.SDD_MCP_HTTP_PORT ?? "3334");

// Walk up from cwd until we find an SDD workspace (specs/ or a spec/ sidecar).
function findProjectRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(path.join(dir, "specs")) || existsSync(path.join(dir, "spec", "specs"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

const projectRoot = process.env.SDD_PROJECT_ROOT ?? findProjectRoot(process.cwd());
const transports: Record<string, StreamableHTTPServerTransport> = {};

// ---------------------------------------------------------------------------
// Live events (SSE): GET /api/events streams workspace changes to the builder.
// A single fs.watch on the resolved specs/ directory feeds every connected
// client; bursts are grouped with a small debounce so one save (tmp + rename)
// or one script run produces a single event per kind.
// ---------------------------------------------------------------------------

const SSE_KEEPALIVE_MS = 25_000;
const WATCH_DEBOUNCE_MS = 300;

type ChangeKind = "board" | "specs";

const sseClients = new Set<http.ServerResponse>();
let specsWatcher: FSWatcher | null = null;
let watcherStarting = false;
let keepAliveTimer: NodeJS.Timeout | null = null;
let changeFlushTimer: NodeJS.Timeout | null = null;
/** kind -> last relative path seen for that kind within the current burst. */
let pendingChanges = new Map<ChangeKind, string>();

function sseWrite(client: http.ServerResponse, frame: string): void {
  if (client.writableEnded || client.destroyed) return;
  try {
    client.write(frame);
  } catch {
    sseClients.delete(client);
  }
}

function sseBroadcast(event: string, data: unknown): void {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) sseWrite(client, frame);
}

function queueWatcherChange(relPath: string): void {
  const base = path.basename(relPath);
  // Ignore atomic-write temp files (sdd-core writes "<file>.tmp-<pid>" then
  // renames) and editor swap/hidden files; only real documents matter.
  if (!base || base.startsWith(".") || /\.tmp-\d+$/.test(base)) return;
  const kind: ChangeKind = base === "board.canvas" ? "board" : "specs";
  pendingChanges.set(kind, relPath.split(path.sep).join("/"));
  if (changeFlushTimer) clearTimeout(changeFlushTimer);
  changeFlushTimer = setTimeout(() => {
    changeFlushTimer = null;
    const batch = pendingChanges;
    pendingChanges = new Map();
    for (const [changeKind, changedPath] of batch) {
      sseBroadcast("change", { path: changedPath, kind: changeKind });
    }
  }, WATCH_DEBOUNCE_MS);
}

/**
 * Start the specs/ watcher if it is not running. Safe to call repeatedly:
 * if specs/ does not exist (yet) this is a no-op and will be retried lazily
 * on the next SSE connection / keep-alive tick instead of crashing.
 */
async function ensureSpecsWatcher(): Promise<void> {
  if (specsWatcher || watcherStarting) return;
  watcherStarting = true;
  try {
    const dir = await specsRoot(projectRoot);
    if (!existsSync(dir)) return;
    const watcher = watch(dir, { recursive: true }, (_eventType, filename) => {
      queueWatcherChange(typeof filename === "string" ? filename : "");
    });
    watcher.on("error", () => {
      watcher.close();
      if (specsWatcher === watcher) specsWatcher = null;
    });
    specsWatcher = watcher;
  } catch {
    // Workspace not resolvable right now; retry later.
  } finally {
    watcherStarting = false;
  }
}

function handleSseConnection(req: http.IncomingMessage, res: http.ServerResponse): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no"
  });
  res.write(`event: hello\ndata: ${JSON.stringify({ projectRoot })}\n\n`);
  sseClients.add(res);
  void ensureSpecsWatcher();

  if (!keepAliveTimer) {
    keepAliveTimer = setInterval(() => {
      // Comment keeps intermediaries from timing out the idle stream; the
      // `ping` event is observable from JS so the client can detect a dead
      // connection (EventSource never sees comments) and force a reconnect.
      for (const client of sseClients) sseWrite(client, ": keep-alive\n\nevent: ping\ndata: {}\n\n");
      void ensureSpecsWatcher(); // lazy retry if specs/ appeared later
    }, SSE_KEEPALIVE_MS);
  }

  req.on("close", () => {
    sseClients.delete(res);
    if (sseClients.size === 0 && keepAliveTimer) {
      clearInterval(keepAliveTimer);
      keepAliveTimer = null;
    }
  });
}

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

async function renderDashboard(): Promise<string> {
  let specsRows = "";
  let gateSummary = "";
  try {
    const specs = await listSpecs(projectRoot);
    specsRows = specs.length
      ? specs
          .map(
            (s) =>
              `<tr><td>${escapeHtml(s.id)}</td><td><code>${escapeHtml(s.dir)}</code></td><td><span class="badge ${
                /aprobado|approved|done|completada/i.test(s.status) ? "ok" : "pending"
              }">${escapeHtml(s.status)}</span></td></tr>`
          )
          .join("\n")
      : `<tr><td colspan="3">No specs found in this workspace / No hay specs en este workspace</td></tr>`;

    const gate = await checkGate(projectRoot);
    const gateClass = gate.ok ? "ok" : "fail";
    const gateText = gate.ok ? "OPEN — implementation allowed" : "CLOSED — refine spec/plan first";
    gateSummary = `<p class="badge ${gateClass}">Gate: ${gateText}</p>
      <p>${gate.approvedSpecs}/${gate.totalSpecs} specs approved · ${gate.errors} error(s) · ${gate.warnings} warning(s)</p>`;
  } catch (error) {
    gateSummary = `<p class="badge fail">Could not read SDD workspace at <code>${escapeHtml(projectRoot)}</code>: ${escapeHtml(
      error instanceof Error ? error.message : String(error)
    )}</p>
      <p>Set <code>SDD_PROJECT_ROOT</code> to a workspace that contains <code>specs/</code> (or a <code>spec/</code> sidecar).</p>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SDD Dashboard</title>
<style>
  :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { margin: 2rem auto; max-width: 60rem; padding: 0 1rem; line-height: 1.5; }
  h1 { font-size: 1.4rem; } code { font-size: 0.9em; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent); }
  .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 600; }
  .ok { background: #16a34a22; color: #16a34a; }
  .pending { background: #ca8a0422; color: #ca8a04; }
  .fail { background: #dc262622; color: #dc2626; }
  footer { margin-top: 2rem; font-size: 0.85rem; opacity: 0.7; }
</style>
</head>
<body>
<h1>🌱 SDD Dashboard</h1>
<p>Workspace: <code>${escapeHtml(projectRoot)}</code></p>
${gateSummary}
<table>
<thead><tr><th>Spec</th><th>Folder</th><th>Status</th></tr></thead>
<tbody>
${specsRows}
</tbody>
</table>
<footer>Golden rule: no code before approved spec and consistent plan. ·
<a href="https://github.com/juanklagos/spec-driven-development-template">spec-driven-development-template</a></footer>
</body>
</html>`;
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  if (res.headersSent) {
    res.end();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "content-length": Buffer.byteLength(payload, "utf8")
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => {
      if (!data.trim()) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

const BUILDER_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../builder/dist");
const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".woff2": "font/woff2"
};

async function handleApi(req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<boolean> {
  const route = url.pathname;
  try {
    if (req.method === "GET" && route === "/api/events") {
      handleSseConnection(req, res);
      return true;
    }
    if (req.method === "GET" && route === "/api/board") {
      const [canvas, specs] = await Promise.all([readBoard(projectRoot), listSpecs(projectRoot)]);
      const withTasks = await Promise.all(
        specs.map(async (s) => {
          try {
            const items = parseTasksMarkdown(await readSpecDocument(projectRoot, s.id, "tasks.md"));
            return { ...s, tasks: { done: items.filter((i) => i.done).length, total: items.length } };
          } catch {
            return { ...s, tasks: { done: 0, total: 0 } };
          }
        })
      );
      json(res, 200, { projectRoot, canvas, specs: withTasks });
      return true;
    }
    if (req.method === "PUT" && route === "/api/board") {
      await writeBoard(projectRoot, (await readBody(req)) as never);
      json(res, 200, { ok: true });
      return true;
    }
    const specMatch = route.match(/^\/api\/spec\/([^/]+)$/);
    if (req.method === "GET" && specMatch) {
      const id = specMatch[1];
      const [spec, plan, tasks] = await Promise.all([
        readSpecDocument(projectRoot, id, "spec.md"),
        readSpecDocument(projectRoot, id, "plan.md"),
        readSpecDocument(projectRoot, id, "tasks.md")
      ]);
      json(res, 200, { id, docs: { spec, plan, tasks }, tasks: parseTasksMarkdown(tasks) });
      return true;
    }
    const taskMatch = route.match(/^\/api\/spec\/([^/]+)\/tasks$/);
    if (req.method === "PUT" && taskMatch) {
      const id = taskMatch[1];
      const body = (await readBody(req)) as { line?: number; done?: boolean };
      if (typeof body?.line !== "number" || typeof body?.done !== "boolean") {
        json(res, 400, { error: "Expected { line: number, done: boolean }" });
        return true;
      }
      const current = await readSpecDocument(projectRoot, id, "tasks.md");
      await writeSpecDocument(projectRoot, id, "tasks.md", setTaskDone(current, body.line, body.done));
      json(res, 200, { tasks: parseTasksMarkdown(await readSpecDocument(projectRoot, id, "tasks.md")) });
      return true;
    }
    if (req.method === "POST" && route === "/api/spec") {
      const body = (await readBody(req)) as { name?: string; owner?: string };
      if (!body?.name) {
        json(res, 400, { error: "Expected { name: string, owner?: string }" });
        return true;
      }
      const result = await createSpec({ projectRoot, featureName: body.name, owner: body.owner ?? "Owner" });
      json(res, 201, result);
      return true;
    }
  } catch (error) {
    json(res, 422, { error: error instanceof Error ? error.message : String(error) });
    return true;
  }
  return false;
}

async function serveBuilder(res: http.ServerResponse, pathname: string): Promise<void> {
  const rel = pathname.replace(/^\/builder\/?/, "") || "index.html";
  const filePath = path.normalize(path.join(BUILDER_DIST, rel));
  if (!filePath.startsWith(BUILDER_DIST)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const data = await (await import("node:fs/promises")).readFile(filePath);
    res.writeHead(200, { "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    try {
      const index = await (await import("node:fs/promises")).readFile(path.join(BUILDER_DIST, "index.html"));
      res.writeHead(200, { "content-type": MIME[".html"] });
      res.end(index);
    } catch {
      res.writeHead(503, { "content-type": "text/plain; charset=utf-8" });
      res.end("SDD Builder not built yet. Run: cd builder && npm install && npm run build");
    }
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = req.url ? new URL(req.url, "http://localhost") : null;

  if (parsedUrl?.pathname.startsWith("/api/")) {
    if (await handleApi(req, res, parsedUrl)) return;
    res.writeHead(404).end("Unknown API route");
    return;
  }

  if (req.method === "GET" && parsedUrl && (parsedUrl.pathname === "/builder" || parsedUrl.pathname.startsWith("/builder/"))) {
    await serveBuilder(res, parsedUrl.pathname);
    return;
  }

  if (req.method === "GET" && req.url && (req.url === "/dashboard" || req.url.startsWith("/dashboard?"))) {
    try {
      const html = await renderDashboard();
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (error) {
      console.error(error);
      if (!res.headersSent) {
        res.writeHead(500, { "content-type": "text/plain" }).end("Dashboard error");
      }
    }
    return;
  }

  if (!req.url || !req.url.startsWith("/mcp")) {
    res.writeHead(404).end("Not Found");
    return;
  }

  try {
    if (req.method === "POST") {
      const body = await readBody(req);
      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

      let transport: StreamableHTTPServerTransport | undefined = sessionId ? transports[sessionId] : undefined;

      if (!transport && isInitializeRequest(body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (newSessionId) => {
            transports[newSessionId] = transport!;
          }
        });

        const mcpServer = createSddMcpServer();
        await mcpServer.connect(transport);
        await transport.handleRequest(req, res, body);
        return;
      }

      if (!transport) {
        json(res, 400, {
          jsonrpc: "2.0",
          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided"
          },
          id: null
        });
        return;
      }

      await transport.handleRequest(req, res, body);
      return;
    }

    if (req.method === "DELETE") {
      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;
      if (!sessionId || !transports[sessionId]) {
        json(res, 404, {
          jsonrpc: "2.0",
          error: {
            code: -32001,
            message: "Session not found"
          },
          id: null
        });
        return;
      }

      await transports[sessionId].handleRequest(req, res);
      delete transports[sessionId];
      return;
    }

    if (req.method === "GET") {
      res.writeHead(405, { allow: "POST, DELETE" });
      res.end("Method Not Allowed");
      return;
    }

    res.writeHead(405, { allow: "POST, DELETE" });
    res.end("Method Not Allowed");
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      json(res, 500, {
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});

server.listen(port, () => {
  console.error(`SDD MCP Streamable HTTP server listening on http://127.0.0.1:${port}/mcp`);
});

process.on("SIGINT", () => {
  specsWatcher?.close();
  if (keepAliveTimer) clearInterval(keepAliveTimer);
  if (changeFlushTimer) clearTimeout(changeFlushTimer);
  for (const client of sseClients) client.end();
  sseClients.clear();
  server.close();
});
