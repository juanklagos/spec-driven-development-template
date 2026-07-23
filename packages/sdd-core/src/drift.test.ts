// Spec 025, R6. Drift is pure over (approval, date, scope, git log) but the git
// half is easy to get wrong (dates, path filters, non-repos), so it is tested
// against a REAL throwaway git repo with controlled commit dates.

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { computeSpecDrift } from "./drift.js";

const run = promisify(execFile);

// --- pure short-circuits (no git needed) ------------------------------------

describe("computeSpecDrift — states that never touch git", () => {
  it("is 'unknown' when the spec is not approved (no baseline)", async () => {
    const d = await computeSpecDrift("/nonexistent", { approved: false, approvalDate: "2026-01-01", fileScope: ["src/"] });
    expect(d).toEqual({ state: "unknown", commits: [] });
  });

  it("is 'unscoped' when approved but no File scope is declared", async () => {
    const d = await computeSpecDrift("/nonexistent", { approved: true, approvalDate: "2026-01-01", fileScope: [] });
    expect(d.state).toBe("unscoped");
  });

  it("is 'unknown' when the approval date is the placeholder or empty", async () => {
    expect((await computeSpecDrift("/x", { approved: true, approvalDate: "YYYY-MM-DD", fileScope: ["src/"] })).state).toBe("unknown");
    expect((await computeSpecDrift("/x", { approved: true, approvalDate: "   ", fileScope: ["src/"] })).state).toBe("unknown");
  });

  it("is 'unknown' in a directory that is not a git repository", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "drift-nogit-"));
    try {
      const d = await computeSpecDrift(dir, { approved: true, approvalDate: "2026-01-01", fileScope: ["src/"] });
      expect(d.state).toBe("unknown");
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});

// --- against a real git repo ------------------------------------------------

describe("computeSpecDrift — real git history", () => {
  let repo: string;

  async function commit(file: string, content: string, isoDate: string): Promise<void> {
    await fs.mkdir(path.dirname(path.join(repo, file)), { recursive: true });
    await fs.writeFile(path.join(repo, file), content);
    await run("git", ["add", "-A"], { cwd: repo });
    const env = { ...process.env, GIT_AUTHOR_DATE: isoDate, GIT_COMMITTER_DATE: isoDate };
    await run("git", ["commit", "-m", `change ${file} @ ${isoDate}`], { cwd: repo, env });
  }

  beforeEach(async () => {
    repo = await fs.mkdtemp(path.join(os.tmpdir(), "drift-repo-"));
    await run("git", ["init", "-q"], { cwd: repo });
    await run("git", ["config", "user.email", "t@test"], { cwd: repo });
    await run("git", ["config", "user.name", "Test"], { cwd: repo });
    await run("git", ["config", "commit.gpgsign", "false"], { cwd: repo });
  });

  afterEach(async () => {
    await fs.rm(repo, { recursive: true, force: true });
  });

  it("is 'drifted' when a scoped file changed AFTER the approval date", async () => {
    await commit("src/pay/index.ts", "v1", "2026-03-01T10:00:00");
    await commit("src/pay/index.ts", "v2", "2026-03-10T10:00:00"); // after approval

    const d = await computeSpecDrift(repo, { approved: true, approvalDate: "2026-03-05", fileScope: ["src/pay/"] });
    expect(d.state).toBe("drifted");
    expect(d.commits.length).toBeGreaterThan(0);
    expect(d.commits[0].subject).toContain("src/pay/index.ts");
    expect(d.commits[0].hash).toMatch(/^[0-9a-f]+$/);
  });

  it("is 'clean' when the only commits to the scope predate approval", async () => {
    await commit("src/pay/index.ts", "v1", "2026-03-01T10:00:00");
    await commit("docs/readme.md", "later, but out of scope", "2026-03-20T10:00:00");

    const d = await computeSpecDrift(repo, { approved: true, approvalDate: "2026-03-05", fileScope: ["src/pay/"] });
    expect(d.state).toBe("clean");
    expect(d.commits).toHaveLength(0);
  });

  it("does not count same-day (approval-day) commits as drift", async () => {
    await commit("src/pay/index.ts", "v1", "2026-03-05T09:00:00"); // same day as approval

    const d = await computeSpecDrift(repo, { approved: true, approvalDate: "2026-03-05", fileScope: ["src/pay/"] });
    expect(d.state).toBe("clean");
  });

  it("only reports commits inside the declared scope", async () => {
    await commit("src/pay/index.ts", "v1", "2026-03-01T10:00:00");
    await commit("src/auth/login.ts", "changed", "2026-03-10T10:00:00"); // after approval, other scope

    const d = await computeSpecDrift(repo, { approved: true, approvalDate: "2026-03-05", fileScope: ["src/pay/"] });
    expect(d.state).toBe("clean");
  });
});
