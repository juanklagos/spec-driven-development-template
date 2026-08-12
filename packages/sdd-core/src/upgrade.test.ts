// Spec 029, T2/T3. Comparison and upgrade against a real sidecar on disk,
// including the three properties the spec states as its contract.
//
// The fixtures are built by copying the real framework payload, so a change
// to a template file cannot make these tests lie.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SIDECAR_FILES } from "./sidecar-files.js";
import { compareSidecar, readSidecarVersion, upgradeSidecar } from "./upgrade.js";
import { readFrameworkFile } from "./workspace.js";

let root: string;
const VERSION = "9.9.9";

/** A sidecar exactly as the installer would leave it, at `version`. */
async function installSidecar(version: string, profile = "recommended"): Promise<void> {
  for (const file of SIDECAR_FILES) {
    if (file.recommendedOnly && profile === "minimal") continue;
    let content: string;
    try {
      content = await readFrameworkFile(file.source);
    } catch {
      continue;
    }
    const target = path.join(root, file.target);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, "utf8");
  }
  await fs.mkdir(path.join(root, ".sdd"), { recursive: true });
  await fs.writeFile(
    path.join(root, ".sdd/TEMPLATE_VERSION"),
    `template_version=${version}\nprofile=${profile}\ninstalled_at=2026-01-01T00:00:00Z\n`,
    "utf8"
  );
}

async function read(rel: string): Promise<string> {
  return fs.readFile(path.join(root, rel), "utf8");
}

/** Snapshot of every file under the sidecar (path -> content). */
async function snapshot(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  async function walk(dir: string): Promise<void> {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.set(path.relative(root, full), await fs.readFile(full, "utf8"));
    }
  }
  await walk(root);
  return out;
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-upgrade-test-"));
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe("readSidecarVersion", () => {
  it("reads the marker", async () => {
    await installSidecar("2.2.1");
    expect(await readSidecarVersion(root)).toMatchObject({ templateVersion: "2.2.1", profile: "recommended" });
  });

  it("treats a missing marker as unknown, never as current", async () => {
    expect(await readSidecarVersion(root)).toEqual({ templateVersion: null, profile: null, installedAt: null });
    const comparison = await compareSidecar(root, VERSION);
    expect(comparison.templateVersion).toBeNull();
    expect(comparison.upToDate).toBe(false);
  });

  it("treats the installer's literal 'unknown' as unknown", async () => {
    await fs.mkdir(path.join(root, ".sdd"), { recursive: true });
    await fs.writeFile(path.join(root, ".sdd/TEMPLATE_VERSION"), "template_version=unknown\nprofile=minimal\n");
    expect((await readSidecarVersion(root)).templateVersion).toBeNull();
  });
});

describe("compareSidecar (R1)", () => {
  it("reports a freshly installed sidecar at this version as up to date", async () => {
    await installSidecar(VERSION);
    const comparison = await compareSidecar(root, VERSION);
    expect(comparison.upToDate).toBe(true);
    expect(comparison.staleFramework).toEqual([]);
    expect(comparison.divergedPreserved).toEqual([]);
    expect(comparison.files.every((f) => f.status === "current")).toBe(true);
  });

  it("classifies a tampered framework file as stale, not as user content", async () => {
    await installSidecar(VERSION);
    await fs.writeFile(path.join(root, "scripts/check-sdd-gate.sh"), "exit 0  # TAMPERED\n");
    const comparison = await compareSidecar(root, VERSION);
    // Same version number, still not up to date: content decides.
    expect(comparison.templateVersion).toBe(VERSION);
    expect(comparison.upToDate).toBe(false);
    expect(comparison.staleFramework.map((f) => f.target)).toContain("scripts/check-sdd-gate.sh");
  });

  it("classifies an edited preserved file as diverged", async () => {
    await installSidecar("2.2.1");
    await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\nmio: true\n");
    const comparison = await compareSidecar(root, VERSION);
    expect(comparison.divergedPreserved.map((f) => f.target)).toContain("sdd.policy.yaml");
    expect(comparison.staleFramework.map((f) => f.target)).not.toContain("sdd.policy.yaml");
  });

  it("reports a deleted file as missing", async () => {
    await installSidecar(VERSION);
    await fs.rm(path.join(root, "scripts/new-spec.sh"));
    const comparison = await compareSidecar(root, VERSION);
    expect(comparison.missing.map((f) => f.target)).toContain("scripts/new-spec.sh");
  });

  it("writes nothing (pure)", async () => {
    await installSidecar("2.2.1");
    const before = await snapshot();
    await compareSidecar(root, VERSION);
    expect(await snapshot()).toEqual(before);
  });

  it("honours the recorded profile: a minimal install misses no recommended-only file", async () => {
    await installSidecar(VERSION, "minimal");
    const comparison = await compareSidecar(root, VERSION);
    expect(comparison.missing).toEqual([]);
    expect(comparison.upToDate).toBe(true);
  });
});

