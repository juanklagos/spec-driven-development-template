// Spec 036, T11 (R1). El asistente deja de tener una puerta cerrada: sus dos
// acciones existen con 0 specs y con 30. La parte pura se prueba como tal; la
// ausencia de la guardia se pincha a nivel de fuente, como ya hace
// ai-surfaces.test.ts, porque es un contrato sobre qué monta el componente.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { generateDraft, scopeSpecs } from "./assistant";

const WIZARD = fs.readFileSync(path.join(__dirname, "components", "AssistantWizard.tsx"), "utf8");

describe("scopeSpecs", () => {
  const draft = generateDraft("tienda online de plantas con pagos y panel de administracion", 0, "es");

  it("proposes the whole board untouched", () => {
    expect(scopeSpecs(draft, "board")).toEqual(draft.specs);
  });

  it("proposes exactly one spec when that is the scope", () => {
    expect(scopeSpecs(draft, "one")).toHaveLength(1);
    expect(scopeSpecs(draft, "one")[0]).toEqual(draft.specs[0]);
  });

  it("never invents a spec out of an empty draft", () => {
    const empty = { ...draft, specs: [] };
    expect(scopeSpecs(empty, "one")).toEqual([]);
    expect(scopeSpecs(empty, "board")).toEqual([]);
  });
});

describe("R1: the wizard has no empty-workspace gate", () => {
  it("does not read hasSpecs at all", () => {
    expect(WIZARD).not.toMatch(/hasSpecs/);
  });

  it("does not ship the old amber warning", () => {
    expect(WIZARD).not.toMatch(/assistant\.hasSpecs/);
  });

  it("offers both proposal scopes", () => {
    expect(WIZARD).toMatch(/assistant\.proposeOne/);
    expect(WIZARD).toMatch(/assistant\.proposeBoard/);
  });
});
