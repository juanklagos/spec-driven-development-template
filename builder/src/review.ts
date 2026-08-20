// Spec 036 (R7, R8) — la revisión de una spec, como dato.
//
// Puro y total: no lanza nunca y devuelve `null` cuando no reconoce lo que le
// dan. Es el mismo analizador para los dos caminos de la spec 036 —la cola de
// agentes y el texto pegado a mano desde cualquier IA— y eso no es una
// casualidad de implementación: es lo que garantiza que las dos puertas
// entreguen exactamente el mismo producto (R6, y T8 lo pincha).
//
// Mismo patrón tolerante que `parseStructuredDraft` (spec 031, R5): quitar
// vallas de código, `JSON.parse`, validar campo a campo.

/** Las 7 secciones de la plantilla, en el orden en que las monta el editor. */
export const REVIEW_SECTIONS = [
  "story",
  "scenarios",
  "criteria",
  "requirements",
  "properties",
  "successCriteria",
  "outOfScope"
] as const;

export type ReviewSection = (typeof REVIEW_SECTIONS)[number];

/** Gravedad declarada por la IA. Sin ella, un hallazgo es una nota. */
export type ReviewSeverity = "blocker" | "warning" | "note";

export interface ReviewFinding {
  section: ReviewSection;
  severity: ReviewSeverity;
  /** Qué está mal. Obligatorio: un hallazgo sin texto no es un hallazgo. */
  finding: string;
  /** Por qué importa. Opcional, pero es lo que separa una crítica de un juicio. */
  why: string;
}

export interface Review {
  summary?: string;
  findings: ReviewFinding[];
}

export interface ParsedReview {
  review: Review;
  /** Hallazgos descartados por anclar a algo que no existe o venir vacíos. */
  dropped: number;
}

const SEVERITIES = new Set<ReviewSeverity>(["blocker", "warning", "note"]);

/**
 * El prompt pide las claves en inglés, pero una IA que trabaja en español
 * puede devolver la palabra traducida. Aceptarlas cuesta un mapa y evita
 * descartar una revisión entera por el idioma de una etiqueta.
 */
const SECTION_ALIASES: Record<string, ReviewSection> = {
  historia: "story",
  escenarios: "scenarios",
  criterios: "criteria",
  requisitos: "requirements",
  propiedades: "properties",
  criteriosdeexito: "successCriteria",
  exito: "successCriteria",
  fueradealcance: "outOfScope"
};

function toSection(value: unknown): ReviewSection | null {
  if (typeof value !== "string") return null;
  const key = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  const direct = REVIEW_SECTIONS.find((section) => section.toLowerCase() === key);
  return direct ?? SECTION_ALIASES[key] ?? null;
}

function toSeverity(value: unknown): ReviewSeverity {
  if (typeof value !== "string") return "note";
  const key = value.trim().toLowerCase() as ReviewSeverity;
  return SEVERITIES.has(key) ? key : "note";
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Quita una valla de código envolvente, con o sin etiqueta de lenguaje. */
function unfence(raw: string): string {
  return raw.replace(/^\s*```[a-z]*\s*/i, "").replace(/\s*```\s*$/, "");
}

export function parseReview(raw: string): ParsedReview | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(unfence(raw));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object") return null;

  // Se acepta tanto `{ findings: [...] }` como el array pelado: pedirle a una
  // IA que envuelva su respuesta es pedirle una ceremonia que no cambia nada.
  const source = Array.isArray(parsed) ? { findings: parsed } : (parsed as Record<string, unknown>);
  if (!Array.isArray(source.findings)) return null;

  const findings: ReviewFinding[] = [];
  let dropped = 0;

  for (const entry of source.findings) {
    if (entry === null || typeof entry !== "object") {
      dropped += 1;
      continue;
    }
    const row = entry as Record<string, unknown>;
    const section = toSection(row.section);
    const finding = text(row.finding);
    if (!section || !finding) {
      dropped += 1;
      continue;
    }
    findings.push({ section, severity: toSeverity(row.severity), finding, why: text(row.why) });
  }

  const summary = text(source.summary);
  return { review: { findings, ...(summary ? { summary } : {}) }, dropped };
}
