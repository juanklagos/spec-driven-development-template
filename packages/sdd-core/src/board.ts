// SDD Builder core: markdown tasks parsing and board.canvas persistence.
// The .md files are the source of truth; the canvas only stores layout
// (JSON Canvas format, https://jsoncanvas.org) in specs/board.canvas.

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { listSpecs, resolveSddRoot, type SpecSummary } from "./workspace.js";

export interface TaskItem {
  text: string;
  done: boolean;
  line: number;
}

export interface TaskProgress {
  done: number;
  total: number;
}

export interface BoardSpecCard extends SpecSummary {
  tasks: TaskProgress;
}

export interface BoardView {
  canvas: BoardCanvas;
  specs: BoardSpecCard[];
}

export interface CanvasNode {
  id: string;
  type: "file" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  file?: string;
  text?: string;
  color?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  label?: string;
}

export interface BoardCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const SPEC_ID_RE = /^\d{3}-[a-z0-9][a-z0-9-]*$/;
const SPEC_DOCS = new Set(["spec.md", "plan.md", "tasks.md", "history.md", "research.md"]);
const TASK_RE = /^(\s*)- \[( |x|X)\] (.*)$/;

export function parseTasksMarkdown(content: string): TaskItem[] {
  const items: TaskItem[] = [];
  content.split("\n").forEach((raw, index) => {
    const match = raw.match(TASK_RE);
    if (match) {
      items.push({ text: match[3], done: match[2].toLowerCase() === "x", line: index });
    }
  });
  return items;
}

export function setTaskDone(content: string, line: number, done: boolean): string {
  const lines = content.split("\n");
  const target = lines[line];
  if (target === undefined || !TASK_RE.test(target)) {
    throw new Error(`Line ${line} is not a task checkbox`);
  }
  lines[line] = target.replace(/- \[( |x|X)\]/, done ? "- [x]" : "- [ ]");
  return lines.join("\n");
}

function assertSpecId(specId: string): void {
  if (!SPEC_ID_RE.test(specId)) {
    throw new Error(`Invalid spec id: ${specId}`);
  }
}

function assertSpecDoc(docName: string): void {
  if (!SPEC_DOCS.has(docName)) {
    throw new Error(`Unknown spec document: ${docName}`);
  }
}

async function specDocPath(projectRoot: string, specId: string, docName: string): Promise<string> {
  assertSpecId(specId);
  assertSpecDoc(docName);
  const root = await resolveSddRoot(projectRoot);
  return path.join(root, "specs", specId, docName);
}

