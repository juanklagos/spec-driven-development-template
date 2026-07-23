// Owns the lifetime of the SDD HTTP server inside the desktop process.
//
// The window shows one workspace at a time, but the app outlives any single
// workspace: opening another project means closing one server and starting the
// next, in a process that must not die in between. That is a lifecycle, and
// this module is the only thing that owns it.
//
// The import is a deep path on purpose. `@juanklagos/sdd-mcp` resolves to
// dist/index.js, which is the stdio CLI: importing the package would start an
// MCP server on this process's stdio. The factory is what we want, so the
// factory is what we import.

import { startSddHttpServer, type SddHttpServer } from "@juanklagos/sdd-mcp/dist/http-server.js";

export interface ServerHost {
  /** The running server, or null before the first open and after close. */
  current(): SddHttpServer | null;
  /** Start a server for `projectRoot`, replacing whatever was running. */
  open(projectRoot: string): Promise<SddHttpServer>;
  close(): Promise<void>;
}

export interface ServerHostOptions {
  /** Preferred port; the server falls back to the next free one (023 R2). */
  port?: number;
  /** Called after every successful open, including workspace switches. */
  onOpened?: (server: SddHttpServer) => void;
}

export function createServerHost(options: ServerHostOptions = {}): ServerHost {
  let server: SddHttpServer | null = null;

  // Every mutation goes through one chain. Without it, a fast "open A, open B"
  // can interleave into "start A, start B, close A, close B" and leave the app
  // pointing at a server that is already gone — or leak one that nobody closes.
  let queue: Promise<unknown> = Promise.resolve();

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation, operation);
    // Failures must not poison the chain: the next operation should still run.
    queue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  async function stopCurrent(): Promise<void> {
    const running = server;
    server = null;
    if (running) await running.close();
  }

  return {
    current: () => server,

    open: (projectRoot) =>
      enqueue(async () => {
        await stopCurrent();
        const started = await startSddHttpServer({
          projectRoot,
          ...(options.port === undefined ? {} : { port: options.port })
        });
        server = started;
        options.onOpened?.(started);
        return started;
      }),

    close: () => enqueue(stopCurrent)
  };
}
