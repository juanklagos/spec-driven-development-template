// Spec 024, R2 + R5. The ONE approval/state rule of this project, under test.
// isApprovedStatus and specTone are pure; getBoardView is exercised end to end
// against a throwaway SDD workspace so the invariant "approval comes first" is
// verified on the real read path, not just on the predicate in isolation.

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BoardUnreadableError,
  getBoardView,
  isApprovedStatus,
  isBoardBackupName,
  readBoard,
  resetBoard,
  specTone,
  writeBoard
} from "./board.js";
import { APPROVAL_CASES } from "./approval-cases.fixture.js";

const runGit = promisify(execFile);

describe("isApprovedStatus — the one approval rule (R5 truth table)", () => {
  for (const { status, approved, note } of APPROVAL_CASES) {
    it(`${JSON.stringify(status)} → ${approved} (${note})`, () => {
      expect(isApprovedStatus(status)).toBe(approved);
    });
  }

  it("treats undefined as not approved", () => {
    expect(isApprovedStatus(undefined)).toBe(false);
  });
});

describe("specTone — approval before progress (R2)", () => {
  it("is 'pending' when not approved, no matter how many tasks are done", () => {
    // The anti-pattern this template exists to surface: every box ticked, never
    // approved. It must NEVER read as 'done'.
    expect(specTone("Pendiente", { done: 9, total: 9 })).toBe("pending");
    expect(specTone("No aprobado", { done: 5, total: 5 })).toBe("pending");
    expect(specTone(undefined, { done: 1, total: 1 })).toBe("pending");
  });

  it("is 'ok' when approved but tasks are not all done (or there are none)", () => {
    expect(specTone("Aprobado", { done: 0, total: 0 })).toBe("ok");
    expect(specTone("Aprobada", { done: 2, total: 5 })).toBe("ok");
    expect(specTone("Approved", { done: 0, total: 3 })).toBe("ok");
  });

  it("is 'done' only when approved AND every task is done", () => {
    expect(specTone("Aprobado", { done: 3, total: 3 })).toBe("done");
    expect(specTone("Approved", { done: 1, total: 1 })).toBe("done");
  });

  it("an approved spec with zero tasks is 'ok', never 'done'", () => {
    // total === 0 must not satisfy done === total as "complete".
    expect(specTone("Aprobado", { done: 0, total: 0 })).toBe("ok");
  });
});

// --- getBoardView parity: the rule on the real read path ---------------------

async function makeWorkspace(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-board-test-"));
  // Minimal SDD root so resolveSddRoot accepts it.
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora"), { recursive: true });
  await fs.mkdir(path.join(root, "specs"), { recursive: true });
  return root;
}

async function writeSpec(
  root: string,
  id: string,
  status: string,
  tasks: Array<{ done: boolean }>
): Promise<void> {
  const dir = path.join(root, "specs", id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, "spec.md"),
    `# Especificación ${id}\n\n## Estado de aprobación / Approval status\n\n- Estado / Status: \`${status}\`\n`
  );
  const lines = tasks.map((t, i) => `- [${t.done ? "x" : " "}] Tarea ${i + 1}`).join("\n");
  await fs.writeFile(path.join(dir, "tasks.md"), `# Tareas ${id}\n\n${lines}\n`);
}

describe("getBoardView — tone computed once on the real workspace", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("assigns pending/ok/done from status and progress, approval first", async () => {
    await writeSpec(root, "001-pendiente", "Pendiente", [{ done: true }, { done: true }]);
    await writeSpec(root, "002-aprobada-parcial", "Aprobada", [{ done: true }, { done: false }]);
    await writeSpec(root, "003-aprobada-completa", "Aprobado", [{ done: true }, { done: true }]);
    await writeSpec(root, "004-aprobada-sin-tareas", "Approved", []);

    const view = await getBoardView(root);
    const tone = Object.fromEntries(view.specs.map((s) => [s.id, s.tone]));

    expect(tone["001-pendiente"]).toBe("pending"); // all tasks done but never approved
    expect(tone["002-aprobada-parcial"]).toBe("ok");
    expect(tone["003-aprobada-completa"]).toBe("done");
    expect(tone["004-aprobada-sin-tareas"]).toBe("ok");
  });

  it("carries a drift field on every card (unscoped/unknown without git)", async () => {
    // makeWorkspace is not a git repo: an approved, scoped spec resolves to
    // "unknown" (no git), an approved spec with no File scope to "unscoped".
    await writeSpec(root, "001-pendiente", "Pendiente", []);
    const view = await getBoardView(root);
    const drift = Object.fromEntries(view.specs.map((s) => [s.id, s.drift.state]));
    expect(drift["001-pendiente"]).toBe("unknown"); // not approved → no baseline
  });
});

