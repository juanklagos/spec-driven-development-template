// Live events (SSE): GET /api/events streams workspace changes to the builder.
// A single fs.watch on the resolved specs/ directory feeds every connected
// client; bursts are grouped with a small debounce so one save (tmp + rename)
// or one script run produces a single event per kind.

import { watch, existsSync, type FSWatcher } from "node:fs";
import http from "node:http";
import path from "node:path";
import { specsRoot } from "@juanklagos/sdd-core";

const SSE_KEEPALIVE_MS = 25_000;
const WATCH_DEBOUNCE_MS = 300;

type ChangeKind = "board" | "specs";

export interface EventHub {
  /** Attach an incoming request as an SSE client. */
  handleConnection(req: http.IncomingMessage, res: http.ServerResponse): void;
  /** Close the watcher, timers, and every connected client. */
  dispose(): void;
}

export function createEventHub(projectRoot: string): EventHub {
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

  function handleConnection(req: http.IncomingMessage, res: http.ServerResponse): void {
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

  function dispose(): void {
    specsWatcher?.close();
    specsWatcher = null;
    if (keepAliveTimer) clearInterval(keepAliveTimer);
    keepAliveTimer = null;
    if (changeFlushTimer) clearTimeout(changeFlushTimer);
    changeFlushTimer = null;
    for (const client of sseClients) client.end();
    sseClients.clear();
  }

  return { handleConnection, dispose };
}
