import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { checkGate, listSpecs } from "@sdd/sdd-core";
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

const server = http.createServer(async (req, res) => {
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
  server.close();
});
