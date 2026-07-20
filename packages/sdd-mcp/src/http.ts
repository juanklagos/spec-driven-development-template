// HTTP entrypoint: thin composition of the transport's cohesive modules.
//   workspace.ts  -> which target project we operate on
//   events.ts     -> SSE live events (GET /api/events)
//   api.ts        -> REST API for the SDD Builder (/api/*)
//   static.ts     -> built builder frontend (/builder)
//   dashboard.ts  -> read-only HTML dashboard (/dashboard)
//   transport.ts  -> MCP Streamable HTTP sessions (/mcp)
// All SDD logic lives in @juanklagos/sdd-core; nothing here duplicates it.

import http from "node:http";
import { createApiHandler } from "./api.js";
import { renderDashboard } from "./dashboard.js";
import { createEventHub } from "./events.js";
import { serveBuilder } from "./static.js";
import { createMcpTransportHandler } from "./transport.js";
import { resolveProjectRoot } from "./workspace.js";

const port = Number(process.env.SDD_MCP_HTTP_PORT ?? "3334");
const projectRoot = resolveProjectRoot();

const eventHub = createEventHub(projectRoot);
const handleApi = createApiHandler({ projectRoot, handleEvents: eventHub.handleConnection });
const mcpTransport = createMcpTransportHandler();

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
      const html = await renderDashboard(projectRoot);
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

server.listen(port, () => {
  console.error(`SDD MCP Streamable HTTP server listening on http://127.0.0.1:${port}/mcp`);
});

process.on("SIGINT", () => {
  eventHub.dispose();
  server.close();
});
