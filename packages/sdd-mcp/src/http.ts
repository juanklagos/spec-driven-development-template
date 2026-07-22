#!/usr/bin/env node
// HTTP entrypoint: thin composition of the transport's cohesive modules.
//   workspace.ts  -> which target project we operate on
//   events.ts     -> SSE live events (GET /api/events)
//   api.ts        -> REST API for the SDD Builder (/api/*)
//   static.ts     -> built builder frontend (/builder)
//   dashboard.ts  -> read-only HTML dashboard (/dashboard)
//   transport.ts  -> MCP Streamable HTTP sessions (/mcp)
//   security.ts   -> bind host + origin/content-type guard (applied once, here)
// All SDD logic lives in @juanklagos/sdd-core; nothing here duplicates it.

import http from "node:http";
import { createApiHandler } from "./api.js";
import { renderDashboard, resolveDashboardLang } from "./dashboard.js";
import { createEventHub } from "./events.js";
import { guardRequest, hostForUrl, isLoopbackHost, resolveBindHost } from "./security.js";
import { serveBuilder } from "./static.js";
import { createMcpTransportHandler } from "./transport.js";
import { resolveProjectRoot } from "./workspace.js";

const port = Number(process.env.SDD_MCP_HTTP_PORT ?? "3334");
const host = resolveBindHost();
const projectRoot = resolveProjectRoot();

const eventHub = createEventHub(projectRoot);
const handleApi = createApiHandler({ projectRoot, handleEvents: eventHub.handleConnection });
const mcpTransport = createMcpTransportHandler();

const server = http.createServer(async (req, res) => {
  const parsedUrl = req.url ? new URL(req.url, "http://localhost") : null;

  // One guard, before any route: nothing mutating runs until it passes.
  const rejection = guardRequest(req, host);
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
      // One language at a time: ?lang=es|en wins, then Accept-Language, then es.
      const lang = resolveDashboardLang(parsedUrl, req.headers["accept-language"]);
      const html = await renderDashboard(projectRoot, { lang });
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

  await mcpTransport.handleRequest(req, res);
});

// The printed URL is the address we actually bound to, not an assumption.
server.listen(port, host, () => {
  // The board first, and by name. This used to print the /mcp URL alone, so somebody
  // following START_HERE opened a protocol endpoint and concluded it was broken.
  const base = `http://${hostForUrl(host)}:${port}`;
  console.error(
    [
      `SDD Builder — el lienzo / the board:  ${base}/builder`,
      `Dashboard:                            ${base}/dashboard`,
      `MCP endpoint (para tu agente / for your agent):  ${base}/mcp`
    ].join("\n")
  );
  if (!isLoopbackHost(host)) {
    console.error(
      [
        `WARNING: bound to a non-loopback address (${host}). This server has NO authentication:`,
        "anyone who can reach this port can read, create and approve specs, and run gh as you.",
        `ADVERTENCIA: escuchando en una dirección no-loopback (${host}). Este servidor NO tiene autenticación:`,
        "cualquiera que alcance este puerto puede leer, crear y aprobar specs, y ejecutar gh como tú."
      ].join("\n")
    );
  }
});

// A single malformed request must never take the server down. Both handlers log
// and keep serving; the request that caused it has already failed on its own.
process.on("uncaughtException", (error) => {
  console.error("[sdd-mcp] uncaught exception (server keeps running):", error);
});
process.on("unhandledRejection", (reason) => {
  console.error("[sdd-mcp] unhandled rejection (server keeps running):", reason);
});

function shutdown(): void {
  eventHub.dispose();
  mcpTransport.dispose();
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
