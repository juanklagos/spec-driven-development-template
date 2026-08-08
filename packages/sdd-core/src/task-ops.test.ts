// Spec 028, R4. renameSpecTask / removeSpecTask / moveSpecTask against a
// throwaway workspace, same as add-task.test.ts: the preservation property is
// verified on the real read/write path, not on a mock.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { moveSpecTask, removeSpecTask, renameSpecTask } from "./board.js";

let root: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-taskops-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "specs"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora"), { recursive: true });
  await fs.mkdir(path.join(root, "specs/001-demo"), { recursive: true });
  await fs.writeFile(path.join(root, "specs/001-demo/spec.md"), "# Spec\n");
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

async function writeTasks(content: string): Promise<void> {
  await fs.writeFile(path.join(root, "specs/001-demo/tasks.md"), content, "utf8");
}

async function readTasks(): Promise<string> {
  return fs.readFile(path.join(root, "specs/001-demo/tasks.md"), "utf8");
}

const TASKS_MD = "# Tareas 001\n\n- [x] T1 hecha\n- [ ] T2 pendiente\n\nNota al pie.\n\n- [ ] T3 suelta\n";

describe("renameSpecTask (spec 028 R4)", () => {
  it("replaces the text, preserving indent and done mark", async () => {
    await writeTasks(TASKS_MD);

    // Line 2 is "- [x] T1 hecha".
    const tasks = await renameSpecTask(root, "001-demo", 2, "T1 reescrita");

    expect(tasks.find((t) => t.line === 2)).toMatchObject({ text: "T1 reescrita", done: true });
    const content = await readTasks();
    expect(content).toContain("- [x] T1 reescrita\n");
    expect(content).toContain("Nota al pie.");
    expect(content).toContain("- [ ] T3 suelta\n");
  });

  it("rejects a non-task line and empty/multiline text without writing", async () => {
    await writeTasks(TASKS_MD);

    await expect(renameSpecTask(root, "001-demo", 4, "x")).rejects.toThrow(/not a task checkbox/);
    await expect(renameSpecTask(root, "001-demo", 3, "   ")).rejects.toThrow(/single non-empty line/);
    await expect(renameSpecTask(root, "001-demo", 3, "a\nb")).rejects.toThrow(/single non-empty line/);
    expect(await readTasks()).toBe(TASKS_MD);
  });
});

describe("removeSpecTask (spec 028 R4)", () => {
  it("property: N tasks before → N-1 after, rest keep text and relative order", async () => {
    await writeTasks(TASKS_MD);

    const tasks = await removeSpecTask(root, "001-demo", 3); // "- [ ] T2 pendiente"

    expect(tasks.map((t) => t.text)).toEqual(["T1 hecha", "T3 suelta"]);
    const content = await readTasks();
    expect(content).not.toContain("T2 pendiente");
    expect(content).toContain("Nota al pie.");
  });

  it("rejects a non-task line without writing", async () => {
    await writeTasks(TASKS_MD);

    await expect(removeSpecTask(root, "001-demo", 0)).rejects.toThrow(/not a task checkbox/);
    expect(await readTasks()).toBe(TASKS_MD);
  });
});

describe("moveSpecTask (spec 028 R4)", () => {
  it("swaps with the nearest task below, skipping non-task lines", async () => {
    await writeTasks(TASKS_MD);

    // Line 3 ("T2 pendiente") down: the nearest task below is line 7
    // ("T3 suelta"), past the blank lines and the note — the two task lines
    // trade places, the note stays put.
    const tasks = await moveSpecTask(root, "001-demo", 3, "down");

    expect(tasks.map((t) => [t.line, t.text])).toEqual([
      [2, "T1 hecha"],
      [3, "T3 suelta"],
      [7, "T2 pendiente"]
    ]);
    const content = await readTasks();
    expect(content.split("\n")[5]).toBe("Nota al pie.");
  });

  it("moves up symmetrically and reports the new line numbers", async () => {
    await writeTasks(TASKS_MD);

    const tasks = await moveSpecTask(root, "001-demo", 7, "up"); // "T3 suelta"

    expect(tasks.map((t) => [t.line, t.text])).toEqual([
      [2, "T1 hecha"],
      [3, "T3 suelta"],
      [7, "T2 pendiente"]
    ]);
  });

  it("fails loudly at the edges instead of moving nothing", async () => {
    await writeTasks("- [ ] única\n");

    await expect(moveSpecTask(root, "001-demo", 0, "up")).rejects.toThrow(/Already the first task/);
    await expect(moveSpecTask(root, "001-demo", 0, "down")).rejects.toThrow(/Already the last task/);
    expect(await readTasks()).toBe("- [ ] única\n");
  });
});
