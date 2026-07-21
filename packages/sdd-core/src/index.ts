import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { exists, getFrameworkRoot, listSpecs, resolveSddRoot, safeReadFile } from "./workspace.js";

const execFileAsync = promisify(execFile);

export type ScaffoldProfile = "minimal" | "recommended" | "full";

export interface CreateWorkspaceInput {
  frameworkRoot: string;
  projectName: string;
  assistant?: string;
  profile?: ScaffoldProfile;
  useSpecKit?: boolean;
}

export interface CreateWorkspaceResult {
  projectRoot: string;
  sddRoot: string;
  profile: ScaffoldProfile;
  assistant: string;
  usedSpecKit: boolean;
  layout: "full" | "sidecar";
}

export interface CreateSpecInput {
  projectRoot: string;
  featureName: string;
  owner?: string;
}

export interface CreateSpecResult {
  specId: string;
  specDir: string;
  indexUpdated: boolean;
}

export interface ValidationMessage {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: number;
  warnings: number;
  messages: ValidationMessage[];
}

export interface GateResult extends ValidationResult {
  approvedSpecs: number;
  totalSpecs: number;
}

export interface ConsentResult {
  logFile: string;
  summary: string;
  timestamp: string;
}

export interface FileOutputResult {
  path: string;
  content: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replace(/-+/g, "-");
}

export async function createWorkspace(input: CreateWorkspaceInput): Promise<CreateWorkspaceResult> {
  const frameworkRoot = path.resolve(input.frameworkRoot);
  const assistant = input.assistant ?? "codex";
  const profile = input.profile ?? "recommended";
  const useSpecKit = input.useSpecKit ?? true;
  const scriptPath = path.join(frameworkRoot, "scripts/create-www-project.sh");
  const args = [input.projectName, assistant];

  if (!useSpecKit) {
    args.push("--no-spec-kit");
  }

  if (profile === "minimal") {
    args.push("--minimal-template");
  } else if (profile === "full") {
    args.push("--full-template");
  } else {
    args.push("--recommended-template");
  }

  await execFileAsync("bash", [scriptPath, ...args], { cwd: frameworkRoot });

  const projectRoot = path.join(frameworkRoot, "www", slugify(input.projectName));
  const layout = profile === "full" ? "full" : "sidecar";
  return {
    projectRoot,
    sddRoot: layout === "sidecar" ? path.join(projectRoot, "spec") : projectRoot,
    profile,
    assistant,
    usedSpecKit: useSpecKit,
    layout
  };
}

export async function createSpec(input: CreateSpecInput): Promise<CreateSpecResult> {
  const projectRoot = path.resolve(input.projectRoot);
  const sddRoot = await resolveSddRoot(projectRoot);

  const specsRoot = path.join(sddRoot, "specs");
  const templateRoot = path.join(specsRoot, "_template");
  const slug = slugify(input.featureName);
  if (!slug) {
    throw new Error("Invalid feature name after slugify");
  }

  const currentSpecs = await listSpecs(projectRoot);
  const nextNumber = String(currentSpecs.length + 1).padStart(3, "0");
  const specId = `${nextNumber}-${slug}`;
  const specDir = path.join(specsRoot, specId);

  await fs.mkdir(specDir, { recursive: false });
  try {
    await fs.mkdir(path.join(specDir, "contracts"), { recursive: false });

    for (const file of ["spec.md", "plan.md", "tasks.md", "research.md", "history.md"] as const) {
      const template = await fs.readFile(path.join(templateRoot, file), "utf8");
      const content = template
        .replaceAll("[Feature Name]", input.featureName)
        .replaceAll("[Spec Number]", nextNumber);
      await fs.writeFile(path.join(specDir, file), content, "utf8");
    }

    const contractTemplate = await fs.readFile(path.join(templateRoot, "contracts/README.md"), "utf8");
    await fs.writeFile(path.join(specDir, "contracts/README.md"), contractTemplate, "utf8");
  } catch (error) {
    // Never leave a half-created bundle behind (e.g. missing specs/_template).
    await fs.rm(specDir, { recursive: true, force: true });
    throw error;
  }

  const indexPath = path.join(specsRoot, "INDEX.md");
  const owner = input.owner ?? "TBD / Por definir";
  const today = new Date().toISOString().slice(0, 10);
  const row = `| ${nextNumber} | ${slug} | Draft / Borrador | Medium / Media | ${owner} | ${today} |`;
  await appendLine(indexPath, row);

  return {
    specId,
    specDir,
    indexUpdated: true
  };
}

