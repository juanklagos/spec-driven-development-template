// Spec 027 — spec quality score. TypeScript port of scripts/score-spec.sh so
// npm/Desk installs (no bash, no ripgrep) can score too. Parity is of
// HEURISTICS, not bytes: same buckets, same weights, same notes.

import fs from "node:fs/promises";
import path from "node:path";
import { listSpecs } from "./workspace.js";

export interface SpecScore {
  specId: string;
  score: number;
  grade: "A" | "B" | "C" | "D";
  notes: string[];
}

const REQUIRED_DOCS = ["spec.md", "plan.md", "tasks.md", "research.md", "history.md"] as const;

/** Same shape as the bash script's task counter: top-level checkboxes only. */
const TASK_LINE_RE = /^- \[[ xX]\]/;

export async function scoreSpec(projectRoot: string, specId?: string): Promise<SpecScore[]> {
  const specs = await listSpecs(projectRoot);
  const selected = specId ? specs.filter((spec) => spec.id === specId) : specs;
  if (specId && selected.length === 0) {
    throw new Error(`Spec not found: ${specId}`);
  }
  return Promise.all(selected.map((spec) => scoreSpecDir(spec.id, spec.dir)));
}

async function readOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function scoreSpecDir(specId: string, dir: string): Promise<SpecScore> {
  let score = 0;
  const notes: string[] = [];

  const docs = new Map<string, string | null>();
  for (const name of REQUIRED_DOCS) {
    docs.set(name, await readOrNull(path.join(dir, name)));
  }

  const present = REQUIRED_DOCS.filter((name) => docs.get(name) !== null).length;
  score += present * 4;
  if (present < REQUIRED_DOCS.length) {
    notes.push("missing required files");
  }

  const spec = docs.get("spec.md");
  if (spec !== null && spec !== undefined) {
    let hits = 0;
    if (/objective|objetivo/i.test(spec)) hits += 1;
    if (/requirement|requisito/i.test(spec)) hits += 1;
    if (/acceptance|aceptaci[oó]n/i.test(spec)) hits += 1;
    score += hits * 6;
    if (hits < 3) notes.push("spec.md lacks objective/requirements/acceptance");
  }

  const plan = docs.get("plan.md");
  if (plan !== null && plan !== undefined) {
    const hasPlanSignals = /milestone|hito|dependency|dependencia|risk|riesgo/i.test(plan);
    if (hasPlanSignals) {
      score += 9;
    } else {
      notes.push("plan.md lacks milestones/dependencies/risks");
    }
  }

  const tasks = docs.get("tasks.md");
  if (tasks !== null && tasks !== undefined) {
    const taskCount = tasks.split("\n").filter((line) => TASK_LINE_RE.test(line)).length;
    if (taskCount >= 5) {
      score += 15;
    } else if (taskCount >= 3) {
      score += 10;
      notes.push("tasks.md has limited task breakdown");
    } else if (taskCount >= 1) {
      score += 5;
      notes.push("tasks.md needs more actionable tasks");
    } else {
      notes.push("tasks.md has no checklist tasks");
    }
  }

  const research = docs.get("research.md");
  if (research !== null && research !== undefined) {
    let hits = 0;
    if (/decision|decisi[oó]n/i.test(research)) hits += 1;
    if (/rationale|justific|why|por qu[eé]/i.test(research)) hits += 1;
    if (/reference|referencia/i.test(research)) hits += 1;
    score += hits * 5;
    if (hits < 2) notes.push("research.md needs clearer decision rationale");
  }

  const history = docs.get("history.md");
  if (history !== null && history !== undefined) {
    if (/\d{4}-\d{2}-\d{2}/.test(history)) {
      score += 12;
    } else {
      score += 6;
      notes.push("history.md has no dated entries");
    }
  }

  score = Math.min(score, 100);
  const grade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : "D";
  return { specId, score, grade, notes };
}
