// Shared workspace primitives: framework root, SDD root resolution, and spec
// listing. This internal module exists so that both index.ts (project ops) and
// board.ts (builder ops) can depend on it without a circular import between
// them. Only index.ts re-exports the public pieces.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface SpecSummary {
  id: string;
  dir: string;
  status: string;
}

export function getFrameworkRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../../../");
}

export async function ensureProjectRootAllowed(projectRoot: string): Promise<void> {
  const root = path.resolve(projectRoot);
  const frameworkRoot = getFrameworkRoot();
  const wwwRoot = path.join(frameworkRoot, "www");

  if (root === frameworkRoot) {
    throw new Error("Project root cannot be the template root itself");
  }

  if (isSameOrInside(root, frameworkRoot) && !isSameOrInside(root, wwwRoot)) {
    throw new Error(`Project roots inside the template must live under ${wwwRoot}. Use an external path or ./www/<project-name>.`);
  }
}

export async function resolveSddRoot(projectRoot: string): Promise<string> {
  const root = path.resolve(projectRoot);
  await ensureProjectRootAllowed(root);

  if (await isSddRoot(root)) {
    return root;
  }

  const sidecarRoot = path.join(root, "spec");
  if (await isSddRoot(sidecarRoot)) {
    return sidecarRoot;
  }

  throw new Error(`Could not find an SDD root at ${root} or ${sidecarRoot}`);
}

export async function listSpecs(projectRoot: string): Promise<SpecSummary[]> {
  const root = await resolveSddRoot(projectRoot);
  const specsRoot = path.join(root, "specs");
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

// --- internal helpers shared with index.ts (not part of the public API) ---

export async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function safeReadFile(filePath: string): Promise<string> {
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

function isSameOrInside(targetPath: string, parentPath: string): boolean {
  const target = path.resolve(targetPath);
  const parent = path.resolve(parentPath);
  return target === parent || target.startsWith(parent + path.sep);
}

async function isSddRoot(candidate: string): Promise<boolean> {
  return (
    (await exists(path.join(candidate, "sdd.policy.yaml"))) &&
    (await exists(path.join(candidate, "idea"))) &&
    (await exists(path.join(candidate, "specs"))) &&
    (await exists(path.join(candidate, "bitacora")))
  );
}

function extractApprovalStatus(content: string): string {
  const match = content.match(/Estado \/ Status:\s*`([^`]+)`/i);
  return match?.[1] ?? "Pendiente";
}
