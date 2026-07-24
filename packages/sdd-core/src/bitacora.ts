// Spec 027 — bitácora reads. The logbook always had four write paths
// (project log, daily, handoffs, decisions) and no read path, which turned
// handoffs into write-only memory for any agent connected over MCP/HTTP.
// These are the read counterparts: list a folder, read one file, nothing else.

import fs from "node:fs/promises";
import path from "node:path";
import { resolveSddRoot } from "./workspace.js";

export type BitacoraKind = "handoffs" | "decisiones" | "diaria" | "global";

const KIND_DIRS: Record<BitacoraKind, string> = {
  handoffs: path.join("bitacora", "handoffs"),
  decisiones: path.join("bitacora", "decisiones"),
  diaria: path.join("bitacora", "diaria"),
  global: path.join("bitacora", "global")
};

/**
 * Plain markdown basename only: no path separators, no leading dot, so a
 * `fileName` can never step outside the bitácora folder it names.
 */
const SAFE_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.md$/;

function kindDir(sddRoot: string, kind: BitacoraKind): string {
  const rel = KIND_DIRS[kind];
  if (!rel) {
    throw new Error(`Unknown bitacora kind: ${String(kind)}. Use handoffs, decisiones, diaria or global.`);
  }
  return path.join(sddRoot, rel);
}

export function assertSafeBitacoraFileName(fileName: string): void {
  if (!SAFE_FILE_RE.test(fileName)) {
    throw new Error(
      `Invalid bitacora file name: ${JSON.stringify(fileName)}. ` +
        "Expected a plain markdown basename such as 2026-03-18-handoff.md (no path separators)."
    );
  }
}

/**
 * Markdown files of one bitácora folder, sorted. The YYYY-MM-DD naming
 * convention makes lexicographic order chronological, so `.at(-1)` is the
 * latest entry. A missing folder lists as empty instead of throwing: a fresh
 * workspace simply has no handoffs yet.
 */
export async function listBitacoraFiles(projectRoot: string, kind: BitacoraKind): Promise<string[]> {
  const dir = kindDir(await resolveSddRoot(projectRoot), kind);
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort();
}

export interface BitacoraFile {
  path: string;
  content: string;
}

export async function readBitacoraFile(
  projectRoot: string,
  kind: BitacoraKind,
  fileName: string
): Promise<BitacoraFile> {
  assertSafeBitacoraFileName(fileName);
  const filePath = path.join(kindDir(await resolveSddRoot(projectRoot), kind), fileName);
  return { path: filePath, content: await fs.readFile(filePath, "utf8") };
}
