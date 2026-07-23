// Spec 025 — drift semaphore. Pure and local: no LLM, no network. Crosses a
// spec's declared File scope with `git log` since its approval date to tell
// whether the code the spec governs changed AFTER it was approved. The judgement
// of whether that change contradicts the spec stays human (or delegated to the
// user's agent) — this only raises the flag.
//
// Coherent with bitacora/decisiones/2026-07-20-builder-sin-llamadas-a-llm.md.

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Enough to walk a busy scope without hanging the board on a slow repo. */
const GIT_TIMEOUT_MS = 5000;
/** The drawer lists the offenders; a cap keeps the payload bounded. */
const MAX_COMMITS = 20;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** ASCII unit separator: safe field delimiter inside a git --format line. */
const FIELD_SEP = "\u001f";

export type DriftState =
  /** Approved, scoped, and no commits touched the scope after approval. */
  | "clean"
  /** Approved and scoped, and the scope changed after the approval date. */
  | "drifted"
  /** Approved but declares no File scope — nothing to compare against. */
  | "unscoped"
  /** Not applicable/undeterminable: not approved, placeholder date, or no git. */
  | "unknown";

export interface DriftCommit {
  /** Short hash. */
  hash: string;
  /** Committer date, ISO 8601. */
  date: string;
  /** First line of the commit message. */
  subject: string;
}

export interface SpecDrift {
  state: DriftState;
  /** The commits that caused `drifted`; empty otherwise. */
  commits: DriftCommit[];
}

export interface DriftInput {
  /** isApprovedStatus(spec.status) — the ONE approval rule, resolved by caller. */
  approved: boolean;
  /** Raw "Approval date" value from spec.md (may be a placeholder or empty). */
  approvalDate: string;
  /** Paths from the spec's File scope section. */
  fileScope: string[];
}

const withState = (state: DriftState): SpecDrift => ({ state, commits: [] });

/**
 * Compute drift for one spec. Never throws: any git failure, a non-repo
 * workspace, a placeholder date or a missing scope all degrade to a neutral
 * state, because a false "clean" would be worse than an honest "unknown".
 */
export async function computeSpecDrift(projectRoot: string, input: DriftInput): Promise<SpecDrift> {
  // Not approved → there is no baseline to drift from (spec 025, scenario 5).
  if (!input.approved) return withState("unknown");
  // Approved but nothing declared → say so, don't fake "clean" (scenario 3).
  if (input.fileScope.length === 0) return withState("unscoped");

  const date = input.approvalDate.trim();
  // Placeholder ("YYYY-MM-DD") or empty date → cannot compare (scenario, R2).
  if (!ISO_DATE_RE.test(date)) return withState("unknown");

  if (!(await isGitRepo(projectRoot))) return withState("unknown");

  try {
    const { stdout } = await execFileAsync(
      "git",
      [
        "log",
        // Strictly AFTER the approval day: end-of-day cutoff means same-day
        // implementation commits (which usually predate approval) don't count.
        `--since=${date} 23:59:59`,
        `--max-count=${MAX_COMMITS}`,
        `--format=%h${FIELD_SEP}%cI${FIELD_SEP}%s`,
        "--",
        ...input.fileScope
      ],
      { cwd: projectRoot, timeout: GIT_TIMEOUT_MS }
    );

    const commits: DriftCommit[] = stdout
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => {
        const [hash, date2, subject] = line.split(FIELD_SEP);
        return { hash: hash ?? "", date: date2 ?? "", subject: subject ?? "" };
      });

    return { state: commits.length > 0 ? "drifted" : "clean", commits };
  } catch {
    // git missing, timeout, or a bad path spec: honest "unknown", not "clean".
    return withState("unknown");
  }
}

async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--is-inside-work-tree"], {
      cwd,
      timeout: GIT_TIMEOUT_MS
    });
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}
