// Workspace resolution for the HTTP transport: which target project the
// dashboard, the REST API, and the live events operate on.

import { existsSync } from "node:fs";
import path from "node:path";

/** Walk up from `start` until we find an SDD workspace (specs/ or a spec/ sidecar). */
export function findProjectRoot(start: string): string {
  let dir = start;
  for (;;) {
    if (existsSync(path.join(dir, "specs")) || existsSync(path.join(dir, "spec", "specs"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return start;
    dir = parent;
  }
}

/** SDD_PROJECT_ROOT wins; otherwise autodetect from the current directory. */
export function resolveProjectRoot(): string {
  return process.env.SDD_PROJECT_ROOT ?? findProjectRoot(process.cwd());
}
