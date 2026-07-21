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
// Cross-process races need the second primitive in this module,
// `withCrossProcessLock`: `fs.mkdir` without `recursive` and `O_APPEND` writes
// make an individual operation atomic, but they do NOT make a scan-then-create
// sequence safe. Verified 2026-07-21: before that lock existed, two concurrent
// `scripts/new-spec.sh` runs with different feature names allocated the same
// number in 5/5 trials. `withFileLock` alone is still in-process only.

import { promises as fs } from "node:fs";
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

// --- Cross-process lock ------------------------------------------------------
//
// `mkdir` (non-recursive) is the only atomic test-and-set that Node and bash
// both have on every filesystem this template supports, so it is the primitive
// both sides use.
//
// KEEP IN SYNC with sdd_acquire_lock / sdd_release_lock in
// scripts/lib/sdd-root.sh — same lock directory, same `owner` file layout
// (`<pid> <epoch-seconds> <agent>`), same stale timeout. scripts/new-spec.sh
// and reserveSpecDir are the two supported ways to create a spec, so they must
// contend for the SAME on-disk lock or the server and the script still hand out
// the same number.

const LOCK_STALE_MS = 30_000;
const LOCK_WAIT_MS = 20_000;
const LOCK_POLL_MS = 25;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Epoch seconds recorded by whoever holds the lock, or null if unreadable. */
async function lockStartedAt(lockDir: string): Promise<number | null> {
  try {
    const owner = await fs.readFile(path.join(lockDir, "owner"), "utf8");
    const seconds = Number(owner.trim().split(/\s+/)[1]);
    return Number.isFinite(seconds) ? seconds : null;
  } catch {
    return null;
  }
}

/**
 * Hold `lockDir` for the duration of `run`, waiting for any other process
 * (including a `new-spec.sh` run) that holds it.
 *
 * A lock left behind by a killed process is recognised as stale after
 * LOCK_STALE_MS and broken, so a crash cannot wedge the workspace forever.
 * The lock is always released, including when `run` throws.
 */
export async function withCrossProcessLock<T>(lockDir: string, run: () => Promise<T>): Promise<T> {
  const deadline = Date.now() + LOCK_WAIT_MS;

  for (;;) {
    try {
      await fs.mkdir(lockDir, { recursive: false });
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;

      const startedAt = await lockStartedAt(lockDir);
      if (startedAt !== null && Date.now() / 1000 - startedAt >= LOCK_STALE_MS / 1000) {
        await fs.rm(lockDir, { recursive: true, force: true });
        continue;
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `Timed out waiting for the allocation lock ${lockDir}. If no other tool is running, remove that directory. / ` +
            `Tiempo agotado esperando el lock ${lockDir}. Si ningún otro proceso está corriendo, elimina ese directorio.`
        );
      }
      await sleep(LOCK_POLL_MS);
    }
  }

  try {
    await fs.writeFile(
      path.join(lockDir, "owner"),
      `${process.pid} ${Math.floor(Date.now() / 1000)} node\n`,
      "utf8"
    );
  } catch {
    // Diagnostics only; never fail an allocation because the marker failed.
  }

  try {
    return await run();
  } finally {
    await fs.rm(lockDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
