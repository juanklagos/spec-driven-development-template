// Spec 028, R2. runLegacyDiscovery against throwaway codebases: same signal
// classes and same suggested specs as scripts/legacy-discovery.sh, with no
// `rg` involved. The template-root refusal uses the real framework root
// (tests run inside this repo, so the guard must fire on it).

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { runLegacyDiscovery } from "./legacy.js";

let root: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-legacy-test-"));
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

async function writeCode(relative: string, content: string): Promise<void> {
  const file = path.join(root, relative);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
}

describe("runLegacyDiscovery (spec 028 R2)", () => {
  it("detects route + auth + commerce signals and suggests both baseline specs", async () => {
    await writeCode("src/routes.js", 'app.get("/api/users", handler);\napp.post("/api/orders", handler);\n');
    await writeCode("src/auth.js", "function login(user) { return verify(user); }\n");
    await writeCode("src/shop.js", "const checkout = (cart) => pay(cart);\n");

    const result = await runLegacyDiscovery(root);

    expect(result.routeSignals).toBe(2);
    expect(result.flowSignals).toBeGreaterThanOrEqual(3);
    expect(result.suggestedSpecs).toEqual(["001-authentication-baseline", "002-commerce-flow-baseline"]);

    const report = await fs.readFile(result.reportPath, "utf8");
    expect(report).toContain("Route/API signals: 2");
    expect(report).toContain("- 001-authentication-baseline");
    const routes = await fs.readFile(result.routesFile, "utf8");
    expect(routes).toContain("src/routes.js:1:");
  });

  it("suggests the account baseline for profile/settings flows", async () => {
    await writeCode("src/account.js", "function profile() {} // settings page\n");

    const result = await runLegacyDiscovery(root);

    expect(result.suggestedSpecs).toEqual(["003-account-management-baseline"]);
  });

  it("falls back to the core-system baseline when nothing matches", async () => {
    await writeCode("src/util.js", "export const add = (a, b) => a + b;\n");

    const result = await runLegacyDiscovery(root);

    expect(result.routeSignals).toBe(0);
    expect(result.flowSignals).toBe(0);
    expect(result.suggestedSpecs).toEqual(["001-core-system-baseline"]);
    // Zero-signal evidence files exist and are empty, like the bash output.
    expect(await fs.readFile(result.routesFile, "utf8")).toBe("");
  });

  it("skips hidden directories (rg --no-ignore still skips them)", async () => {
    await writeCode(".git/hooks/x.js", 'app.get("/api/hidden", h); // login\n');
    await writeCode("src/visible.js", "export const x = 1;\n");

    const result = await runLegacyDiscovery(root);

    expect(result.routeSignals).toBe(0);
    expect(result.flowSignals).toBe(0);
  });

  it("always writes under analysis/legacy-discovery inside the target", async () => {
    await writeCode("src/app.js", 'router.get("/api/x");\n');

    const result = await runLegacyDiscovery(root);

    expect(result.outDir).toBe(path.join(root, "analysis/legacy-discovery"));
    expect(result.reportPath).toBe(path.join(root, "analysis/legacy-discovery", "legacy-discovery-report.md"));
  });

  it("refuses the template root itself, like every other tool", async () => {
    const repoRoot = path.resolve(import.meta.dirname, "../../..");
    await expect(runLegacyDiscovery(repoRoot)).rejects.toThrow(/template root/);
  });
});
