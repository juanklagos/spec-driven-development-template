// Tasks -> GitHub issues for the SDD Builder (spec 009, R3).
// This is a TRANSPORT module by design: it shells out to the local `gh` CLI
// (execFile with an argument array — nothing is interpolated into a shell),
// so it lives in sdd-mcp, not in sdd-core. Task data comes from the shared
// sdd-core layer; every precondition failure is a clear bilingual error the
// UI can show as-is.
//
// Idempotency is title-based: before creating anything we list existing
// issues whose title carries the "[<specId>]" prefix and skip those tasks.

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { readSpecTasks, specsRoot } from "@juanklagos/sdd-core";

const execFileAsync = promisify(execFile);

const SPEC_ID_RE = /^\d{3}-[a-z0-9][a-z0-9-]*$/;
const MAX_TITLE_LENGTH = 240;
const ISSUE_LIST_LIMIT = 200;
const GH_TIMEOUT_MS = 30_000;

export type IssueTaskStatus = "created" | "skipped" | "failed";

export interface IssueTaskResult {
  /** Zero-based line of the task in tasks.md (same as sdd_read_tasks). */
  line: number;
  /** The task text as written in tasks.md. */
  task: string;
  /** The traceable issue title: "[<specId>] <task text>". */
  title: string;
  status: IssueTaskStatus;
  /** Issue URL when created. */
  url?: string;
  /** gh error output when failed. */
  error?: string;
}

export interface CreateIssuesResult {
  specId: string;
  /** GitHub repository slug (owner/name) the issues were created in. */
  repo: string;
  created: number;
  skipped: number;
  failed: number;
  results: IssueTaskResult[];
}

interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  /** True when the executable itself was not found (ENOENT). */
  missing: boolean;
}

async function run(command: string, args: string[], cwd: string): Promise<RunResult> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { cwd, timeout: GH_TIMEOUT_MS });
    return { ok: true, stdout: stdout.trim(), stderr: stderr.trim(), missing: false };
  } catch (error) {
    const err = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    return {
      ok: false,
      stdout: (err.stdout ?? "").trim(),
      stderr: (err.stderr ?? err.message ?? "").trim(),
      missing: err.code === "ENOENT"
    };
  }
}

/** Traceable issue title for one task; whitespace-collapsed and length-capped. */
export function buildIssueTitle(specId: string, taskText: string): string {
  const title = `[${specId}] ${taskText.trim().replace(/\s+/g, " ")}`;
  return title.length > MAX_TITLE_LENGTH ? `${title.slice(0, MAX_TITLE_LENGTH - 1)}…` : title;
}

/** Bilingual issue body linking back to the spec bundle. */
export function buildIssueBody(specId: string, taskText: string, bundleUrl: string): string {
  return [
    `Tarea pendiente de la spec \`${specId}\` creada desde el SDD Builder. / ` +
      `Pending task from spec \`${specId}\` created from the SDD Builder.`,
    "",
    `- Tarea / Task: ${taskText.trim()}`,
    `- Bundle: ${bundleUrl}`,
    "",
    "Al cerrar este issue, marca la tarea en tasks.md. / When closing this issue, tick the task in tasks.md."
  ].join("\n");
}

/**
 * Preconditions in order, each with a clear bilingual error: git repo with a
 * remote, `gh` installed, `gh` authenticated, remote resolvable as a GitHub
 * repository. Returns the repo slug and its web URL.
 */
