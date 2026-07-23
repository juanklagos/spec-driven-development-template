// What counts as a workspace this app can open.
//
// There are two questions, and they have different answers:
//
//   "Does this folder LOOK like an SDD project?"  — a cheap synchronous check
//   of the two layouts the server recognises: a full `specs/` tree, or the
//   compact `spec/specs/` sidecar.
//
//   "Will the server ACCEPT it?"                  — a policy question that
//   sdd-core already answers, and that a folder can fail while looking
//   perfectly valid. The template checkout is the case that proves it: it has a
//   `specs/` directory and is still refused, because projects inside the
//   template must live under `www/`.
//
// The second question is delegated, never re-implemented. Asking it ourselves
// would mean two copies of a rule that only sdd-core is entitled to change —
// and the first version of this file did exactly that, so the picker happily
// accepted a folder the server then rejected, dumping the error into the page
// instead of the dialog the user was standing in.

import { existsSync } from "node:fs";
import path from "node:path";
import { ensureProjectRootAllowed } from "@juanklagos/sdd-core";

export interface WorkspaceRejection {
  /** The reason from sdd-core, already written for a human. */
  reason: string;
}

/** Layout only: the folder has somewhere for specs to live. */
export function hasSpecsLayout(dir: string): boolean {
  return existsSync(path.join(dir, "specs")) || existsSync(path.join(dir, "spec", "specs"));
}

/**
 * Null when the folder is usable, or the reason it is not. The two checks are
 * ordered so the common mistake — picking a folder that is not a project at all
 * — gets the explanation about SDD projects rather than a policy message about
 * template roots.
 */
export async function rejectionFor(dir: string): Promise<WorkspaceRejection | null> {
  if (!hasSpecsLayout(dir)) return { reason: "" };
  try {
    await ensureProjectRootAllowed(dir);
    return null;
  } catch (error) {
    return { reason: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * A remembered workspace can be renamed, unmounted, deleted or moved somewhere
 * the policy no longer allows between runs, so the stored path is a hint and
 * gets the same treatment as a freshly picked folder.
 */
export async function isUsableWorkspace(dir: string | null | undefined): Promise<boolean> {
  if (typeof dir !== "string" || dir.trim() === "") return false;
  return (await rejectionFor(dir)) === null;
}

/** The folder name, for window titles. Falls back to the full path at a root. */
export function workspaceLabel(dir: string): string {
  return path.basename(dir) || dir;
}
