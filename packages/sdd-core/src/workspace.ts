// Shared workspace primitives: framework root, SDD root resolution, and spec
// listing. This internal module exists so that both index.ts (project ops) and
// board.ts (builder ops) can depend on it without a circular import between
// them. Only index.ts re-exports the public pieces.

import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface SpecSummary {
  id: string;
  dir: string;
  status: string;
  /**
   * Human title from line 1 of spec.md. Never empty: falls back to a label
   * derived from the id, because a nameless card is worse than a slug.
   */
  title: string;
  /**
   * Paths declared under "## Ámbito de archivos / File scope". Empty when the
   * section is absent or has no backticked entries.
   *
   * Nothing enforces this yet, by design: spec 012 only starts capturing it so
   * spec 014 has real data to compare a pull request diff against.
   */
  fileScope: string[];
}

/**
 * Where the framework assets (scripts, templates, docs, policy) were found.
 * - `repo`    : running from a checkout of the template monorepo.
 * - `package` : running from an npm install, using the payload bundled in the tarball.
 * - `missing` : neither was found; every asset-dependent operation must fail loudly.
 */
export type FrameworkLayout = "repo" | "package" | "missing";

export interface FrameworkRootInfo {
  root: string;
  layout: FrameworkLayout;
}

/** Files that must all exist for a directory to count as a usable framework root. */
const FRAMEWORK_MARKERS = ["sdd.policy.yaml", "specs/_template/spec.md", "scripts/create-www-project.sh"];

function isFrameworkRoot(candidate: string): boolean {
  return FRAMEWORK_MARKERS.every((relative) => existsSync(path.join(candidate, ...relative.split("/"))));
}

function getPackageRoot(): string {
  // dist/workspace.js -> package root (packages/sdd-core or node_modules/@juanklagos/sdd-core).
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
}

/**
 * Resolve the framework assets root and report how it was found.
 *
 * Checkout wins over the bundled payload so that monorepo development always
 * operates on the live files. The bundled payload (`<package>/framework`, built
 * by scripts/build-framework-payload.mjs at pack time) is what makes an
 * npm-installed server work at all: without it the old `../../../` walk landed
 * on `<project>/node_modules`.
 */
export function resolveFrameworkRoot(): FrameworkRootInfo {
  const packageRoot = getPackageRoot();

  // Monorepo checkout: <repo>/packages/sdd-core -> <repo>.
  if (path.basename(path.dirname(packageRoot)) === "packages") {
    const repoRoot = path.resolve(packageRoot, "../..");
    if (isFrameworkRoot(repoRoot)) {
      return { root: repoRoot, layout: "repo" };
    }
  }

  // npm install: payload shipped inside the tarball.
  const bundledRoot = path.join(packageRoot, "framework");
  if (isFrameworkRoot(bundledRoot)) {
    return { root: bundledRoot, layout: "package" };
  }

  return { root: packageRoot, layout: "missing" };
}

export function getFrameworkRoot(): string {
  return resolveFrameworkRoot().root;
}

export function getFrameworkLayout(): FrameworkLayout {
  return resolveFrameworkRoot().layout;
}

/**
 * Where `./www/<project-name>` workspaces are created.
 *
 * In a checkout this is the repo root (unchanged behaviour). Installed from npm
 * the framework root lives inside node_modules, so new projects go under the
 * current working directory instead. `SDD_WORKSPACES_ROOT` overrides both.
 */
export function getWorkspacesRoot(): string {
  const override = process.env.SDD_WORKSPACES_ROOT;
  if (override) {
    return path.resolve(override);
  }

  const info = resolveFrameworkRoot();
  return info.layout === "repo" ? info.root : process.cwd();
}

export async function ensureProjectRootAllowed(projectRoot: string): Promise<void> {
  const root = path.resolve(projectRoot);
  const framework = resolveFrameworkRoot();
  const wwwRoot = path.join(getWorkspacesRoot(), "www");

  if (root === framework.root) {
    throw new Error("Project root cannot be the template root itself");
  }

  if (framework.layout !== "repo" && isSameOrInside(root, getPackageRoot())) {
    throw new Error(
      `Project roots cannot live inside the installed @juanklagos/sdd-core package (${getPackageRoot()}). Pass a path inside your own project.`
    );
  }

  if (framework.layout === "repo" && isSameOrInside(root, framework.root) && !isSameOrInside(root, wwwRoot)) {
    throw new Error(`Project roots inside the template must live under ${wwwRoot}. Use an external path or ./www/<project-name>.`);
  }
}

