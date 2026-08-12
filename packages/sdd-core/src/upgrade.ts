// Spec 029 — comparing and updating an installed sidecar.
//
// Before this, updating was an unnamed side effect of reinstalling: the only
// way to find out what it would touch was to read the bash. The two functions
// here split that in half — `compareSidecar` answers "what would change?"
// with no writes at all, and `upgradeSidecar` acts on that answer, refreshing
// what the framework owns and never writing a preserved file the user has not
// explicitly named.
//
// The three properties from the spec are the contract:
//   1. a preserved file the user did not authorise stays byte-for-byte;
//   2. an up-to-date sidecar produces zero writes;
//   3. running it twice equals running it once.

import fs from "node:fs/promises";
import path from "node:path";
import { readFrameworkFile } from "./workspace.js";
import { SIDECAR_EXECUTABLES, sidecarFilesFor, type SidecarFile } from "./sidecar-files.js";

/** How one sidecar file stands against the running version's reference copy. */
export type SidecarFileStatus =
  /** Same bytes as the reference: nothing to do. */
  | "current"
  /** Framework-owned and different (stale or tampered): an update repairs it. */
  | "stale-framework"
  /** User-owned and different: an update lists it and asks. */
  | "diverged-preserved"
  /** Not on disk: an update creates it. */
  | "missing";

export interface SidecarFileReport {
  target: string;
  kind: SidecarFile["kind"];
  status: SidecarFileStatus;
}

export interface SidecarVersion {
  /** Value of `template_version` in .sdd/TEMPLATE_VERSION, or null when absent. */
  templateVersion: string | null;
  profile: string | null;
  installedAt: string | null;
}

export interface SidecarComparison extends SidecarVersion {
  sidecarRoot: string;
  /** Version of the running package — what an update would bring. */
  packageVersion: string;
  /**
   * true only when the marker exists AND equals the package version AND no
   * file differs. A matching number with a tampered gate is NOT up to date:
   * spec 021 watched exactly that survive a reinstall.
   */
  upToDate: boolean;
  files: SidecarFileReport[];
  /** Convenience buckets, same objects as `files`. */
  staleFramework: SidecarFileReport[];
  divergedPreserved: SidecarFileReport[];
  missing: SidecarFileReport[];
}

const MARKER = ".sdd/TEMPLATE_VERSION";

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

/** Parse `.sdd/TEMPLATE_VERSION`. A missing marker is "unknown", never "current". */
export async function readSidecarVersion(sidecarRoot: string): Promise<SidecarVersion> {
  const raw = await readIfExists(path.join(sidecarRoot, MARKER));
  if (raw === null) return { templateVersion: null, profile: null, installedAt: null };
  const value = (key: string): string | null => {
    const match = new RegExp(`^${key}=(.*)$`, "m").exec(raw);
    const found = match?.[1]?.trim();
    // The installer writes `unknown` when it cannot read its own version.
    return found && found !== "unknown" ? found : null;
  };
  return {
    templateVersion: value("template_version"),
    profile: value("profile"),
    installedAt: value("installed_at")
  };
}

/**
 * Compare an installed sidecar against the running package. Pure: reads only.
 * `profile` defaults to whatever the marker recorded, so a minimal install is
 * not reported as missing the recommended-only files.
 */
export async function compareSidecar(sidecarRoot: string, packageVersion: string): Promise<SidecarComparison> {
  const root = path.resolve(sidecarRoot);
  const version = await readSidecarVersion(root);
  const files: SidecarFileReport[] = [];

  for (const file of sidecarFilesFor(version.profile ?? "recommended")) {
    const current = await readIfExists(path.join(root, file.target));
    let reference: string | null = null;
    try {
      reference = await readFrameworkFile(file.source);
    } catch {
      // The payload does not carry this file in this layout; nothing to compare.
      continue;
    }
    let status: SidecarFileStatus;
    if (current === null) status = "missing";
    else if (current === reference) status = "current";
    else status = file.kind === "framework" ? "stale-framework" : "diverged-preserved";
    files.push({ target: file.target, kind: file.kind, status });
  }

  const staleFramework = files.filter((f) => f.status === "stale-framework");
  const divergedPreserved = files.filter((f) => f.status === "diverged-preserved");
  const missing = files.filter((f) => f.status === "missing");

  return {
    ...version,
    sidecarRoot: root,
    packageVersion,
    // Content decides, not just the number (plan.md, risk 4).
    upToDate:
      version.templateVersion === packageVersion &&
      staleFramework.length === 0 &&
      missing.length === 0 &&
      divergedPreserved.length === 0,
    files,
    staleFramework,
    divergedPreserved,
    missing
  };
}