// --- getBoardView drift on a real git workspace (spec 025 end to end) --------

describe("getBoardView — drift computed on the real read path", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
    await runGit("git", ["init", "-q"], { cwd: root });
    await runGit("git", ["config", "user.email", "t@test"], { cwd: root });
    await runGit("git", ["config", "user.name", "Test"], { cwd: root });
    await runGit("git", ["config", "commit.gpgsign", "false"], { cwd: root });
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  async function commitFile(file: string, content: string, isoDate: string): Promise<void> {
    const full = path.join(root, file);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
    await runGit("git", ["add", "-A"], { cwd: root });
    const env = { ...process.env, GIT_AUTHOR_DATE: isoDate, GIT_COMMITTER_DATE: isoDate };
    await runGit("git", ["commit", "-m", `edit ${file}`], { cwd: root, env });
  }

  async function writeScopedSpec(id: string, approvalDate: string, scopePath: string): Promise<void> {
    const dir = path.join(root, "specs", id);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      path.join(dir, "spec.md"),
      `# Especificación ${id}\n\n## Estado de aprobación / Approval status\n\n` +
        `- Estado / Status: \`Aprobado\`\n` +
        `- Fecha de aprobación / Approval date: \`${approvalDate}\`\n\n` +
        `## Ámbito de archivos / File scope\n\n- \`${scopePath}\`\n`
    );
    await fs.writeFile(path.join(dir, "tasks.md"), `# Tareas ${id}\n\n- [x] Tarea 1\n`);
  }

  it("marks a card 'drifted' when its scope changed after approval", async () => {
    await commitFile("src/pay/index.ts", "v1", "2026-03-01T10:00:00");
    await writeScopedSpec("001-pay", "2026-03-05", "src/pay/");
    await commitFile("src/pay/index.ts", "v2", "2026-03-10T10:00:00"); // after approval

    const view = await getBoardView(root);
    const card = view.specs.find((s) => s.id === "001-pay");
    expect(card?.drift.state).toBe("drifted");
    expect(card?.drift.commits.length).toBeGreaterThan(0);
  });

  it("marks a card 'clean' when nothing in scope changed after approval", async () => {
    await commitFile("src/pay/index.ts", "v1", "2026-03-01T10:00:00");
    await writeScopedSpec("001-pay", "2026-03-05", "src/pay/");
    await commitFile("docs/x.md", "later but out of scope", "2026-03-20T10:00:00");

    const view = await getBoardView(root);
    const card = view.specs.find((s) => s.id === "001-pay");
    expect(card?.drift.state).toBe("clean");
  });
});

// --- Spec 042, fase 3 (R7): la escritura validada ---------------------------
// `writeBoard` sólo comprobaba que `nodes` y `edges` fueran arrays, así que
// cualquier objeto con esa forma se escribía encima del tablero del usuario.
// La spec 041 dejó esto anotado como deuda en su decisión 8 («defecto real y
// separable… va en su propia spec»); ésta es esa spec.

describe("writeBoard — valida nodo a nodo antes de tocar el archivo (spec 042)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const goodNode = { id: "n1", type: "text" as const, text: "hola", x: 0, y: 0, width: 10, height: 10 };

  it("acepta un tablero válido y conserva las claves que no conoce", async () => {
    await writeBoard(root, {
      nodes: [{ ...goodNode, futureField: 7 } as never],
      edges: []
    });
    const back = await readBoard(root);
    expect((back.nodes[0] as unknown as Record<string, unknown>).futureField).toBe(7);
  });

  it("rechaza un nodo sin id, con tipo desconocido o con coordenada no numérica, y lo nombra", async () => {
    const cases: Array<[string, unknown]> = [
      ["sin id", { ...goodNode, id: undefined }],
      ["tipo desconocido", { ...goodNode, type: "sticker" }],
      ["x no numérica", { ...goodNode, x: "12" }]
    ];
    for (const [name, node] of cases) {
      await expect(writeBoard(root, { nodes: [node], edges: [] } as never), name).rejects.toThrow(
        /n1|nodo|node/i
      );
    }
  });

  it("rechaza una arista sin id o que apunta a un nodo inexistente, y la nombra", async () => {
    const cases: Array<[string, unknown]> = [
      ["sin id", { fromNode: "n1", toNode: "n1" }],
      ["destino inexistente", { id: "e1", fromNode: "n1", toNode: "fantasma" }],
      ["origen inexistente", { id: "e1", fromNode: "fantasma", toNode: "n1" }]
    ];
    for (const [name, edge] of cases) {
      await expect(
        writeBoard(root, { nodes: [goodNode], edges: [edge] } as never),
        name
      ).rejects.toThrow(/e1|arista|edge|fantasma/i);
    }
  });

  it("una escritura rechazada deja el archivo anterior intacto", async () => {
    await writeBoard(root, { nodes: [goodNode], edges: [] });
    const before = await fs.readFile(path.join(root, "specs", "board.canvas"), "utf8");

    await expect(
      writeBoard(root, { nodes: [{ ...goodNode, type: "sticker" }], edges: [] } as never)
    ).rejects.toThrow();

    const after = await fs.readFile(path.join(root, "specs", "board.canvas"), "utf8");
    expect(after).toBe(before);
  });
});

