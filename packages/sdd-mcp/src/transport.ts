// MCP Streamable HTTP transport: session lifecycle for POST/DELETE /mcp.
// The MCP server itself (tools/resources/prompts) is defined in server.ts.
//
// Sessions are reclaimed three ways, because no single one is sufficient:
//   - DELETE /mcp (well-behaved client) and the transport's own onclose;
//   - an idle sweep, because `enableJsonResponse: true` means there is no
//     long-lived SSE stream whose close would tell us a client walked away;
//   - a hard cap that evicts the least-recently-used session, so a hostile or
//     buggy client cannot grow the map without bound.
// Each session owns an McpServer instance, so a leaked session leaks megabytes.

import { randomUUID } from "node:crypto";
import http from "node:http";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { isPayloadTooLarge, json, readBody } from "./http-utils.js";
import { readPositiveIntEnv } from "./security.js";
import { createSddMcpServer } from "./server.js";

/** Idle time after which an abandoned session is reclaimed (default 10 min). */
export const SESSION_TTL_MS = readPositiveIntEnv("SDD_MCP_SESSION_TTL_MS", 10 * 60 * 1000);
/** Maximum concurrent sessions before the least-recently-used one is evicted. */
export const MAX_SESSIONS = readPositiveIntEnv("SDD_MCP_MAX_SESSIONS", 64);

/** Sweep often enough to honour the TTL, without a busy timer in production. */
function sweepIntervalMs(ttl: number): number {
  return Math.max(250, Math.min(60_000, Math.floor(ttl / 2)));
}

interface SessionRecord {
  transport: StreamableHTTPServerTransport;
  server: ReturnType<typeof createSddMcpServer>;
  lastSeen: number;
}

export interface McpTransportHandler {
  handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void>;
  /** Live session count. Exposed for tests and shutdown accounting only. */
  sessionCount(): number;
  /** Close every session and stop the sweep timer. */
  dispose(): void;
}

export function createMcpTransportHandler(): McpTransportHandler {
  const sessions = new Map<string, SessionRecord>();

  function reclaim(sessionId: string, reason: string): void {
    const record = sessions.get(sessionId);
    if (!record) return;
    sessions.delete(sessionId);
    // Close both halves: the transport frees sockets, the server frees the
    // tool/resource registry. Either may already be closed; that is fine.
    void Promise.resolve()
      .then(() => record.server.close())
      .catch(() => {});
    void Promise.resolve()
      .then(() => record.transport.close())
      .catch(() => {});
    if (reason !== "delete") {
      console.error(`[sdd-mcp] reclaimed MCP session ${sessionId} (${reason})`);
    }
  }

  function sweepIdleSessions(now = Date.now()): void {
    for (const [sessionId, record] of sessions) {
      if (now - record.lastSeen > SESSION_TTL_MS) reclaim(sessionId, "idle timeout");
    }
  }

  function enforceSessionCap(): void {
    while (sessions.size >= MAX_SESSIONS) {
      let oldestId: string | undefined;
      let oldestSeen = Number.POSITIVE_INFINITY;
      for (const [sessionId, record] of sessions) {
        if (record.lastSeen < oldestSeen) {
          oldestSeen = record.lastSeen;
          oldestId = sessionId;
        }
      }
      if (!oldestId) return;
      reclaim(oldestId, `session cap ${MAX_SESSIONS} reached`);
    }
  }

  const sweepTimer = setInterval(() => sweepIdleSessions(), sweepIntervalMs(SESSION_TTL_MS));
  // Never hold the process open just to sweep.
  sweepTimer.unref?.();

  function sessionIdFrom(req: http.IncomingMessage): string | undefined {
    const header = req.headers["mcp-session-id"];
    return Array.isArray(header) ? header[0] : header;
  }

  async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Cheap and idempotent: keeps the TTL honest even if the timer is starved.
      sweepIdleSessions();

      if (req.method === "POST") {
        const body = await readBody(req);
        const sessionId = sessionIdFrom(req);
        const existing = sessionId ? sessions.get(sessionId) : undefined;

        if (!existing && isInitializeRequest(body)) {
          enforceSessionCap();

          const mcpServer = createSddMcpServer();
          const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            enableJsonResponse: true,
            onsessioninitialized: (newSessionId) => {
              sessions.set(newSessionId, { transport, server: mcpServer, lastSeen: Date.now() });
            }
          });

          await mcpServer.connect(transport);

          // connect() installs the SDK's own onclose; chain instead of replacing
          // it, otherwise the server half never learns the transport is gone.
          const sdkOnClose = transport.onclose;
          transport.onclose = () => {
            sdkOnClose?.();
            if (transport.sessionId) reclaim(transport.sessionId, "transport closed");
          };

          await transport.handleRequest(req, res, body);
          return;
        }

        if (!existing) {
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

        existing.lastSeen = Date.now();
        await existing.transport.handleRequest(req, res, body);
        existing.lastSeen = Date.now();
        return;
      }

      if (req.method === "DELETE") {
        const sessionId = sessionIdFrom(req);
        const record = sessionId ? sessions.get(sessionId) : undefined;
        if (!sessionId || !record) {
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

        await record.transport.handleRequest(req, res);
        reclaim(sessionId, "delete");
        return;
      }

      res.writeHead(405, { allow: "POST, DELETE" });
      res.end("Method Not Allowed");
    } catch (error) {
      if (isPayloadTooLarge(error)) {
        json(res, 413, {
          jsonrpc: "2.0",
          error: { code: -32600, message: error.message },
          id: null
        });
        return;
      }
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

  function dispose(): void {
    clearInterval(sweepTimer);
    for (const sessionId of [...sessions.keys()]) reclaim(sessionId, "shutdown");
  }

  return { handleRequest, sessionCount: () => sessions.size, dispose };
}