export async function validateProject(projectRoot: string): Promise<ValidationResult> {
  const root = await resolveSddRoot(projectRoot);
  const messages: ValidationMessage[] = [];

  await requireDir(root, "idea", messages);
  await requireDir(root, "specs", messages);
  await requireDir(root, "bitacora", messages);
  await requireFile(root, "idea/IDEA_GENERAL.md", messages);
  await requireFile(root, "specs/INDEX.md", messages);
  await requireDir(root, "specs/_template", messages);

  for (const file of ["spec.md", "plan.md", "tasks.md", "research.md", "history.md"] as const) {
    await requireFile(root, `specs/_template/${file}`, messages);
  }

  for (const dir of ["bitacora/global", "bitacora/diaria", "bitacora/handoffs", "bitacora/decisiones"] as const) {
    await requireDir(root, dir, messages);
  }

  if (!(await exists(path.join(root, "bitacora/global/PROJECT_LOG.md")))) {
    messages.push({
      level: "warning",
      code: "missing-project-log",
      message: "bitacora/global/PROJECT_LOG.md is missing",
      path: "bitacora/global/PROJECT_LOG.md"
    });
  }

  const specs = await listSpecs(root);
  if (specs.length === 0) {
    messages.push({
      level: "warning",
      code: "no-specs",
      message: "No numbered spec directories found in specs/.",
      path: "specs"
    });
  } else {
    for (const spec of specs) {
      for (const file of ["spec.md", "plan.md", "tasks.md", "research.md", "history.md"] as const) {
        if (!(await exists(path.join(spec.dir, file)))) {
          messages.push({
            level: "error",
            code: "missing-spec-file",
            message: `${spec.id} missing ${file}`,
            path: path.join("specs", spec.id, file)
          });
        }
      }
    }
  }

  return summarize(messages);
}

export async function checkGate(projectRoot: string): Promise<GateResult> {
  const root = await resolveSddRoot(projectRoot);
  const messages: ValidationMessage[] = [];
  const specs = await listSpecs(root);
  let approvedSpecs = 0;

  if (specs.length === 0) {
    messages.push({
      level: "warning",
      code: "no-specs",
      message: "No numbered specs found; gate check skipped.",
      path: "specs"
    });
    return { ...summarize(messages), approvedSpecs, totalSpecs: 0 };
  }

  for (const spec of specs) {
    const specPath = path.join(spec.dir, "spec.md");
    const planPath = path.join(spec.dir, "plan.md");
    const tasksPath = path.join(spec.dir, "tasks.md");
    const specContent = await fs.readFile(specPath, "utf8");

    if (!/Estado \/ Status/i.test(specContent)) {
      messages.push({
        level: "error",
        code: "missing-status-section",
        message: `${spec.id}/spec.md missing approval status section`,
        path: path.join("specs", spec.id, "spec.md")
      });
      continue;
    }

    if (spec.status.toLowerCase() === "aprobado" || spec.status.toLowerCase() === "approved") {
      approvedSpecs += 1;

      if (/YYYY-MM-DD/.test(specContent)) {
        messages.push({
          level: "error",
          code: "placeholder-approval-date",
          message: `${spec.id} approved but approval date is still a placeholder`,
          path: path.join("specs", spec.id, "spec.md")
        });
      }

      if (/Nombre o rol/.test(specContent)) {
        messages.push({
          level: "error",
          code: "placeholder-approved-by",
          message: `${spec.id} approved but approved by is still a placeholder`,
          path: path.join("specs", spec.id, "spec.md")
        });
      }

      if (/Approval evidence.*:\s*$/m.test(specContent)) {
        messages.push({
          level: "error",
          code: "missing-approval-evidence",
          message: `${spec.id} approved but approval evidence is empty`,
          path: path.join("specs", spec.id, "spec.md")
        });
      }

      const planContent = await safeReadFile(planPath);
      const planSignals = [
        /Riesgo|Risk/i.test(planContent),
        /Dependency|Dependencies|Dependencia|Dependencias/i.test(planContent),
        /Hito|Milestone|Fase|Phase/i.test(planContent)
      ].filter(Boolean).length;

      if (planSignals < 2) {
        messages.push({
          level: "error",
          code: "plan-incomplete",
          message: `${spec.id} approved but plan.md appears incomplete`,
          path: path.join("specs", spec.id, "plan.md")
        });
      }

      const tasksContent = await safeReadFile(tasksPath);
      if ((tasksContent.match(/^- \[( |x|X)\]/gm) ?? []).length === 0) {
        messages.push({
          level: "error",
          code: "tasks-missing",
          message: `${spec.id} approved but tasks.md has no checklist tasks`,
          path: path.join("specs", spec.id, "tasks.md")
        });
      }
    } else {
      messages.push({
        level: "warning",
        code: "spec-not-approved",
        message: `${spec.id} not approved yet (implementation gate should remain closed)`,
        path: path.join("specs", spec.id, "spec.md")
      });
    }
  }

  if (approvedSpecs > 0) {
    if (!(await exists(path.join(root, ".sdd/user-consent.log")))) {
      messages.push({
        level: "error",
        code: "missing-consent-log",
        message: "Missing user consent log (.sdd/user-consent.log) for approved spec execution",
        path: ".sdd/user-consent.log"
      });
    }
  } else {
    messages.push({
      level: "warning",
      code: "consent-not-needed-yet",
      message: "No approved specs yet; user consent log not required at base SDD stage",
      path: ".sdd/user-consent.log"
    });
  }

  return { ...summarize(messages), approvedSpecs, totalSpecs: specs.length };
}