export interface UpgradeOptions {
  /** Report what would happen and write nothing. */
  dryRun?: boolean;
  /**
   * Preserved files the user explicitly authorised, by target path. Anything
   * not named here is left byte-for-byte, no matter how far it diverged.
   */
  applyPreserved?: string[];
}

export type UpgradeAction = "refreshed" | "created" | "overwritten" | "skipped" | "unchanged" | "planned";

export interface UpgradeFileResult {
  target: string;
  kind: SidecarFile["kind"];
  action: UpgradeAction;
}

export interface UpgradeResult {
  sidecarRoot: string;
  fromVersion: string | null;
  toVersion: string;
  /** true when nothing needed doing (property 2: zero writes). */
  alreadyCurrent: boolean;
  files: UpgradeFileResult[];
  /** Preserved files that differ and were NOT written, awaiting a decision. */
  pending: string[];
  markerUpdated: boolean;
}

async function writeFile(target: string, content: string, executable: boolean): Promise<void> {
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content, "utf8");
  if (executable) await fs.chmod(target, 0o755).catch(() => {});
}

/**
 * Bring a sidecar up to the running version.
 *
 * Framework files are repaired unconditionally — they are the gate, and a
 * tampered one has already been observed surviving a reinstall (spec 021).
 * Preserved files are only written when named in `applyPreserved`.
 */
export async function upgradeSidecar(
  sidecarRoot: string,
  packageVersion: string,
  options: UpgradeOptions = {}
): Promise<UpgradeResult> {
  const comparison = await compareSidecar(sidecarRoot, packageVersion);
  const root = comparison.sidecarRoot;
  const authorised = new Set(options.applyPreserved ?? []);
  const dryRun = options.dryRun === true;

  const results: UpgradeFileResult[] = [];
  const pending: string[] = [];
  const byTarget = new Map(sidecarFilesFor(comparison.profile ?? "recommended").map((f) => [f.target, f]));

  for (const report of comparison.files) {
    const file = byTarget.get(report.target);
    if (!file) continue;
    const absolute = path.join(root, report.target);
    const executable = SIDECAR_EXECUTABLES.has(report.target);

    if (report.status === "current") {
      results.push({ target: report.target, kind: report.kind, action: "unchanged" });
      continue;
    }

    // A preserved file that differs is the user's call, always.
    if (report.status === "diverged-preserved" && !authorised.has(report.target)) {
      results.push({ target: report.target, kind: report.kind, action: "skipped" });
      pending.push(report.target);
      continue;
    }

    const action: UpgradeAction = dryRun
      ? "planned"
      : report.status === "missing"
        ? "created"
        : report.kind === "framework"
          ? "refreshed"
          : "overwritten";

    if (!dryRun) {
      const reference = await readFrameworkFile(file.source);
      await writeFile(absolute, reference, executable);
    }
    results.push({ target: report.target, kind: report.kind, action });
  }

  // The marker moves only when something actually moved with it, so a dry run
  // and an up-to-date sidecar both leave the tree untouched (property 2).
  const wrote = results.some((r) => r.action === "refreshed" || r.action === "created" || r.action === "overwritten");
  const markerStale = comparison.templateVersion !== packageVersion;
  let markerUpdated = false;
  if (!dryRun && (wrote || markerStale)) {
    const marker = path.join(root, MARKER);
    const previous = (await readIfExists(marker)) ?? "";
    const next = previous.includes("template_version=")
      ? previous.replace(/^template_version=.*$/m, `template_version=${packageVersion}`)
      : `template_version=${packageVersion}\nprofile=${comparison.profile ?? "recommended"}\n`;
    const updatedAt = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
    const withStamp = next.includes("upgraded_at=")
      ? next.replace(/^upgraded_at=.*$/m, `upgraded_at=${updatedAt}`)
      : `${next.replace(/\n?$/, "\n")}upgraded_at=${updatedAt}\n`;
    if (withStamp !== previous) {
      await fs.mkdir(path.dirname(marker), { recursive: true });
      await fs.writeFile(marker, withStamp, "utf8");
      markerUpdated = true;
    }
  }

  return {
    sidecarRoot: root,
    fromVersion: comparison.templateVersion,
    toVersion: packageVersion,
    alreadyCurrent: comparison.upToDate,
    files: results,
    pending,
    markerUpdated
  };
}
