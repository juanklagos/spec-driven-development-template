// SDD Builder core: markdown tasks parsing and board.canvas persistence.
// The .md files are the source of truth; the canvas only stores layout
// (JSON Canvas format, https://jsoncanvas.org) in specs/board.canvas.

import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { withFileLock } from "./file-lock.js";
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

/** Visual state of a spec, shared by every surface (canvas, kanban, dashboard). */
export type SpecTone = "pending" | "ok" | "done";

export interface BoardSpecCard extends SpecSummary {
  tasks: TaskProgress;
  /** Computed once here so no client re-derives (and diverges from) the rule. */
  tone: SpecTone;
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
  /** JSON Canvas color (preset "1".."6" or hex); typed edges use it (spec 009). */
  color?: string;
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

/**
 * Suffix of the scratch file `atomicWrite` writes before renaming it into place.
 *
 * It MUST be unique per write, not per process: `.tmp-<pid>` meant two writes
 * racing inside the same server shared one scratch path, so the first rename
 * moved the file away and every other writer died with
 * `ENOENT ... rename <file>.tmp-<pid>` — losing the user's edit.
 */
function atomicWriteTempPath(filePath: string): string {
  return `${filePath}.tmp-${randomUUID()}`;
}

/**
 * True for the scratch files produced by `atomicWriteTempPath`, including the
 * legacy `.tmp-<pid>` shape. Exported because file watchers (the builder's SSE
 * hub in @juanklagos/sdd-mcp) must ignore exactly the names this module writes:
 * the naming rule lives here only, so a watcher can never drift from the writer.
 */
export function isAtomicWriteTempName(name: string): boolean {
  return /\.tmp-[0-9a-zA-Z-]+$/.test(name);
}

async function atomicWrite(filePath: string, content: string): Promise<void> {
  const tmp = atomicWriteTempPath(filePath);
  try {
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, filePath);
  } finally {
    // After a successful rename there is nothing left to remove; after a failed
    // write/rename this is what keeps orphaned scratch files out of specs/.
    await fs.rm(tmp, { force: true }).catch(() => {});
  }
}

export async function writeSpecDocument(
  projectRoot: string,
  specId: string,
  docName: string,
  content: string
): Promise<void> {
  const filePath = await specDocPath(projectRoot, specId, docName);
  await withFileLock(filePath, () => writeSpecDocumentAt(filePath, content));
}

/** Unlocked write; callers already inside `withFileLock(filePath, ...)`. */
async function writeSpecDocumentAt(filePath: string, content: string): Promise<void> {
  await fs.access(filePath); // only edit existing bundle documents
  await atomicWrite(filePath, content);
}

/**
 * The one read-modify-write primitive for spec bundle documents.
 *
 * Reads the document, hands it to `transform`, and writes the result back —
 * with the whole cycle serialized per file, so two concurrent editors queue
 * instead of both reading the same pre-image and one edit vanishing. Every
 * surgical edit in this package (task toggles, approvals, section rewrites)
 * goes through here; nothing else may read-then-write a spec document.
 */
export async function mutateSpecDocument(
  projectRoot: string,
  specId: string,
  docName: string,
  transform: (content: string) => string | Promise<string>
): Promise<string> {
  const filePath = await specDocPath(projectRoot, specId, docName);
  return withFileLock(filePath, async () => {
    const next = await transform(await fs.readFile(filePath, "utf8"));
    await writeSpecDocumentAt(filePath, next);
    return next;
  });
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
  return readBoardAt(await boardPath(projectRoot), projectRoot);
}

async function readBoardAt(filePath: string, projectRoot: string): Promise<BoardCanvas> {
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
  const filePath = await boardPath(projectRoot);
  await withFileLock(filePath, () => writeBoardAt(filePath, canvas));
}

/** Unlocked write; callers already inside `withFileLock(boardPath, ...)`. */
async function writeBoardAt(filePath: string, canvas: BoardCanvas): Promise<void> {
  await atomicWrite(filePath, JSON.stringify(canvas, null, 2) + "\n");
}

/**
 * Read-modify-write primitive for specs/board.canvas — same contract as
 * `mutateSpecDocument`: the read and the write are one serialized step, so a
 * layout save can never overwrite an edge another client just drew.
 */
async function mutateBoard(
  projectRoot: string,
  transform: (canvas: BoardCanvas) => BoardCanvas | Promise<BoardCanvas>
): Promise<BoardCanvas> {
  const filePath = await boardPath(projectRoot);
  return withFileLock(filePath, async () => {
    const next = await transform(await readBoardAt(filePath, projectRoot));
    await writeBoardAt(filePath, next);
    return next;
  });
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
  // One serialized read-modify-write: ticking box 3 can no longer discard the
  // box 7 someone ticked a millisecond earlier. The returned tasks come from
  // the content this call actually wrote, so the response never shows a state
  // that was already superseded.
  return parseTasksMarkdown(
    await mutateSpecDocument(projectRoot, specId, "tasks.md", (current) => setTaskDone(current, line, done))
  );
}

