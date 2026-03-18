import { randomUUID } from "node:crypto";
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createSddMcpServer } from "./server.js";

const port = Number(process.env.SDD_MCP_HTTP_PORT ?? "3334");
const transports: Record<string, StreamableHTTPServerTransport> = {};

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