export async function readSpecDocument(projectRoot: string, specId: string, docName: string): Promise<string> {
  return fs.readFile(await specDocPath(projectRoot, specId, docName), "utf8");
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.tmp-${process.pid}`;
  await fs.writeFile(tmp, content, "utf8");
  await fs.rename(tmp, filePath);
}

export async function writeSpecDocument(
  projectRoot: string,
  specId: string,
  docName: string,
  content: string
): Promise<void> {
  const filePath = await specDocPath(projectRoot, specId, docName);
  await fs.access(filePath); // only edit existing bundle documents
  await atomicWrite(filePath, content);
}

/** Absolute path to the specs/ directory of the resolved SDD root (workspace or spec/ sidecar). */
export async function specsRoot(projectRoot: string): Promise<string> {
  const root = await resolveSddRoot(projectRoot);
  return path.join(root, "specs");
}

export async function boardPath(projectRoot: string): Promise<string> {
  return path.join(await specsRoot(projectRoot), "board.canvas");
}

function isCanvas(value: unknown): value is BoardCanvas {
  if (typeof value !== "object" || value === null) return false;
  const c = value as BoardCanvas;
  return Array.isArray(c.nodes) && Array.isArray(c.edges);
}

/** Default layout: one file node per existing spec, laid out on a grid. */
export async function defaultBoard(projectRoot: string): Promise<BoardCanvas> {
  const specs = await listSpecs(projectRoot);
  const nodes: CanvasNode[] = specs.map((spec, i) => ({
    id: spec.id,
    type: "file",
    file: `specs/${spec.id}/spec.md`,
    x: (i % 3) * 340,
    y: Math.floor(i / 3) * 220,
    width: 300,
    height: 180
  }));
  return { nodes, edges: [] };
}

export async function readBoard(projectRoot: string): Promise<BoardCanvas> {
  const filePath = await boardPath(projectRoot);
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(filePath, "utf8"));
    if (!isCanvas(parsed)) throw new Error("invalid canvas");
    return parsed;
  } catch {
    return defaultBoard(projectRoot);
  }
}

export async function writeBoard(projectRoot: string, canvas: BoardCanvas): Promise<void> {
  if (!isCanvas(canvas)) {
    throw new Error("Invalid canvas payload: expected { nodes: [], edges: [] }");
  }
  await atomicWrite(await boardPath(projectRoot), JSON.stringify(canvas, null, 2) + "\n");
}

// ---------------------------------------------------------------------------
// Composed board operations. These are the single shared layer used by both
// the REST API (packages/sdd-mcp/src/api.ts) and the MCP board tools
// (packages/sdd-mcp/src/server.ts) so no transport re-implements board logic.
// ---------------------------------------------------------------------------

/** Parsed checkbox tasks of one spec's tasks.md. */
export async function readSpecTasks(projectRoot: string, specId: string): Promise<TaskItem[]> {
  return parseTasksMarkdown(await readSpecDocument(projectRoot, specId, "tasks.md"));
}

/**
 * Toggle a single checkbox line in tasks.md (surgical edit, atomic write)
 * and return the tasks as re-read from disk.
 */
export async function setSpecTaskDone(
  projectRoot: string,
  specId: string,
  line: number,
  done: boolean
): Promise<TaskItem[]> {
  const current = await readSpecDocument(projectRoot, specId, "tasks.md");
  await writeSpecDocument(projectRoot, specId, "tasks.md", setTaskDone(current, line, done));
  return readSpecTasks(projectRoot, specId);
}

/** Canvas plus every spec with its approval status and task progress. */
export async function getBoardView(projectRoot: string): Promise<BoardView> {
  const [canvas, specs] = await Promise.all([readBoard(projectRoot), listSpecs(projectRoot)]);
  const cards = await Promise.all(
    specs.map(async (spec): Promise<BoardSpecCard> => {
      try {
        const items = await readSpecTasks(projectRoot, spec.id);
        return { ...spec, tasks: { done: items.filter((item) => item.done).length, total: items.length } };
      } catch {
        return { ...spec, tasks: { done: 0, total: 0 } };
      }
    })
  );
  return { canvas, specs: cards };
}

/**
 * Connect two existing cards with a labeled edge and persist the canvas.
 * Idempotent: an edge with the same endpoints and label is not duplicated.
 */
export async function connectBoardCards(
  projectRoot: string,
  fromNode: string,
  toNode: string,
  label?: string
): Promise<BoardCanvas> {
  const canvas = await readBoard(projectRoot);
  const knownIds = new Set(canvas.nodes.map((node) => node.id));
  for (const nodeId of [fromNode, toNode]) {
    if (!knownIds.has(nodeId)) {
      throw new Error(`Unknown board node: ${nodeId}. Known nodes: ${[...knownIds].join(", ") || "(none)"}`);
    }
  }

  const duplicate = canvas.edges.find(
    (edge) => edge.fromNode === fromNode && edge.toNode === toNode && (edge.label ?? "") === (label ?? "")
  );
  if (!duplicate) {
    canvas.edges.push({ id: `edge-${randomUUID().slice(0, 8)}`, fromNode, toNode, ...(label ? { label } : {}) });
    await writeBoard(projectRoot, canvas);
  }
  return canvas;
}