async function resolveGithubRepo(projectRoot: string): Promise<{ repo: string; url: string }> {
  const inRepo = await run("git", ["rev-parse", "--is-inside-work-tree"], projectRoot);
  if (!inRepo.ok) {
    throw new Error(
      "Este workspace no es un repositorio git / This workspace is not a git repository — " +
        "ejecuta / run: git init && git remote add origin <url>"
    );
  }

  const remotes = await run("git", ["remote"], projectRoot);
  if (!remotes.ok || remotes.stdout === "") {
    throw new Error(
      "El repositorio git no tiene remote / The git repository has no remote — " +
        "ejecuta / run: git remote add origin <url>"
    );
  }

  const ghVersion = await run("gh", ["--version"], projectRoot);
  if (ghVersion.missing) {
    throw new Error(
      "gh CLI no está instalado / gh CLI is not installed — " +
        "instálalo desde / install it from https://cli.github.com y luego / then: gh auth login"
    );
  }
  if (!ghVersion.ok) {
    throw new Error(`gh CLI falló / gh CLI failed: ${ghVersion.stderr}`);
  }

  const auth = await run("gh", ["auth", "status"], projectRoot);
  if (!auth.ok) {
    throw new Error("gh no está autenticado / gh is not authenticated — ejecuta / run: gh auth login");
  }

  const view = await run("gh", ["repo", "view", "--json", "nameWithOwner,url"], projectRoot);
  if (!view.ok) {
    throw new Error(
      "No se pudo resolver el repositorio GitHub desde el remote / " +
        "Could not resolve the GitHub repository from the remote" +
        (view.stderr ? ` — ${view.stderr}` : "")
    );
  }

  let parsed: { nameWithOwner?: string; url?: string };
  try {
    parsed = JSON.parse(view.stdout) as { nameWithOwner?: string; url?: string };
  } catch {
    parsed = {};
  }
  if (!parsed.nameWithOwner || !parsed.url) {
    throw new Error(
      "Respuesta inesperada de gh repo view / Unexpected gh repo view response — " +
        "actualiza gh / update gh: https://cli.github.com"
    );
  }
  return { repo: parsed.nameWithOwner, url: parsed.url };
}

/**
 * Titles of existing issues (any state) carrying the "[<specId>]" prefix.
 * The gh search narrows the candidates; the local prefix filter is what
 * guarantees the match (GitHub search tokenizes brackets away).
 */
async function listExistingTitles(projectRoot: string, specId: string): Promise<Set<string>> {
  const prefix = `[${specId}]`;
  const list = await run(
    "gh",
    [
      "issue",
      "list",
      "--state",
      "all",
      "--limit",
      String(ISSUE_LIST_LIMIT),
      "--search",
      `"${specId}" in:title`,
      "--json",
      "title"
    ],
    projectRoot
  );
  if (!list.ok) {
    throw new Error(
      "No se pudieron listar los issues existentes / Could not list existing issues" +
        (list.stderr ? ` — ${list.stderr}` : "")
    );
  }
  let rows: { title?: string }[];
  try {
    rows = JSON.parse(list.stdout || "[]") as { title?: string }[];
  } catch {
    rows = [];
  }
  return new Set(rows.map((row) => (row.title ?? "").trim()).filter((title) => title.startsWith(prefix)));
}

/**
 * Create one GitHub issue per PENDING task of the spec via the gh CLI.
 * Sequential on purpose (stable ordering, friendlier to rate limits); a task
 * whose exact title already exists is skipped, and a failing `gh issue
 * create` marks only that task as failed without aborting the rest.
 */
export async function createIssuesForSpec(projectRoot: string, specId: string): Promise<CreateIssuesResult> {
  if (!SPEC_ID_RE.test(specId)) {
    throw new Error(`Invalid spec id: ${specId}`);
  }

  const { repo, url } = await resolveGithubRepo(projectRoot);
  const tasks = await readSpecTasks(projectRoot, specId);
  const pending = tasks.filter((task) => !task.done);
  const results: IssueTaskResult[] = [];

  if (pending.length > 0) {
    const specTasksPath = path.join(await specsRoot(projectRoot), specId, "tasks.md");
    const relBundle = path.relative(projectRoot, specTasksPath).split(path.sep).join("/");
    const bundleUrl = `${url}/blob/HEAD/${relBundle}`;
    const existing = await listExistingTitles(projectRoot, specId);

    for (const task of pending) {
      const title = buildIssueTitle(specId, task.text);
      if (existing.has(title)) {
        results.push({ line: task.line, task: task.text, title, status: "skipped" });
        continue;
      }
      const created = await run(
        "gh",
        ["issue", "create", "--title", title, "--body", buildIssueBody(specId, task.text, bundleUrl)],
        projectRoot
      );
      if (created.ok) {
        existing.add(title); // duplicate task texts within one run collapse too
        const issueUrl = created.stdout.split("\n").at(-1)?.trim();
        results.push({ line: task.line, task: task.text, title, status: "created", ...(issueUrl ? { url: issueUrl } : {}) });
      } else {
        results.push({
          line: task.line,
          task: task.text,
          title,
          status: "failed",
          error: created.stderr || "gh issue create failed"
        });
      }
    }
  }

  const count = (status: IssueTaskStatus): number => results.filter((row) => row.status === status).length;
  return {
    specId,
    repo,
    created: count("created"),
    skipped: count("skipped"),
    failed: count("failed"),
    results
  };
}
