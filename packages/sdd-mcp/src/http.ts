#!/usr/bin/env node
// HTTP entrypoint: the CLI that owns a process and runs one server in it.
//
// Everything about *serving* moved to http-server.ts (spec 023 R1), so that the
// desktop shell and the tests can start, hold and close servers without
// inheriting a CLI's opinions. What stays here is exactly what a CLI owns and a
// library must not touch:
//   - reading configuration from the environment
//   - the startup banner
//   - process-wide signal and crash handlers
//
// Starting this module still starts a server, because `dist/http.js` is a
// declared bin (`sdd-mcp-http`) and `index.ts` reaches it with `await import`.

import {
  DEFAULT_HTTP_PORT,
  startSddHttpServer,
  type SddHttpServer
} from "./http-server.js";
import { isLoopbackHost, resolveBindHost } from "./security.js";
import { resolveProjectRoot } from "./workspace.js";

/** `SDD_MCP_HTTP_PORT` wins; a malformed value falls back to the default. */
function resolvePort(): number {
  const raw = process.env.SDD_MCP_HTTP_PORT;
  if (raw === undefined || raw.trim() === "") return DEFAULT_HTTP_PORT;
  const parsed = Number(raw);
  // 0 is meaningful ("any free port"), so the guard is >= 0, not > 0.
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 65535 ? parsed : DEFAULT_HTTP_PORT;
}

function announce(server: SddHttpServer, requestedPort: number): void {
  // The board first, and by name. This used to print the /mcp URL alone, so somebody
  // following START_HERE opened a protocol endpoint and concluded it was broken.
  const lines = [
    `SDD Builder — el lienzo / the board:  ${server.builderUrl}`,
    `Dashboard:                            ${server.dashboardUrl}`,
    `MCP endpoint (para tu agente / for your agent):  ${server.mcpUrl}`
  ];

  // Silence about a port change would send people to a URL nobody is serving.
  if (requestedPort !== 0 && server.port !== requestedPort) {
    lines.unshift(
      `Puerto ${requestedPort} ocupado; usando ${server.port}. / Port ${requestedPort} was busy; using ${server.port}.`,
      ""
    );
  }

  console.error(lines.join("\n"));

  if (!isLoopbackHost(server.host)) {
    console.error(
      [
        `WARNING: bound to a non-loopback address (${server.host}). This server has NO authentication:`,
        "anyone who can reach this port can read, create and approve specs, and run gh as you.",
        `ADVERTENCIA: escuchando en una dirección no-loopback (${server.host}). Este servidor NO tiene autenticación:`,
        "cualquiera que alcance este puerto puede leer, crear y aprobar specs, y ejecutar gh como tú."
      ].join("\n")
    );
  }
}

const requestedPort = resolvePort();

// Startup is a distinct failure from a hot-path crash (spec 021, D2). If binding
// never succeeds, say so — naming the port and the env var that changes it — and
// exit non-zero. The generic uncaughtException handler below MUST NOT be
// installed until we are listening, or a bind failure would be logged as
// "server keeps running" (a lie) and the process would exit 0.
let server: SddHttpServer;
try {
  server = await startSddHttpServer({
    projectRoot: resolveProjectRoot(),
    host: resolveBindHost(),
    port: requestedPort
  });
} catch (error) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(
    [
      `sdd-mcp: could not start the HTTP server on port ${requestedPort}.`,
      `sdd-mcp: no se pudo arrancar el servidor HTTP en el puerto ${requestedPort}.`,
      "Set SDD_MCP_HTTP_PORT to a free port and try again. / Fija SDD_MCP_HTTP_PORT a un puerto libre y reintenta.",
      "",
      detail
    ].join("\n")
  );
  process.exit(1);
}

announce(server, requestedPort);

// Now that we are listening, "server keeps running" is true: a single malformed
// request must never take the server down. Both handlers log and keep serving;
// the request that caused it has already failed on its own. These are installed
// AFTER a successful start on purpose (spec 021, T5): before listening, a
// startup error must win, not be swallowed as a survivable hot-path crash.
process.on("uncaughtException", (error) => {
  console.error("[sdd-mcp] uncaught exception (server keeps running):", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("[sdd-mcp] unhandled rejection (server keeps running):", reason);
});

function shutdown(): void {
  void server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
