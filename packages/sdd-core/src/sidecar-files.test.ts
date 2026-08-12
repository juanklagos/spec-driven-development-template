// Spec 029, T1. The classification and the installer must never disagree.
//
// This is the test the plan asks for by name: "un test que falle si el
// instalador copia un archivo que la clasificación no conoce". A file the
// bash copies but this module does not list would be invisible to every
// upgrade — the exact silent divergence spec 029 exists to remove — and no
// other test in the repo would notice.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { SIDECAR_FILES, sidecarFilesFor } from "./sidecar-files.js";

const REPO = path.resolve(__dirname, "../../..");
const INSTALLER = path.join(REPO, "scripts/install-spec-sidecar.sh");

/** Every `copy_if_absent`/`copy_framework_file` call, as (source, kind). */
function installerCopies(): Array<{ source: string; kind: "framework" | "preserved" }> {
  const script = fs.readFileSync(INSTALLER, "utf8");
  // Calls may wrap onto a second line with a trailing backslash.
  const joined = script.replace(/\\\n\s*/g, " ");
  const calls: Array<{ source: string; kind: "framework" | "preserved" }> = [];
  // Leading whitespace matters: the profile-specific copies live indented
  // inside an `if [ "$PROFILE" = "recommended" ]` block, and an anchored
  // pattern without `\s*` silently skipped exactly those three.
  const re = /^\s*(copy_if_absent|copy_framework_file)\s+"\$ROOT_DIR\/([^"]+)"/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(joined)) !== null) {
    calls.push({ source: match[2], kind: match[1] === "copy_framework_file" ? "framework" : "preserved" });
  }
  return calls;
}

describe("sidecar classification vs. the installer (spec 029, R1)", () => {
  it("parses the installer at all (guards against a silently empty test)", () => {
    const copies = installerCopies();
    expect(copies.length).toBeGreaterThan(20);
    expect(copies.some((c) => c.kind === "framework")).toBe(true);
  });

  it("knows every file the installer copies, with the same kind", () => {
    const known = new Map(SIDECAR_FILES.map((f) => [f.source, f.kind]));
    const unknown: string[] = [];
    const mismatched: string[] = [];

    for (const copy of installerCopies()) {
      const kind = known.get(copy.source);
      if (kind === undefined) unknown.push(copy.source);
      else if (kind !== copy.kind) mismatched.push(`${copy.source}: installer=${copy.kind}, classification=${kind}`);
    }

    expect(
      unknown,
      "install-spec-sidecar.sh copies files the classification does not know. " +
        "An update would ignore them silently — add them to sidecar-files.ts."
    ).toEqual([]);
    expect(
      mismatched,
      "A file is framework-owned in one place and user-preserved in the other. " +
        "The two must agree or an update either clobbers user content or leaves a stale gate."
    ).toEqual([]);
  });

  it("lists no file the installer does not copy", () => {
    const copied = new Set(installerCopies().map((c) => c.source));
    const orphans = SIDECAR_FILES.filter((f) => !copied.has(f.source)).map((f) => f.source);
    expect(orphans, "sidecar-files.ts lists files the installer never installs").toEqual([]);
  });

  it("targets are unique and relative", () => {
    const targets = SIDECAR_FILES.map((f) => f.target);
    expect(new Set(targets).size).toBe(targets.length);
    expect(targets.every((t) => !t.startsWith("/") && !t.includes(".."))).toBe(true);
  });

  it("the minimal profile drops the recommended-only files", () => {
    const minimal = sidecarFilesFor("minimal");
    const recommended = sidecarFilesFor("recommended");
    expect(minimal.length).toBeLessThan(recommended.length);
    expect(minimal.some((f) => f.recommendedOnly)).toBe(false);
  });
});
