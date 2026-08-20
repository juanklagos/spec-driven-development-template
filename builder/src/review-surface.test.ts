// Spec 036, T9/T12 (R10, R12). Dos promesas que un usuario no puede
// verificar mirando la pantalla, así que las verifica esto:
//
//   R10 — recibir una revisión no escribe nada. El panel no tiene forma de
//         escribir: no importa ninguna ruta de escritura.
//   R12 — no hay claves ni tráfico saliente. Fue la decisión 1 de la spec, y
//         una decisión sin prueba se deshace sola en el siguiente commit.
//
// A nivel de fuente a propósito, como ai-surfaces.test.ts: la regla es sobre
// qué puede llegar a hacer el módulo, no sobre lo que hace en una ejecución.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = __dirname;
const read = (rel: string): string => fs.readFileSync(path.join(SRC, rel), "utf8");

/** Los módulos que la spec 036 añade o toca para la revisión. */
const REVIEW_MODULES = ["review.ts", "components/ReviewPanel.tsx", "prompts.ts"];

/** Rutas de escritura del builder: si aparecen aquí, algo escribe. */
const WRITE_CALLS = /\b(putSections|createSpec|putBoard|putTask|approveSpec|recordConsent|putBitacora|writeBitacora)\b/;

describe("R10: the review writes nothing by itself", () => {
  it("ReviewPanel imports no write route", () => {
    const source = read("components/ReviewPanel.tsx");
    expect(source).not.toMatch(WRITE_CALLS);
  });

  it("ReviewPanel does not even pull in the api object", () => {
    const source = read("components/ReviewPanel.tsx");
    // `errorMessage` sí, que es formateo de errores; `api` no.
    expect(source).not.toMatch(/import\s*\{[^}]*\bapi\b[^}]*\}\s*from\s*"\.\.\/api"/);
  });

  it("the parser is pure: no imports at all beyond types", () => {
    const source = read("review.ts");
    expect(source).not.toMatch(/^import /m);
  });

  it("its only actionable exit is the section's own AI button", () => {
    const source = read("components/ReviewPanel.tsx");
    expect(source).toMatch(/onFix\(/);
  });
});

describe("R12: no API keys, no outbound traffic", () => {
  for (const rel of REVIEW_MODULES) {
    it(`${rel} carries no credential of any kind`, () => {
      const source = read(rel);
      expect(source).not.toMatch(/\b(apiKey|api_key|secretKey|Authorization|Bearer|OPENAI|ANTHROPIC)\b/i);
    });

    it(`${rel} opens no connection to an external host`, () => {
      const source = read(rel);
      // Las URLs http(s) que quedan en el builder son documentación (docsUrl,
      // atribuciones). Aquí no debe haber ninguna, ni fetch, ni WebSocket.
      expect(source).not.toMatch(/https?:\/\//);
      expect(source).not.toMatch(/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/);
    });
  }

  it("the queue stays the only transport, and it is same-origin", () => {
    // `sendAiRequest` va al store, que llama a `/api/request` — ruta relativa,
    // el mismo servidor local que ya sirve el lienzo.
    const store = read("store.ts");
    expect(store).toMatch(/api\.createAiRequest|sendAiRequest/);
    expect(read("api.ts")).not.toMatch(/fetch\(\s*["'`]https?:/);
  });
});

// Spec 036, T7 (R5, R6). Las dos puertas existen y cuelgan de la MISMA señal
// de presencia que ya usa el resto del builder (spec 031, R6: 5 minutos). Lo
// que se verifica aquí es la ramificación; el umbral tiene su propia prueba en
// requests.test.ts, y duplicarlo sería duplicar la fuente de la verdad.
describe("R5/R6: two doors, one presence signal", () => {
  const source = read("components/ReviewPanel.tsx");

  it("decides by isAgentConnected, not by its own clock", () => {
    expect(source).toMatch(/isAgentConnected\(agentPresence, now\)/);
    expect(source).not.toMatch(/5\s*\*\s*60|300_?000/); // el umbral no se copia aquí
  });

  it("with an agent, it publishes a review-spec request", () => {
    expect(source).toMatch(/type:\s*"review-spec"/);
    expect(source).toMatch(/kind:\s*"spec"/);
  });

  it("without an agent, it offers the copyable prompt AND the way back in", () => {
    expect(source).toMatch(/<PromptBox/);
    expect(source).toMatch(/review\.paste/);
    expect(source).toMatch(/readPasted/);
  });

  it("both doors end in the same parser", () => {
    const calls = source.match(/parseReview\(/g) ?? [];
    expect(calls.length).toBe(2); // la de la cola y la del pegado, ninguna más
  });
});

