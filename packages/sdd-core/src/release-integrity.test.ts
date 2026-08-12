// Spec 029, T11 (R9). The internal pin between published packages, checked
// where a human will actually see it fail: `npm test`.
//
// Evidence (D6, measured publishing 2.4.0): `sdd-mcp` pinned
// `"@juanklagos/sdd-core": "2.3.0"` exactly. Bumping the core to 2.4.0 made
// npm ignore the local tarball and fetch 2.3.0 from the registry, so the
// installed package died on startup with "does not provide an export named
// …". Only the npm-package smoke test saw it, and only because it installs
// real tarballs. This test makes the same mistake fail in one second instead
// of at publish time.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const REPO = path.resolve(__dirname, "../../..");

function readPackage(relative: string): { name: string; version: string; dependencies?: Record<string, string> } {
  return JSON.parse(fs.readFileSync(path.join(REPO, relative), "utf8"));
}

describe("release integrity: internal package pin (spec 029, R9)", () => {
  it("sdd-mcp pins exactly the sdd-core version this repo ships", () => {
    const core = readPackage("packages/sdd-core/package.json");
    const mcp = readPackage("packages/sdd-mcp/package.json");
    const pin = mcp.dependencies?.["@juanklagos/sdd-core"];

    expect(
      pin,
      "packages/sdd-mcp/package.json must depend on @juanklagos/sdd-core"
    ).toBeDefined();

    expect(
      pin,
      `Internal pin out of sync: sdd-core is ${core.version} but sdd-mcp asks for ${pin}. ` +
        "Fix packages/sdd-mcp/package.json — otherwise npm resolves the published " +
        "version instead of this one and the release ships broken (spec 029, D6)."
    ).toBe(core.version);
  });

  it("every published package shares one version (the repo releases as a unit)", () => {
    const versions = [
      "package.json",
      "packages/sdd-core/package.json",
      "packages/sdd-mcp/package.json",
      "packages/create-sdd-project/package.json"
    ].map((p) => [p, readPackage(p).version] as const);

    const distinct = new Set(versions.map(([, v]) => v));
    expect(
      distinct.size,
      `Versions diverged: ${versions.map(([p, v]) => `${p}=${v}`).join(", ")}. ` +
        "docs/en/37-versioning-strategy.md: the packages track one repository release."
    ).toBe(1);
  });

  it("the MCP server manifest carries that same version", () => {
    const core = readPackage("packages/sdd-core/package.json");
    const serverJson = JSON.parse(fs.readFileSync(path.join(REPO, "packages/sdd-mcp/server.json"), "utf8")) as {
      version?: string;
      packages?: Array<{ version?: string }>;
    };
    expect(serverJson.version, "packages/sdd-mcp/server.json version").toBe(core.version);
    for (const pkg of serverJson.packages ?? []) {
      expect(pkg.version, "packages/sdd-mcp/server.json packages[].version").toBe(core.version);
    }
  });
});
