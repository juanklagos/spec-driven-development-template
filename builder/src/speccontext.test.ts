import { describe, expect, it } from "vitest";

import { buildFieldPrompt } from "./prompts";
import { CONTEXT_BUDGET, buildSpecContext, stripSection } from "./speccontext";

const SPEC = [
  "# Especificación 001 - Ejemplo",
  "",
  "## Estado de aprobación / Approval status",
  "",
  "- Aprobado por / Approved by: `Alguien`",
  "",
  "## Historia de usuario principal",
  "",
  "Como persona quiero X para lograr Y.",
  "",
  "## Criterios de aceptación",
  "",
  "- CUANDO pase A, EL SISTEMA DEBERÁ B.",
  "",
  "## Requisitos",
  "",
  "- R1 — algo"
].join("\n");

describe("stripSection (T1)", () => {
  it("quita la sección pedida y conserva las demás", () => {
    const out = stripSection(SPEC, "criteria");
    expect(out).not.toContain("EL SISTEMA DEBERÁ B");
    expect(out).toContain("Como persona quiero X");
    expect(out).toContain("R1 — algo");
  });

  it("reconoce también el encabezado en inglés", () => {
    const en = SPEC.replace("## Criterios de aceptación", "## Acceptance criteria");
    expect(stripSection(en, "criteria")).not.toContain("EL SISTEMA DEBERÁ B");
  });

  it("deja el markdown intacto si la sección no está", () => {
    expect(stripSection(SPEC, "outOfScope")).toContain("EL SISTEMA DEBERÁ B");
  });
});

describe("buildSpecContext", () => {
  it("excluye la sección en edición, que ya viaja como currentText (T1)", () => {
    const ctx = buildSpecContext({ specMarkdown: SPEC, exclude: "criteria" });
    expect(ctx).toBeTruthy();
    expect(ctx).not.toContain("EL SISTEMA DEBERÁ B");
    expect(ctx).toContain("Como persona quiero X");
  });

  it("no produce contexto cuando no hay spec detrás del campo (T3)", () => {
    expect(buildSpecContext({})).toBeUndefined();
    expect(buildSpecContext({ specMarkdown: "   " })).toBeUndefined();
  });

  it("incluye el plan cuando se le pasa", () => {
    const ctx = buildSpecContext({ specMarkdown: SPEC, planMarkdown: "# Plan\n\nFases." });
    expect(ctx).toContain("Fases.");
  });

  it("respeta el tope y marca el recorte (T2)", () => {
    const huge = SPEC + "\n\n## Extra\n\n" + "x".repeat(CONTEXT_BUDGET * 2);
    const ctx = buildSpecContext({ specMarkdown: huge })!;
    expect(ctx.length).toBeLessThanOrEqual(CONTEXT_BUDGET);
    expect(ctx).toContain("recortado por tamaño");
  });

  it("no marca recorte cuando cabe entero", () => {
    expect(buildSpecContext({ specMarkdown: SPEC })).not.toContain("recortado");
  });
});

describe("las dos puertas llevan lo mismo (T4)", () => {
  // El principio que fijó la spec 036: la cola y el prompt copiable comparten
  // contenido, o dejan de dar el mismo producto. Aquí se comprueba sobre el
  // contexto, que es lo que la 039 añade a ambos.
  const ctx = buildSpecContext({ specMarkdown: SPEC, exclude: "criteria" })!;

  it("el prompt copiable incorpora el contexto de la petición", () => {
    const prompt = buildFieldPrompt("section", "001-x", "criteria", "- viejo", "amplía", "es", ctx);
    expect(prompt).toContain("Como persona quiero X");
    expect(prompt).toMatch(/solo lectura/i);
  });

  it("sin contexto, el prompt no inventa el bloque", () => {
    const prompt = buildFieldPrompt("note", undefined, "n1", "texto", "amplía", "es");
    expect(prompt).not.toMatch(/Contexto de la spec/);
  });

  it("el prompt no filtra la sección en edición dentro del contexto", () => {
    const prompt = buildFieldPrompt("section", "001-x", "criteria", "- viejo", "amplía", "es", ctx);
    const before = prompt.slice(0, prompt.indexOf("Texto actual:"));
    expect(before).not.toContain("EL SISTEMA DEBERÁ B");
  });

  it("la puerta en inglés marca el contexto igual", () => {
    const prompt = buildFieldPrompt("section", "001-x", "criteria", "- old", "expand", "en", ctx);
    expect(prompt).toMatch(/read-only/i);
  });
});

describe("el bloque de aprobación nunca viaja (spec 039)", () => {
  it("se excluye siempre, aunque no sea la sección en edición", () => {
    const ctx = buildSpecContext({ specMarkdown: SPEC })!;
    expect(ctx).not.toContain("Aprobado por");
    expect(ctx).not.toMatch(/Estado de aprobaci/i);
    expect(ctx).toContain("Como persona quiero X");
  });

  it("también con el encabezado en inglés", () => {
    const en = SPEC.replace("## Estado de aprobación / Approval status", "## Approval status");
    expect(buildSpecContext({ specMarkdown: en })).not.toContain("Aprobado por");
  });
});