export interface GateSummary {
  /** True only when both the gate check and the structural validation pass. */
  ok: boolean;
  errors: number;
  warnings: number;
  approvedSpecs: number;
  totalSpecs: number;
  gate: GateResult;
  validation: ValidationResult;
  /** Messages grouped by the spec id their path points into (specs/NNN-...). */
  specIssues: Record<string, ValidationMessage[]>;
  /** Messages that do not belong to a single spec (structure, consent, ...). */
  generalIssues: ValidationMessage[];
}

const SPEC_PATH_RE = /^specs[/\\](\d{3}-[a-z0-9][a-z0-9-]*)(?:[/\\]|$)/;

/**
 * One-call gate semaphore for the SDD Builder: wraps checkGate and
 * validateProject and groups every message by the spec it belongs to, so the
 * UI can paint per-card badges and a single open/closed chip.
 */
export async function getGateSummary(projectRoot: string): Promise<GateSummary> {
  const [gate, validation] = await Promise.all([checkGate(projectRoot), validateProject(projectRoot)]);
  const specIssues: Record<string, ValidationMessage[]> = {};
  const generalIssues: ValidationMessage[] = [];

  for (const message of [...gate.messages, ...validation.messages]) {
    const specId = message.path?.match(SPEC_PATH_RE)?.[1];
    if (specId) {
      (specIssues[specId] ??= []).push(message);
    } else {
      generalIssues.push(message);
    }
  }

  return {
    ok: gate.ok && validation.ok,
    errors: gate.errors + validation.errors,
    warnings: gate.warnings + validation.warnings,
    approvedSpecs: gate.approvedSpecs,
    totalSpecs: gate.totalSpecs,
    gate,
    validation,
    specIssues,
    generalIssues
  };
}

export async function recordUserConsent(projectRoot: string, summary: string): Promise<ConsentResult> {
  const root = await resolveSddRoot(projectRoot);
  const consentDir = path.join(root, ".sdd");
  const logFile = path.join(consentDir, "user-consent.log");
  const timestamp = new Date().toISOString();

  await fs.mkdir(consentDir, { recursive: true });
  await fs.appendFile(logFile, `[${timestamp}] ${summary}\n`, "utf8");

  return {
    logFile,
    summary,
    timestamp
  };
}

