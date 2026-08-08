// Spec 028, R5. updateSpecIndexRow: the first non-append write to
// specs/INDEX.md. The property under test is a ONE-LINE diff, exercised over
// an adversarial table (similar numbers, long status cells, a row that must
// stay byte-identical).

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { updateSpecIndexRow } from "./index.js";

let root: string;
let indexPath: string;

const INDEX_MD = [
  "# Specification Index / Índice de especificaciones",
  "",
  "| Number / Número | Name / Nombre | Status / Estado | Priority / Prioridad | Owner / Responsable | Updated / Actualización |",
  "|---|---|---|---|---|---|",
  "| 027 | mcp-full-coverage | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-23 |",
  "| 028 | mcp-builder-superficie-completa | Draft / Borrador | High / Alta | Juan / OpenCode | 2026-08-08 |",
  "| 128 | otro-proyecto | Done / Completada | Medium / Media | Alguien | 2026-01-01 |",
  ""
].join("\n");

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-indexrow-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "specs"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora"), { recursive: true });
  indexPath = path.join(root, "specs/INDEX.md");
  await fs.writeFile(indexPath, INDEX_MD, "utf8");
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe("updateSpecIndexRow (spec 028 R5)", () => {
  it("updates only the named cells of the addressed row, with a one-line diff", async () => {
    const result = await updateSpecIndexRow({
      projectRoot: root,
      specId: "028-mcp-builder-superficie-completa",
      status: "In Progress / En progreso"
    });

    expect(result.specNumber).toBe("028");
    expect(result.row).toContain("| 028 |");
    expect(result.row).toContain("In Progress / En progreso");
    expect(result.row).toContain("High / Alta"); // untouched cell preserved

    const before = INDEX_MD.split("\n");
    const after = (await fs.readFile(indexPath, "utf8")).split("\n");
    const changed = after.filter((line, i) => line !== before[i]);
    expect(changed).toHaveLength(1);
    expect(changed[0]).toBe(result.row);
  });

  it("never confuses 028 with 128 (number anchored at the row start)", async () => {
    await updateSpecIndexRow({ projectRoot: root, specId: "028", priority: "Medium / Media" });

    const content = await fs.readFile(indexPath, "utf8");
    expect(content).toContain("| 128 | otro-proyecto | Done / Completada | Medium / Media | Alguien | 2026-01-01 |");
    expect(content).toMatch(/\| 028 \|[^\n]*Medium \/ Media/);
  });

  it("accepts the bare number, the full slugged id, and updates owner too", async () => {
    const result = await updateSpecIndexRow({
      projectRoot: root,
      specId: "028",
      owner: "Juan Carlos Alvarez Lagos / OpenCode"
    });

    expect(result.row).toContain("Juan Carlos Alvarez Lagos / OpenCode");
  });

  it("fails on an unknown spec number, leaving the file untouched", async () => {
    await expect(
      updateSpecIndexRow({ projectRoot: root, specId: "099-nope", status: "Done / Completada" })
    ).rejects.toThrow(/No row for spec 099/);
    expect(await fs.readFile(indexPath, "utf8")).toBe(INDEX_MD);
  });

  it("rejects pipes, newlines and empty values that would break the table", async () => {
    await expect(
      updateSpecIndexRow({ projectRoot: root, specId: "028", status: "Done | roto" })
    ).rejects.toThrow(/without pipes/);
    await expect(
      updateSpecIndexRow({ projectRoot: root, specId: "028", status: "a\nb" })
    ).rejects.toThrow(/without pipes/);
    await expect(updateSpecIndexRow({ projectRoot: root, specId: "028", status: "  " })).rejects.toThrow(
      /without pipes/
    );
    await expect(updateSpecIndexRow({ projectRoot: root, specId: "028" })).rejects.toThrow(/Nothing to update/);
    expect(await fs.readFile(indexPath, "utf8")).toBe(INDEX_MD);
  });

  it("rejects a spec id with no leading number", async () => {
    await expect(
      updateSpecIndexRow({ projectRoot: root, specId: "sin-numero", status: "Done / Completada" })
    ).rejects.toThrow(/three-digit number/);
  });
});
