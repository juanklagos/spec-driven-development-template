import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

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
  profile: ScaffoldProfile;
  assistant: string;
  usedSpecKit: boolean;
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

export interface SpecSummary {
  id: string;
  dir: string;
  status: string;
}

export function getFrameworkRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../../../");
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

  await execFileAsync(scriptPath, args, { cwd: frameworkRoot });

  return {
    projectRoot: path.join(frameworkRoot, "www", slugify(input.projectName)),
    profile,
    assistant,
    usedSpecKit: useSpecKit
  };
}

export async function createSpec(input: CreateSpecInput): Promise<CreateSpecResult> {
  const projectRoot = path.resolve(input.projectRoot);
  await ensureInsideRunnableWorkspace(projectRoot);

  const specsRoot = path.join(projectRoot, "specs");
  const templateRoot = path.join(specsRoot, "_template");
  const slug = slugify(input.featureName);
  if (!slug) {
    throw new Error("Invalid feature name after slugify");
  }

  const currentSpecs = await listSpecs(projectRoot);
  const nextNumber = String(currentSpecs.length + 1).padStart(3, "0");
  const specId = `${nextNumber}-${slug}`;
  const specDir = path.join(specsRoot, specId);

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

export async function listSpecs(projectRoot: string): Promise<SpecSummary[]> {
  const specsRoot = path.join(path.resolve(projectRoot), "specs");
  const entries = await safeReadDir(specsRoot);
  const items: SpecSummary[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !/^\d{3}-/.test(entry.name)) {
      continue;
    }

    const specPath = path.join(specsRoot, entry.name, "spec.md");
    if (!(await exists(specPath))) {
      continue;
    }

    const content = await fs.readFile(specPath, "utf8");
    items.push({
      id: entry.name,
      dir: path.join(specsRoot, entry.name),
      status: extractApprovalStatus(content)
    });
  }

  return items.sort((a, b) => a.id.localeCompare(b.id));
}

export async function validateProject(projectRoot: string): Promise<ValidationResult> {
  const root = path.resolve(projectRoot);
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
  const root = path.resolve(projectRoot);
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

export async function recordUserConsent(projectRoot: string, summary: string): Promise<ConsentResult> {
  const root = path.resolve(projectRoot);
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

export async function ensureInsideRunnableWorkspace(projectRoot: string): Promise<void> {
  const root = path.resolve(projectRoot);
  const frameworkRoot = getFrameworkRoot();
  const wwwRoot = path.join(frameworkRoot, "www");

  if (!root.startsWith(wwwRoot + path.sep)) {
    throw new Error(`Project root must live inside ${wwwRoot}`);
  }
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

async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function safeReadDir(dirPath: string) {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractApprovalStatus(content: string): string {
  const match = content.match(/Estado \/ Status:\s*`([^`]+)`/i);
  return match?.[1] ?? "Pendiente";
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