export async function generateStatus(projectRoot: string): Promise<FileOutputResult> {
  const root = await resolveSddRoot(projectRoot);
  const indexPath = path.join(root, "specs/INDEX.md");
  const outputPath = path.join(root, "STATUS.md");

  if (!(await exists(indexPath))) {
    throw new Error("Missing specs/INDEX.md");
  }

  const indexContent = await fs.readFile(indexPath, "utf8");
  const rows = parseIndexRows(indexContent);
  const activeRows = rows.filter((row) => /in progress|en progreso|ready|listo|active|activo/i.test(row.status));

  let pendingTotal = 0;
  let completedTotal = 0;
  for (const spec of await listSpecs(root)) {
    const tasksContent = await safeReadFile(path.join(spec.dir, "tasks.md"));
    pendingTotal += (tasksContent.match(/^- \[ \]/gm) ?? []).length;
    completedTotal += (tasksContent.match(/^- \[[xX]\]/gm) ?? []).length;
  }

  const projectLogPath = path.join(root, "bitacora/global/PROJECT_LOG.md");
  const projectLogContent = await safeReadFile(projectLogPath);
  const projectLogExcerpt = projectLogContent
    ? projectLogContent.split("\n").slice(-8).join("\n")
    : "No entries";

  const content = [
    "# Status Dashboard / Tablero de estado",
    "",
    `Generated at / Generado en: ${new Date().toISOString()}`,
    "",
    "## Active specs / Specs activas",
    "",
    "| Number | Name | Status | Priority | Owner | Updated |",
    "|---|---|---|---|---|---|",
    ...(activeRows.length > 0
      ? activeRows.map(formatIndexRow)
      : ["| - | - | - | - | - | - |"]),
    "",
    "## All specs snapshot / Resumen de todas las specs",
    "",
    "| Number | Name | Status | Priority | Owner | Updated |",
    "|---|---|---|---|---|---|",
    ...rows.map(formatIndexRow),
    "",
    "## Task progress / Progreso de tareas",
    "",
    `- Pending / Pendientes: ${pendingTotal}`,
    `- Completed / Completadas: ${completedTotal}`,
    "",
    "## Recent log excerpt / Extracto reciente de bitácora",
    "",
    "```text",
    projectLogExcerpt,
    "```",
    ""
  ].join("\n");

  await fs.writeFile(outputPath, content, "utf8");
  return { path: outputPath, content };
}

export async function generateRoadmap(projectRoot: string): Promise<{ mermaidPath: string; markdownPath: string; mermaid: string; markdown: string }> {
  const root = await resolveSddRoot(projectRoot);
  const indexPath = path.join(root, "specs/INDEX.md");
  const docsDir = path.join(root, "docs");
  const mermaidPath = path.join(docsDir, "roadmap.mmd");
  const markdownPath = path.join(docsDir, "roadmap.md");

  if (!(await exists(indexPath))) {
    throw new Error("Missing specs/INDEX.md");
  }

  await fs.mkdir(docsDir, { recursive: true });

  const rows = parseIndexRows(await fs.readFile(indexPath, "utf8"));
  const mermaidLines = ['flowchart LR', '  START["Idea"]'];
  let previous = "START";

  for (const row of rows) {
    const node = `S${row.number}`;
    const label = `${row.number} - ${row.name}\\n${row.status}\\n${row.priority}`;
    mermaidLines.push(`  ${node}["${label}"]`);
    mermaidLines.push(`  ${previous} --> ${node}`);
    previous = node;
  }

  const mermaid = `${mermaidLines.join("\n")}\n`;
  const markdown = [
    "# Project Roadmap / Hoja de ruta",
    "",
    "This roadmap is auto-generated from specs/INDEX.md.",
    "",
    "Este roadmap se genera automáticamente desde specs/INDEX.md.",
    "",
    "",
    `auto-generated at: ${new Date().toISOString()}`,
    "",
    "",
    `auto-detected specs: ${rows.length}`,
    "",
    "",
    `auto-diagram source: ${path.relative(root, mermaidPath)}`,
    "",
    "",
    "auto-diagram preview:",
    "",
    "",
    "auto-generated Mermaid:",
    "",
    "```mermaid",
    mermaid.trimEnd(),
    "```",
    ""
  ].join("\n");

  await fs.writeFile(mermaidPath, mermaid, "utf8");
  await fs.writeFile(markdownPath, markdown, "utf8");

  return {
    mermaidPath,
    markdownPath,
    mermaid,
    markdown
  };
}

