// Spec 027, R3 + R4. addSpecTask (the missing write half of the task tools)
// and getSpecDriftReport (drift as a first-class answer). Both run against a
// throwaway workspace, same as board.test.ts: the property is verified on the
// real read/write path, not on a mock.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { addSpecTask, getSpecDriftReport, parseTasksMarkdown } from "./board.js";

async function makeWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-addtask-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "specs"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora"), { recursive: true });
  return root;
}

async function writeSpec(root: string, id: string, spec: string, tasks: string): Promise<string> {
  const dir = path.join(root, "specs", id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "spec.md"), spec);
  await fs.writeFile(path.join(dir, "tasks.md"), tasks);
  return dir;
}

describe("addSpecTask (spec 027 R4)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("appends after the last checkbox, preserving everything else", async () => {
    const dir = await writeSpec(
      root,
      "001-demo",
      "# Especificación 001\n",
      "# Tareas 001\n\n- [x] T1 hecha\n- [ ] T2 pendiente\n\nNota al pie que debe sobrevivir.\n"
    );

    const tasks = await addSpecTask(root, "001-demo", "T3 nueva");

    expect(tasks.map((t) => t.text)).toEqual(["T1 hecha", "T2 pendiente", "T3 nueva"]);
    const content = await fs.readFile(path.join(dir, "tasks.md"), "utf8");
    expect(content).toContain("- [ ] T2 pendiente\n- [ ] T3 nueva\n");
    expect(content).toContain("Nota al pie que debe sobrevivir.");
  });

  it("property: n tasks before → n+1 after, previous tasks intact", async () => {
    await writeSpec(root, "001-demo", "# Spec\n", "# Tareas\n\n- [ ] A\n- [x] B\n");
    const before = parseTasksMarkdown(await fs.readFile(path.join(root, "specs/001-demo/tasks.md"), "utf8"));

    const after = await addSpecTask(root, "001-demo", "C");

    expect(after).toHaveLength(before.length + 1);
    expect(after.slice(0, before.length).map((t) => [t.text, t.done])).toEqual(
      before.map((t) => [t.text, t.done])
    );
  });

  it("starts the checklist at the end of a tasks.md with no checkboxes yet", async () => {
    await writeSpec(root, "001-demo", "# Spec\n", "# Tareas 001\n\n(sin tareas)\n");
    const tasks = await addSpecTask(root, "001-demo", "primera tarea");
    expect(tasks.map((t) => t.text)).toEqual(["primera tarea"]);
  });

  it("rejects empty and multiline text", async () => {
    await writeSpec(root, "001-demo", "# Spec\n", "# Tareas\n");
    await expect(addSpecTask(root, "001-demo", "   ")).rejects.toThrow(/single non-empty line/);
    await expect(addSpecTask(root, "001-demo", "a\nb")).rejects.toThrow(/single non-empty line/);
  });
});

describe("getSpecDriftReport (spec 027 R3)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const approvedSpec = (scope: string) =>
    [
      "# Especificación 001",
      "",
      "## Estado de aprobación / Approval status",
      "",
      "- Estado / Status: `Aprobado`",
      "- Fecha de aprobación / Approval date: `2026-07-01`",
      "",
      "## Ámbito de archivos / File scope",
      "",
      scope,
      ""
    ].join("\n");

  it("reports unknown for a not-approved spec and unscoped for an approved one without File scope", async () => {
    await writeSpec(root, "001-pendiente", "# Spec\n\n- Estado / Status: `Pendiente`\n", "# Tareas\n");
    await writeSpec(root, "002-sin-ambito", approvedSpec(""), "# Tareas\n");

    const byId = Object.fromEntries((await getSpecDriftReport(root)).map((r) => [r.specId, r]));
    expect(byId["001-pendiente"].drift.state).toBe("unknown");
    expect(byId["002-sin-ambito"].drift.state).toBe("unscoped");
  });

  it("filters to one spec and throws on an unknown id", async () => {
    await writeSpec(root, "001-unica", approvedSpec("- `src/` — código"), "# Tareas\n");

    const reports = await getSpecDriftReport(root, "001-unica");
    expect(reports).toHaveLength(1);
    // tmpdir is not a git repo → approved + scoped still degrades to unknown, never a fake clean.
    expect(reports[0].drift.state).toBe("unknown");

    await expect(getSpecDriftReport(root, "099-nope")).rejects.toThrow(/Spec not found/);
  });
});