// --- Spec 042, fase 4 (R1, R2): ausente no es lo mismo que ilegible ---------

describe("readBoardAt — distingue ausente de ilegible (spec 042)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  it("un tablero ausente devuelve el tablero por defecto", async () => {
    const canvas = await readBoard(root);
    expect(canvas).toEqual({ nodes: [], edges: [] });
  });

  it("un JSON inválido es un error, no un tablero por defecto", async () => {
    await fs.writeFile(path.join(root, "specs", "board.canvas"), "{ esto no es json");
    await expect(readBoard(root)).rejects.toThrow(BoardUnreadableError);
  });

  it("un archivo con marcadores de conflicto de git es el mismo error", async () => {
    const conflicted = ['<<<<<<< HEAD', '{"nodes":[],"edges":[]}', '=======', '{"nodes":[],"edges":[]}', '>>>>>>> otra'].join("\n");
    await fs.writeFile(path.join(root, "specs", "board.canvas"), conflicted);
    const error = await readBoard(root).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BoardUnreadableError);
    // El aviso tiene que nombrar el archivo: un error que no se puede localizar
    // es apenas mejor que la sobrescritura silenciosa que sustituye.
    expect((error as BoardUnreadableError).path).toContain("board.canvas");
    expect((error as BoardUnreadableError).code).toBe("BOARD_UNREADABLE");
  });

  it("un documento JSON válido que no es un canvas también es ilegible", async () => {
    await fs.writeFile(path.join(root, "specs", "board.canvas"), '{"hola":"mundo"}');
    await expect(readBoard(root)).rejects.toThrow(BoardUnreadableError);
  });
});

describe("respaldo del tablero (spec 042, R2)", () => {
  let root: string;

  beforeEach(async () => {
    root = await makeWorkspace();
  });

  afterEach(async () => {
    await fs.rm(root, { recursive: true, force: true });
  });

  const node = { id: "n1", type: "text" as const, text: "v1", x: 0, y: 0, width: 10, height: 10 };
  const backupPath = (r: string) => path.join(r, "specs", "board.canvas.bak");

  it("el primer guardado de la sesión copia el contenido anterior, y el segundo no lo pisa", async () => {
    await fs.writeFile(
      path.join(root, "specs", "board.canvas"),
      JSON.stringify({ nodes: [{ ...node, text: "original" }], edges: [] })
    );

    await writeBoard(root, { nodes: [{ ...node, text: "v2" }], edges: [] });
    const first = JSON.parse(await fs.readFile(backupPath(root), "utf8"));
    expect(first.nodes[0].text).toBe("original");

    // Segunda escritura de la MISMA sesión: el respaldo sigue siendo el de
    // antes de tocar nada, que es lo único a lo que se puede volver.
    await writeBoard(root, { nodes: [{ ...node, text: "v3" }], edges: [] });
    const second = JSON.parse(await fs.readFile(backupPath(root), "utf8"));
    expect(second.nodes[0].text).toBe("original");
  });

  it("no hay respaldo que hacer cuando todavía no había tablero, y el guardado sigue funcionando", async () => {
    await writeBoard(root, { nodes: [node], edges: [] });
    await expect(fs.access(backupPath(root))).rejects.toThrow();
    expect((await readBoard(root)).nodes).toHaveLength(1);
  });

  it("el watcher ignora el nombre del respaldo", () => {
    expect(isBoardBackupName("board.canvas.bak")).toBe(true);
    expect(isBoardBackupName("board.canvas")).toBe(false);
  });

  it("descartar un tablero ilegible lo conserva en el respaldo y deja uno por defecto", async () => {
    await fs.writeFile(path.join(root, "specs", "board.canvas"), "{ roto");

    const fresh = await resetBoard(root);

    expect(fresh).toEqual({ nodes: [], edges: [] });
    expect(await fs.readFile(backupPath(root), "utf8")).toBe("{ roto");
    await expect(readBoard(root)).resolves.toEqual({ nodes: [], edges: [] });
  });
});
