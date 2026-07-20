// MCP Streamable HTTP transport: session lifecycle for POST/DELETE /mcp.
// The MCP server itself (tools/resources/prompts) is defined in server.ts.

import { randomUUID } from "node:crypto";
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { json, readBody } from "./http-utils.js";
import { createSddMcpServer } from "./server.js";

export interface McpTransportHandler {
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
}

export function createMcpTransportHandler(): McpTransportHandler {
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  function sessionIdFrom(req: http.IncomingMessage): string | undefined {
    const header = req.headers["mcp-session-id"];
    return Array.isArray(header) ? header[0] : header;
  }

  async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      if (req.method === "POST") {
        const body = await readBody(req);
        const sessionId = sessionIdFrom(req);

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
        const sessionId = sessionIdFrom(req);
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
  }

  return { handleRequest };
}
