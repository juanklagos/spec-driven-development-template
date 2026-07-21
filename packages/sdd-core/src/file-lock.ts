// Per-path mutation queue: the single home of "two writers must not interleave".
//
// Every workspace mutation in this package is a read-modify-write cycle
// (read tasks.md -> tick one box -> write it back). Run two of them at once and
// both read the SAME pre-image, so the second write silently discards the first
// user's edit. `atomicWrite` (unique temp + rename) makes each individual write
// all-or-nothing, but atomicity alone cannot stop a lost update — only ordering
// can. This module provides that ordering, once, for every caller.
//
// Scope: in-process, and ONLY in-process. It serializes the MCP server / REST
// API / builder, which all run inside one Node process.
//
// Cross-process races are NOT handled here and are only partly handled
// elsewhere: `fs.mkdir` without `recursive` and `O_APPEND` writes make an
// individual operation atomic, but they do NOT make a scan-then-create
// sequence safe. Verified 2026-07-21: two concurrent `scripts/new-spec.sh`
// runs with different feature names still allocate the same number. Do not
// read this module as a cross-process guarantee.

import path from "node:path";

/** absolute path -> tail of the queue of mutations for that path. */
const queues = new Map<string, Promise<void>>();

/**
 * Run `mutate` only after every mutation already queued for `filePath` has
 * settled. Rejections never poison the queue: the next waiter still runs.
 *
 * `filePath` is the resource being mutated — a file for document edits, a
 * directory for operations that allocate names inside it (spec creation).
 */
export function withFileLock<T>(filePath: string, mutate: () => Promise<T>): Promise<T> {
  const key = path.resolve(filePath);
  const previous = queues.get(key) ?? Promise.resolve();

  const result = previous.then(mutate);
  // The queued tail must never reject, or one failed write would reject every
  // later write on the same path.
  const tail = result.then(
    () => undefined,
    () => undefined
  );

  queues.set(key, tail);
  void tail.then(() => {
    // Drop the entry once this is the last mutation, so the map cannot grow
    // without bound in a long-lived server.
    if (queues.get(key) === tail) queues.delete(key);
  });

  return result;
}
