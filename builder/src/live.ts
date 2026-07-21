// Live sync client: subscribes to GET /api/events (SSE) and feeds the store.
// The server emits:
//   - `hello`    -> { projectRoot }            on connect
//   - `change`   -> { path, kind: board|specs } debounced workspace changes
//   - `presence` -> { count }                  connected clients (spec 009, R4)
// EventSource has built-in retry, but we manage reconnection ourselves to get
// a simple exponential backoff and an accurate on/off indicator in the TopBar.

import { useBuilderStore } from "./store";
import type { ChangeKind, LiveChange } from "./types";

const RETRY_MIN_MS = 1000;
const RETRY_MAX_MS = 15_000;
/**
 * The server sends an observable `ping` event every ~25s. If we hear nothing
 * for this long the connection is presumed dead (proxies/tunnels can swallow
 * the TCP close without EventSource ever firing `error`) and we reconnect.
 */
const STALE_MS = 60_000;
const STALE_CHECK_MS = 10_000;

let source: EventSource | null = null;
let retryTimer: number | null = null;
let retryDelay = RETRY_MIN_MS;
let started = false;
let lastActivityAt = 0;

export function startLive(): void {
  if (started) return;
  started = true;
  window.setInterval(() => {
    if (source && Date.now() - lastActivityAt > STALE_MS) {
      source.close();
      source = null;
      useBuilderStore.getState().setLiveStatus("off");
      scheduleReconnect();
    }
  }, STALE_CHECK_MS);
  connect();
}

function connect(): void {
  source = new EventSource("/api/events");
  lastActivityAt = Date.now();

  source.onopen = () => {
    retryDelay = RETRY_MIN_MS;
    lastActivityAt = Date.now();
    useBuilderStore.getState().setLiveStatus("on");
  };

  source.onerror = () => {
    source?.close();
    source = null;
    useBuilderStore.getState().setLiveStatus("off");
    // Presence is unknown while offline; the server re-broadcasts on reconnect.
    useBuilderStore.getState().setPresenceCount(0);
    scheduleReconnect();
  };

  source.addEventListener("hello", (event) => {
    lastActivityAt = Date.now();
    const data = parse<{ projectRoot?: string }>(event.data);
    if (typeof data?.projectRoot === "string") {
      useBuilderStore.getState().handleHello(data.projectRoot);
    }
  });

  source.addEventListener("ping", () => {
    lastActivityAt = Date.now();
  });

  source.addEventListener("presence", (event) => {
    lastActivityAt = Date.now();
    const data = parse<{ count?: number }>(event.data);
    if (typeof data?.count === "number" && data.count >= 0) {
      useBuilderStore.getState().setPresenceCount(data.count);
    }
  });

  source.addEventListener("change", (event) => {
    lastActivityAt = Date.now();
    const data = parse<LiveChange>(event.data);
    const kind: ChangeKind | undefined =
      data?.kind === "board" || data?.kind === "specs" ? data.kind : undefined;
    if (kind) void useBuilderStore.getState().handleLiveChange(kind);
  });
}

function scheduleReconnect(): void {
  if (retryTimer !== null) return;
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    connect();
  }, retryDelay);
  retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
}

function parse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