/** Canvas plus every spec with its approval status and task progress. */
export async function getBoardView(projectRoot: string): Promise<BoardView> {
  const [canvas, specs] = await Promise.all([readBoard(projectRoot), listSpecs(projectRoot)]);
  const cards = await Promise.all(
    specs.map(async (spec): Promise<BoardSpecCard> => {
      let tasks: TaskProgress = { done: 0, total: 0 };
      try {
        const items = await readSpecTasks(projectRoot, spec.id);
        tasks = { done: items.filter((item) => item.done).length, total: items.length };
      } catch {
        // No readable tasks.md: the spec still exists, it just has no progress.
      }
      return { ...spec, tasks, tone: specTone(spec.status, tasks) };
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
  return mutateBoard(projectRoot, (canvas) => {
    const knownIds = new Set(canvas.nodes.map((node) => node.id));
    for (const nodeId of [fromNode, toNode]) {
      if (!knownIds.has(nodeId)) {
        throw new Error(`Unknown board node: ${nodeId}. Known nodes: ${[...knownIds].join(", ") || "(none)"}`);
      }
    }

    const duplicate = canvas.edges.find(
      (edge) => edge.fromNode === fromNode && edge.toNode === toNode && (edge.label ?? "") === (label ?? "")
    );
    if (duplicate) return canvas;

    const color = canvasEdgeColorForLabel(label);
    canvas.edges.push({
      id: `edge-${randomUUID().slice(0, 8)}`,
      fromNode,
      toNode,
      ...(label ? { label } : {}),
      ...(color ? { color } : {})
    });
    return canvas;
  });
}

// ---------------------------------------------------------------------------
// Typed edges + dependency warnings (spec 009, R2; "contains" in spec 010, R3)
// ---------------------------------------------------------------------------
// An edge's `label` carries the canonical connection purpose; the ES and EN
// spellings are both canonical so agents and the builder UI can write either.
// KEEP THE LABEL SETS IN SYNC with builder/src/convert.ts (the frontend does
// not import sdd-core; same keep-in-sync contract as the EARS lint).

export type CanvasEdgeKind = "related" | "depends" | "blocks" | "contains";

const DEPENDS_EDGE_LABELS = new Set(["depende de", "depends on"]);
const BLOCKS_EDGE_LABELS = new Set(["bloquea", "blocks"]);
// The legacy bilingual template label is read as the same purpose.
const CONTAINS_EDGE_LABELS = new Set(["contiene", "contains", "contiene / contains"]);

/** JSON Canvas colors for typed edges: presets for amber/red, hex for gray. */
const EDGE_KIND_CANVAS_COLOR: Partial<Record<CanvasEdgeKind, string>> = {
  depends: "3", // amber preset
  blocks: "1", // red preset
  contains: "#6b7280" // gray (epic → spec); no gray preset exists in JSON Canvas
};

/** Classify an edge label into its purpose ("related" by default). */
export function classifyEdgeLabel(label: string | undefined): CanvasEdgeKind {
  const value = (label ?? "").trim().toLowerCase();
  if (DEPENDS_EDGE_LABELS.has(value)) return "depends";
  if (BLOCKS_EDGE_LABELS.has(value)) return "blocks";
  if (CONTAINS_EDGE_LABELS.has(value)) return "contains";
  return "related";
}

/** Distinctive JSON Canvas color for a typed edge label, or undefined. */
export function canvasEdgeColorForLabel(label: string | undefined): string | undefined {
  return EDGE_KIND_CANVAS_COLOR[classifyEdgeLabel(label)];
}

/**
 * The approval rule, written as a POSIX ERE so a shell can use the very same
 * one.
 *
 * KEEP IN SYNC with `SDD_APPROVED_STATUS_ERE` in scripts/check-sdd-gate.sh.
 * Bash cannot import TypeScript, so the pairing is enforced two ways in
 * scripts/test-mcp-integration.mjs: a drift assert that reads the literal out
 * of the script and compares it with this constant, and behavioural cases that
 * run the TS gate and the bash gate over the same fixtures.
 */
export const APPROVED_STATUS_ERE = "aprobad[oa]|approved";

/**
 * Statuses that CONTAIN an approval word but mean the opposite. The approval
 * rule is a substring match, so without this guard `No aprobado`, `unapproved`
 * and `Not approved` all read as approved — the same silent fail-open the rule
 * above exists to prevent, only in the other direction (found by the adversarial
 * re-verification of 2026-07-21). Negation wins: a human who wrote "no" meant no.
 *
 * KEEP IN SYNC with `SDD_NEGATED_STATUS_ERE` in scripts/check-sdd-gate.sh and
 * with the mirror in builder/src/sections.ts.
 */
export const NEGATED_STATUS_ERE = "\\b(no|not|sin|un|non)[ -]?(aprobad[oa]|approved)";

const APPROVED_STATUS_RE = new RegExp(APPROVED_STATUS_ERE, "i");
const NEGATED_STATUS_RE = new RegExp(NEGATED_STATUS_ERE, "i");

/**
 * True when a spec status counts as approved — the ONE predicate of this
 * project. Every surface (canvas, kanban, dashboard, MCP App, MCP tools, the
 * gate, the bash gate) resolves approval through this rule.
 *
 * Case-insensitive, trimmed and matched as a substring on purpose. The four
 * private copies this replaced disagreed with each other, and the gate's copy
 * was the strictest of them: a spec labelled `Aprobada` (the very word the UI
 * prints), `Approved ` with a trailing space, or `Aprobado / Approved` was
 * green and "Implement"-enabled in the builder while the gate counted zero
 * approved specs and therefore SKIPPED every approval quality check — the
 * placeholder date, the placeholder approver, the empty evidence, the
 * inconsistent plan, the missing tasks and the user consent log. Failing that
 * way round means the product's core promise silently failed open.
 */
export function isApprovedStatus(status: string | undefined): boolean {
  const value = (status ?? "").trim();
  if (NEGATED_STATUS_RE.test(value)) return false;
  return APPROVED_STATUS_RE.test(value);
}

/**
 * The one rule every surface renders (canvas card, kanban column, dashboard row,
 * MCP tools). Approval comes first on purpose: under the golden rule a spec that
 * was never approved is not "done" no matter how many boxes are ticked — that
 * combination is precisely the anti-pattern this template exists to surface.
 */
export function specTone(status: string | undefined, tasks: TaskProgress): SpecTone {
  if (!isApprovedStatus(status)) return "pending";
  return tasks.total > 0 && tasks.done === tasks.total ? "done" : "ok";
}

export interface DependencyWarning {
  edgeId: string;
  /** Spec that is approved while leaning on an unapproved dependency. */
  dependent: string;
  /** The unapproved spec the dependent relies on. */
  dependency: string;
  /** The edge label that produced the warning (as written on the canvas). */
  label: string;
  /** Bilingual, human-readable explanation. */
  message: string;
}

const NODE_SPEC_FILE_RE = /^specs\/([^/]+)\/spec\.md$/;

/**
 * Cross-check typed edges against real approval state: for every
 * "depende de"/"depends on" or "bloquea"/"blocks" edge between TWO real
 * specs, warn when the dependent spec is approved but its dependency is not.
 * Direction: A --depende de--> B means A depends on B; A --bloquea--> B
 * means B depends on A. Edges touching notes or unknown nodes are ignored.
 */
export async function getDependencyWarnings(projectRoot: string): Promise<DependencyWarning[]> {
  const [canvas, specs] = await Promise.all([readBoard(projectRoot), listSpecs(projectRoot)]);
  const statusById = new Map(specs.map((spec) => [spec.id, spec.status]));

  // Canvas node id -> spec id (a node is a spec when its id is a spec id or
  // its file points at specs/<id>/spec.md — same resolution as the builder).
  const nodeToSpec = new Map<string, string>();
  for (const node of canvas.nodes) {
    const fromFile = node.file?.match(NODE_SPEC_FILE_RE)?.[1];
    const specId = statusById.has(node.id) ? node.id : fromFile && statusById.has(fromFile) ? fromFile : undefined;
    if (specId) nodeToSpec.set(node.id, specId);
  }

  const warnings: DependencyWarning[] = [];
  for (const edge of canvas.edges) {
    const kind = classifyEdgeLabel(edge.label);
    // Only depends/blocks encode an approval-order dependency; "related" and
    // the structural "contains" (epic → spec) never warn.
    if (kind !== "depends" && kind !== "blocks") continue;
    const from = nodeToSpec.get(edge.fromNode);
    const to = nodeToSpec.get(edge.toNode);
    if (!from || !to || from === to) continue;
    const dependent = kind === "depends" ? from : to;
    const dependency = kind === "depends" ? to : from;
    if (isApprovedStatus(statusById.get(dependent)) && !isApprovedStatus(statusById.get(dependency))) {
      warnings.push({
        edgeId: edge.id,
        dependent,
        dependency,
        label: edge.label ?? "",
        message:
          `${dependent} está aprobada pero depende de ${dependency}, que no está aprobada / ` +
          `${dependent} is approved but depends on ${dependency}, which is not approved`
      });
    }
  }
  return warnings;
}
