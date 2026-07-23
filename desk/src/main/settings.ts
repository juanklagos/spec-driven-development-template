// Persisted desktop settings: which workspace was open, and in which language
// the native chrome is drawn.
//
// This module knows nothing about Electron. It is handed a file path, which is
// what makes it testable with a temp directory and keeps "where userData lives"
// a decision of the composition root rather than of every module that reads a
// setting.

import { promises as fs } from "node:fs";
import path from "node:path";
import { isLang, type Lang } from "./i18n.js";

export interface DeskSettings {
  /** Absolute path of the last workspace opened, or null on a first run. */
  projectRoot: string | null;
  lang: Lang;
}

export interface SettingsStore {
  read(): Promise<DeskSettings>;
  update(patch: Partial<DeskSettings>): Promise<DeskSettings>;
}

/**
 * Unknown keys and wrong types are dropped rather than trusted. A settings file
 * is an input like any other: it can be hand-edited, half-written by a crash,
 * or left over from a future version.
 */
function parse(raw: string, fallback: DeskSettings): DeskSettings {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (typeof parsed !== "object" || parsed === null) return fallback;

  const candidate = parsed as Record<string, unknown>;
  const projectRoot = candidate["projectRoot"];
  const lang = candidate["lang"];

  return {
    projectRoot: typeof projectRoot === "string" && projectRoot.trim() !== "" ? projectRoot : fallback.projectRoot,
    lang: isLang(lang) ? lang : fallback.lang
  };
}

export function createSettingsStore(filePath: string, defaults: DeskSettings): SettingsStore {
  // Reads are serialized behind the same chain as writes so a read never
  // observes a half-applied update.
  let queue: Promise<DeskSettings> = load();

  async function load(): Promise<DeskSettings> {
    try {
      return parse(await fs.readFile(filePath, "utf8"), defaults);
    } catch {
      // No file yet is the ordinary first-run case, not an error.
      return defaults;
    }
  }

  async function persist(settings: DeskSettings): Promise<DeskSettings> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    // Write-then-rename: a crash mid-write leaves the previous settings intact
    // instead of a truncated file that parse() would silently discard.
    const temporary = `${filePath}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
    await fs.rename(temporary, filePath);
    return settings;
  }

  return {
    read: () => {
      queue = queue.then((settings) => settings);
      return queue;
    },
    update: (patch) => {
      queue = queue.then((settings) => persist({ ...settings, ...patch }));
      return queue;
    }
  };
}
