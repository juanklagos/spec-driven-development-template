// Spec 027, R2. The bitácora read path: list + read restricted to the four
// logbook folders, with the traversal guard as the property under test —
// a fileName can NEVER step outside the folder it names.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { assertSafeBitacoraFileName, listBitacoraFiles, readBitacoraFile } from "./bitacora.js";

async function makeWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-bitacora-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "specs"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora", "handoffs"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora", "decisiones"), { recursive: true });
  return root;
}

describe("bitácora reads (spec 027 R2)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("lists markdown files sorted, so the last one is the latest handoff", async () => {
    const dir = path.join(root, "bitacora", "handoffs");
    await fs.writeFile(path.join(dir, "2026-07-22-handoff.md"), "old\n");
    await fs.writeFile(path.join(dir, "2026-07-23-handoff.md"), "new\n");
    await fs.writeFile(path.join(dir, "notes.txt"), "ignored: not markdown\n");

    const files = await listBitacoraFiles(root, "handoffs");
    expect(files).toEqual(["2026-07-22-handoff.md", "2026-07-23-handoff.md"]);
    expect(files.at(-1)).toBe("2026-07-23-handoff.md");
  });

  it("lists an absent folder as empty instead of throwing (fresh workspace)", async () => {
    await expect(listBitacoraFiles(root, "diaria")).resolves.toEqual([]);
  });

  it("reads one file's content back verbatim", async () => {
    const body = "# Handoff\n\nnext step: T3\n";
    await fs.writeFile(path.join(root, "bitacora", "handoffs", "2026-07-23-handoff.md"), body);

    const file = await readBitacoraFile(root, "handoffs", "2026-07-23-handoff.md");
    expect(file.content).toBe(body);
  });

  it("rejects every traversal-shaped fileName without touching the filesystem", async () => {
    const hostile = [
      "../spec.md",
      "..\\spec.md",
      "a/b.md",
      "a\\b.md",
      ".hidden.md",
      "no-extension",
      "",
      "../../.sdd/user-consent.log"
    ];
    for (const name of hostile) {
      expect(() => assertSafeBitacoraFileName(name), name).toThrow(/Invalid bitacora file name/);
      await expect(readBitacoraFile(root, "handoffs", name), name).rejects.toThrow(
        /Invalid bitacora file name/
      );
    }
  });

  it("accepts dots inside the name as long as there is no separator", async () => {
    // "a..b.md" contains ".." but cannot escape: no path separator.
    await fs.writeFile(path.join(root, "bitacora", "decisiones", "a..b.md"), "ok\n");
    const file = await readBitacoraFile(root, "decisiones", "a..b.md");
    expect(file.content).toBe("ok\n");
  });
});
