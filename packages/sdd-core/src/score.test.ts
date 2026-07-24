// Spec 027, R6. Heuristics-parity with scripts/score-spec.sh: same buckets,
// same weights, same notes. The cases pin the bucket boundaries (0/3/5 tasks)
// and the full-marks path so a future tweak shows up as a diff here.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { scoreSpec } from "./score.js";

async function makeWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-score-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "specs"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora"), { recursive: true });
  return root;
}

interface SpecFiles {
  spec?: string;
  plan?: string;
  tasks?: string;
  research?: string;
  history?: string;
}

async function writeSpec(root: string, id: string, files: SpecFiles): Promise<void> {
  const dir = path.join(root, "specs", id);
  await fs.mkdir(dir, { recursive: true });
  // listSpecs requires spec.md to exist for the folder to count as a spec.
  await fs.writeFile(path.join(dir, "spec.md"), files.spec ?? `# Especificación ${id}\n`);
  if (files.plan !== undefined) await fs.writeFile(path.join(dir, "plan.md"), files.plan);
  if (files.tasks !== undefined) await fs.writeFile(path.join(dir, "tasks.md"), files.tasks);
  if (files.research !== undefined) await fs.writeFile(path.join(dir, "research.md"), files.research);
  if (files.history !== undefined) await fs.writeFile(path.join(dir, "history.md"), files.history);
}

const FULL_SPEC: SpecFiles = {
  spec: "# Spec\n\n## Objetivo\n\n## Requisitos\n\n## Criterios de aceptación\n",
  plan: "# Plan\n\n## Hitos\n\n## Riesgos\n",
  tasks: `# Tareas\n\n${Array.from({ length: 5 }, (_, i) => `- [ ] T${i + 1}`).join("\n")}\n`,
  research: "# Research\n\n## Decisión\n\nRationale: porque sí.\n\n## Referencias\n",
  history: "# Historial\n\n| 2026-07-23 | Scope | inicial |\n"
};

describe("scoreSpec — parity with score-spec.sh (spec 027 R6)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("gives a complete bundle full marks: 5×4 + 3×6 + 9 + 15 + 3×5 + 12 = 89 → A", async () => {
    await writeSpec(root, "001-completa", FULL_SPEC);
    const [result] = await scoreSpec(root, "001-completa");
    expect(result.score).toBe(89);
    expect(result.grade).toBe("A");
    expect(result.notes).toEqual([]);
  });

  it("pins the task-count buckets (bash: >=5 → 15, >=3 → 10, >=1 → 5, 0 → note)", async () => {
    const tasksOf = (n: number) =>
      `# Tareas\n\n${Array.from({ length: n }, (_, i) => `- [ ] T${i + 1}`).join("\n")}\n`;
    await writeSpec(root, "001-cinco", { ...FULL_SPEC, tasks: tasksOf(5) });
    await writeSpec(root, "002-tres", { ...FULL_SPEC, tasks: tasksOf(3) });
    await writeSpec(root, "003-una", { ...FULL_SPEC, tasks: tasksOf(1) });
    await writeSpec(root, "004-cero", { ...FULL_SPEC, tasks: "# Tareas\n\nsin checkboxes\n" });

    const byId = Object.fromEntries((await scoreSpec(root)).map((r) => [r.specId, r]));
    expect(byId["001-cinco"].score).toBe(89);
    expect(byId["002-tres"].score).toBe(84);
    expect(byId["002-tres"].notes).toContain("tasks.md has limited task breakdown");
    expect(byId["003-una"].score).toBe(79);
    expect(byId["004-cero"].score).toBe(74);
    expect(byId["004-cero"].notes).toContain("tasks.md has no checklist tasks");
  });

  it("notes missing files and undated history, exactly like the bash script", async () => {
    await writeSpec(root, "001-minima", {
      spec: "# Spec\n",
      history: "# Historial sin fechas\n"
    });
    const [result] = await scoreSpec(root, "001-minima");
    // 2 files ×4 + 0 spec hits + history 6 = 14 → D
    expect(result.score).toBe(14);
    expect(result.grade).toBe("D");
    expect(result.notes).toContain("missing required files");
    expect(result.notes).toContain("spec.md lacks objective/requirements/acceptance");
    expect(result.notes).toContain("history.md has no dated entries");
  });

  it("throws on an unknown specId instead of returning an empty list", async () => {
    await writeSpec(root, "001-existe", FULL_SPEC);
    await expect(scoreSpec(root, "099-no-existe")).rejects.toThrow(/Spec not found/);
  });
});