describe("upgradeSidecar (R2)", () => {
  it("repairs framework files and moves the marker", async () => {
    await installSidecar("2.2.1");
    await fs.writeFile(path.join(root, "scripts/check-sdd-gate.sh"), "exit 0  # TAMPERED\n");

    const result = await upgradeSidecar(root, VERSION);

    expect(await read("scripts/check-sdd-gate.sh")).toBe(await readFrameworkFile("scripts/check-sdd-gate.sh"));
    expect(result.files.find((f) => f.target === "scripts/check-sdd-gate.sh")?.action).toBe("refreshed");
    expect(result.markerUpdated).toBe(true);
    expect(await read(".sdd/TEMPLATE_VERSION")).toContain(`template_version=${VERSION}`);
  });

  it("keeps the gate scripts executable", async () => {
    await installSidecar("2.2.1");
    await fs.writeFile(path.join(root, "scripts/check-sdd-gate.sh"), "exit 0\n");
    await upgradeSidecar(root, VERSION);
    const mode = (await fs.stat(path.join(root, "scripts/check-sdd-gate.sh"))).mode;
    expect(mode & 0o111).toBeGreaterThan(0);
  });

  it("recreates a deleted file", async () => {
    await installSidecar("2.2.1");
    await fs.rm(path.join(root, "scripts/new-spec.sh"));
    const result = await upgradeSidecar(root, VERSION);
    expect(result.files.find((f) => f.target === "scripts/new-spec.sh")?.action).toBe("created");
  });

  it("PROPERTY 1 — a diverged preserved file is left byte for byte and reported as pending", async () => {
    await installSidecar("2.2.1");
    const mine = "version: 1\n# mi politica, mia\n";
    await fs.writeFile(path.join(root, "sdd.policy.yaml"), mine);

    const result = await upgradeSidecar(root, VERSION);

    expect(await read("sdd.policy.yaml")).toBe(mine);
    expect(result.pending).toContain("sdd.policy.yaml");
    expect(result.files.find((f) => f.target === "sdd.policy.yaml")?.action).toBe("skipped");
  });

  it("writes a preserved file only when explicitly authorised", async () => {
    await installSidecar("2.2.1");
    await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\nmio: true\n");

    const result = await upgradeSidecar(root, VERSION, { applyPreserved: ["sdd.policy.yaml"] });

    expect(await read("sdd.policy.yaml")).toBe(await readFrameworkFile("templates/sidecar/sdd.policy.yaml"));
    expect(result.files.find((f) => f.target === "sdd.policy.yaml")?.action).toBe("overwritten");
    expect(result.pending).not.toContain("sdd.policy.yaml");
  });

  it("PROPERTY 2 — an up-to-date sidecar produces zero writes", async () => {
    await installSidecar(VERSION);
    const before = await snapshot();

    const result = await upgradeSidecar(root, VERSION);

    expect(result.alreadyCurrent).toBe(true);
    expect(result.markerUpdated).toBe(false);
    expect(result.files.every((f) => f.action === "unchanged")).toBe(true);
    expect(await snapshot()).toEqual(before);
  });

  it("PROPERTY 3 — upgrading twice equals upgrading once", async () => {
    await installSidecar("2.2.1");
    await fs.writeFile(path.join(root, "scripts/check-sdd-gate.sh"), "exit 0\n");

    await upgradeSidecar(root, VERSION);
    const afterFirst = await snapshot();
    const second = await upgradeSidecar(root, VERSION);

    expect(second.files.every((f) => f.action === "unchanged")).toBe(true);
    expect(await snapshot()).toEqual(afterFirst);
  });

  it("dry run reports the work and writes nothing (R2)", async () => {
    await installSidecar("2.2.1");
    await fs.writeFile(path.join(root, "scripts/check-sdd-gate.sh"), "exit 0\n");
    const before = await snapshot();

    const result = await upgradeSidecar(root, VERSION, { dryRun: true });

    expect(result.files.some((f) => f.action === "planned")).toBe(true);
    expect(result.markerUpdated).toBe(false);
    expect(await snapshot()).toEqual(before);
  });
});