export async function appendProjectLogEntry(projectRoot: string, entry: string): Promise<FileOutputResult> {
  const root = await resolveSddRoot(projectRoot);
  const outputPath = path.join(root, "bitacora/global/PROJECT_LOG.md");
  await fs.appendFile(outputPath, `\n${entry.trim()}\n`, "utf8");
  return {
    path: outputPath,
    content: await fs.readFile(outputPath, "utf8")
  };
}

export async function writeDailyLog(projectRoot: string, date: string, content: string): Promise<FileOutputResult> {
  const root = await resolveSddRoot(projectRoot);
  const safeDate = normalizeDate(date);
  const outputPath = path.join(root, "bitacora/diaria", `${safeDate}.md`);
  await fs.writeFile(outputPath, content, "utf8");
  return {
    path: outputPath,
    content
  };
}

export async function writeHandoff(projectRoot: string, fileName: string, content: string): Promise<FileOutputResult> {
  const root = await resolveSddRoot(projectRoot);
  const outputPath = path.join(root, "bitacora/handoffs", normalizeMarkdownFileName(fileName));
  await fs.writeFile(outputPath, content, "utf8");
  return {
    path: outputPath,
    content
  };
}

export async function writeDecision(projectRoot: string, fileName: string, content: string): Promise<FileOutputResult> {
  const root = await resolveSddRoot(projectRoot);
  const outputPath = path.join(root, "bitacora/decisiones", normalizeMarkdownFileName(fileName));
  await fs.writeFile(outputPath, content, "utf8");
  return {
    path: outputPath,
    content
  };
}

function normalizeDate(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Date must use YYYY-MM-DD");
  }
  return value;
}

function normalizeMarkdownFileName(value: string): string {
  if (!/^[a-zA-Z0-9._-]+\.md$/.test(value)) {
    throw new Error("File name must be a simple markdown file name such as 2026-03-18-handoff.md");
  }
  return value;
}

async function requireDir(root: string, relativePath: string, messages: ValidationMessage[]): Promise<void> {
  if (!(await exists(path.join(root, relativePath)))) {
    messages.push({
      level: "error",
      code: "missing-dir",
      message: `Missing directory: ${relativePath}`,
      path: relativePath
    });
  }
}

async function requireFile(root: string, relativePath: string, messages: ValidationMessage[]): Promise<void> {
  if (!(await exists(path.join(root, relativePath)))) {
    messages.push({
      level: "error",
      code: "missing-file",
      message: `Missing file: ${relativePath}`,
      path: relativePath
    });
  }
}

async function appendLine(filePath: string, line: string): Promise<void> {
  const current = await safeReadFile(filePath);
  const suffix = current.endsWith("\n") ? "" : "\n";
  await fs.writeFile(filePath, `${current}${suffix}${line}\n`, "utf8");
}

function summarize(messages: ValidationMessage[]): ValidationResult {
  const errors = messages.filter((message) => message.level === "error").length;
  const warnings = messages.filter((message) => message.level === "warning").length;
  return {
    ok: errors === 0,
    errors,
    warnings,
    messages
  };
}

interface IndexRow {
  number: string;
  name: string;
  status: string;
  priority: string;
  owner: string;
  updated: string;
}

function parseIndexRows(content: string): IndexRow[] {
  return content
    .split("\n")
    .filter((line) => /^\|\s*\d{3}\s*\|/.test(line))
    .map((line) => {
      const parts = line.split("|").map((item) => item.trim());
      return {
        number: parts[1] ?? "",
        name: parts[2] ?? "",
        status: parts[3] ?? "",
        priority: parts[4] ?? "",
        owner: parts[5] ?? "",
        updated: parts[6] ?? ""
      };
    });
}

function formatIndexRow(row: IndexRow): string {
  return `| ${row.number} | ${row.name} | ${row.status} | ${row.priority} | ${row.owner} | ${row.updated} |`;
}

export { ensureProjectRootAllowed, getFrameworkRoot, listSpecs, resolveSddRoot } from "./workspace.js";
export type { SpecSummary } from "./workspace.js";
export * from "./board.js";
export * from "./spec-actions.js";