/**
 * Single source of the "framework assets are not where I can read them" message.
 * Both the workspace scaffolder (sdd-core) and the MCP resources (sdd-mcp) use
 * it so an npm-installed server explains itself instead of leaking ENOENT.
 */
export function frameworkAssetError(relativePath: string): string {
  const info = resolveFrameworkRoot();
  const packageRoot = getPackageRoot();

  if (info.layout === "missing") {
    return [
      `SDD framework assets are missing, so "${relativePath}" cannot be read.`,
      `Looked for a bundled payload at ${path.join(packageRoot, "framework")}`,
      `and for a template checkout above ${packageRoot}.`,
      "EN: this @juanklagos/sdd-core install is incomplete. Reinstall @juanklagos/sdd-mcp,",
      "or run the server from a clone of https://github.com/juanklagos/spec-driven-development-template.",
      "ES: esta instalación de @juanklagos/sdd-core está incompleta. Reinstala @juanklagos/sdd-mcp,",
      "o ejecuta el servidor desde un clon del template."
    ].join("\n");
  }

  return [
    `SDD framework asset not found: ${relativePath}`,
    `Framework root (${info.layout} layout): ${info.root}`,
    info.layout === "package"
      ? "EN: the installed package does not bundle this asset. ES: el paquete instalado no incluye este archivo."
      : "EN: the template checkout is incomplete. ES: el checkout del template está incompleto."
  ].join("\n");
}

/** Read a file from the framework assets root, with an actionable error when it is unreachable. */
export async function readFrameworkFile(relativePath: string): Promise<string> {
  const info = resolveFrameworkRoot();
  const absolute = path.join(info.root, ...relativePath.split("/"));

  try {
    return await fs.readFile(absolute, "utf8");
  } catch {
    throw new Error(frameworkAssetError(relativePath));
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
      title: extractSpecTitle(content, entry.name),
      status: extractApprovalStatus(content),
      fileScope: extractFileScope(content)
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

/**
 * The backticked value of the "Estado / Status:" line, trimmed.
 *
 * The trim is load-bearing: an approval written as `Approved ` used to reach
 * the gate with its trailing space and miss the equality test there, so the
 * spec rendered green in the builder while the gate treated it as unapproved
 * and skipped every approval quality check.
 */
/**
 * Paths declared in the File scope section.
 *
 * Reads only that section, and takes the FIRST backticked token of each `-`
 * line, so prose after the path is free text. Deliberately tolerant: an absent
 * section is an empty list, never an error, because no spec written before
 * 2026-07-21 has one.
 */
export function extractFileScope(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((line) => /^##\s+(ámbito de archivos|ambito de archivos|file scope)/i.test(line));
  if (start === -1) return [];

  const paths: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    if (!/^\s*-\s/.test(line)) continue;
    const token = line.match(/`([^`]+)`/)?.[1]?.trim();
    if (token) paths.push(token);
  }
  return paths;
}

/**
 * The human title, from the first heading of spec.md.
 *
 * The template writes "# Especificación NNN - Title" / "# Specification NNN -
 * Title", but specs written before that convention exist, so this degrades
 * rather than failing: heading with a dash, then any first heading, then a
 * label derived from the id. A card with no name reads as broken.
 *
 * The id stays visible next to it in the UI: it is what the user types in the
 * terminal and in commit messages.
 */
export function extractSpecTitle(content: string, specId: string): string {
  const heading = content.split(/\r?\n/).find((line) => /^#\s+\S/.test(line));
  if (heading) {
    const withoutHash = heading.replace(/^#\s+/, "").trim();
    // "Especificación 012 - Título" -> "Título". Any dash the template may use.
    const afterDash = withoutHash.match(/^(?:especificaci[oó]n|specification)\s+\S+\s*[-–—]\s*(.+)$/i)?.[1];
    const title = (afterDash ?? withoutHash).trim();
    // An unfilled template still has its placeholders ("[Spec Number]",
    // "[Feature Name]"). Showing those verbatim is worse than the slug.
    if (title && !/\[[^\]]+\]/.test(title)) return title;
  }
  // Fallback: "013-gate-integrity" -> "gate integrity".
  const fromId = specId.replace(/^\d{3}-/, "").replace(/-/g, " ").trim();
  return fromId || specId;
}

export function extractApprovalStatus(content: string): string {
  const match = content.match(/Estado \/ Status:\s*`([^`]+)`/i);
  return match?.[1].trim() ?? "Pendiente";
}
