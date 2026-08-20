// Spec 039 — el contexto que acompaña a «Ampliar con IA», como dato.
//
// Puro y total: nunca lanza, y devuelve `undefined` cuando no hay nada que
// mandar. Existe porque el cajón ya tiene `spec.md` y `plan.md` completos en
// memoria cuando la persona pulsa el botón, y hasta ahora no bajaban: el
// modelo redactaba los criterios de aceptación sin haber visto la historia de
// usuario que estaba tres centímetros más arriba.
//
// Lo que produce viaja por los DOS caminos —la petición de la cola y el prompt
// copiable— igual que hizo la 036 con la revisión. Si se duplicara la
// composición, se duplicaría con ella el contrato de qué ve el modelo.

import { matchesSectionHeading, type SectionKey } from "./sections";

/**
 * Tope de caracteres del bloque de contexto.
 *
 * Lo fija el camino copiable, no el del agente: por MCP 16 KB no son nada,
 * pero el prompt copiable lo pega una persona a mano. Medido sobre cinco specs
 * del repositorio, `spec.md` va de 4.9 KB a 10.5 KB, así que este tope deja
 * pasar entera la mayoría y recorta solo las más largas.
 */
export const CONTEXT_BUDGET = 8000;

/** Marca visible del recorte: el modelo debe saber que no lo vio todo. */
const TRUNCATED_ES = "\n\n[…contexto recortado por tamaño…]";

/**
 * El bloque de aprobación, que nunca entra en el contexto.
 *
 * Por dos razones. Es ruido para redactar —fecha, aprobador y evidencia no
 * ayudan a escribir un criterio EARS— y es la única superficie que la spec 031
 * dejó deliberadamente sin botón de IA, por ser la firma humana de la
 * compuerta. Mandarla como contexto sería enseñarle al modelo justo lo que no
 * le toca.
 */
const APPROVAL_HEADING = /^##\s+(estado de aprobaci|approval status)/i;

/** Quita el bloque de aprobación, desde su encabezado hasta el siguiente `##`. */
export function stripApproval(markdown: string): string {
  const out: string[] = [];
  let skipping = false;
  for (const line of markdown.split("\n")) {
    if (APPROVAL_HEADING.test(line)) {
      skipping = true;
      continue;
    }
    if (skipping && /^##\s/.test(line)) skipping = false;
    if (!skipping) out.push(line);
  }
  return out.join("\n");
}

/**
 * Quita del markdown la sección `key`, desde su encabezado hasta el siguiente
 * `##`. La sección en edición ya viaja como `currentText`; repetirla gasta
 * presupuesto y confunde sobre qué hay que reescribir.
 */
export function stripSection(markdown: string, key: SectionKey): string {
  const lines = markdown.split("\n");
  const out: string[] = [];
  let skipping = false;
  for (const line of lines) {
    if (matchesSectionHeading(line, key)) {
      skipping = true;
      continue;
    }
    if (skipping && /^##\s/.test(line)) skipping = false;
    if (!skipping) out.push(line);
  }
  return out.join("\n");
}

export interface SpecContextInput {
  specMarkdown?: string;
  planMarkdown?: string;
  /** Sección en edición, que se excluye por venir ya como `currentText`. */
  exclude?: SectionKey;
}

/**
 * El bloque de contexto, o `undefined` cuando no hay spec detrás del campo
 * —notas del lienzo y bitácora no pertenecen a ninguna— o cuando lo que queda
 * tras excluir la sección en edición está vacío.
 */
export function buildSpecContext(input: SpecContextInput): string | undefined {
  const spec = (input.specMarkdown ?? "").trim();
  if (!spec) return undefined;

  const withoutApproval = stripApproval(spec);
  const body = (input.exclude ? stripSection(withoutApproval, input.exclude) : withoutApproval).trim();
  if (!body) return undefined;

  const parts = [`# Spec (contexto, solo lectura)\n\n${body}`];
  const plan = (input.planMarkdown ?? "").trim();
  if (plan) parts.push(`# Plan (contexto, solo lectura)\n\n${plan}`);

  const full = parts.join("\n\n");
  if (full.length <= CONTEXT_BUDGET) return full;
  return full.slice(0, CONTEXT_BUDGET - TRUNCATED_ES.length) + TRUNCATED_ES;
}
