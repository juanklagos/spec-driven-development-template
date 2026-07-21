// Surgical spec.md edits for the SDD Builder (spec 007):
//   - approveSpec: fill the existing "Estado de aprobación / Approval status"
//     block (status, date, approver, evidence) without touching anything else.
//   - updateSpecSections: replace ONLY the content under the guided-editor
//     headings (user story, scenarios, EARS criteria, requirements, spec
//     properties, success criteria, out of scope — the full template since
//     spec 010, R2) and preserve the rest of the document (approval block,
//     any custom sections, ...).
// Both operations are tolerant to the EN/ES headings of the two spec
// templates shipped in this repo (specs/_template/spec.md and
// templates/spec/spec.template.md) and reuse the atomic read/write layer
// from board.ts, so REST and MCP transports share the exact same behavior.
// Spec 008 adds validateEarsCriterion: the EARS lint shared (by contract,
// not by import) with the builder frontend — see builder/src/ears.ts.

import { readSpecDocument, writeSpecDocument } from "./board.js";

// ---------------------------------------------------------------------------
// approveSpec
// ---------------------------------------------------------------------------

export interface ApproveSpecResult {
  specId: string;
  status: "Aprobado";
  approvalDate: string;
  approver: string;
  /** True when the empty evidence line was filled by the builder. */
  evidenceUpdated: boolean;
  /** Which approval fields were actually rewritten (status, date, approver, evidence). */
  fieldsUpdated: string[];
}

const STATUS_LINE_RE = /^(\s*-\s*Estado \/ Status:\s*)`[^`]*`/m;
const DATE_LINE_RE = /^(\s*-\s*Fecha de aprobación \/ Approval date:\s*)`[^`]*`/m;
const APPROVER_LINE_RE = /^(\s*-\s*Aprobado por \/ Approved by:\s*)`[^`]*`/m;
const EVIDENCE_LINE_RE = /^(\s*-\s*Evidencia de aprobación[^\n]*Approval evidence[^:\n]*:)[ \t]*(\S[^\n]*)?$/m;

const BUILDER_EVIDENCE = "Aprobado desde SDD Builder / Approved from SDD Builder";

/**
 * Approve a spec by surgically editing the existing approval block of its
 * spec.md: Estado -> `Aprobado`, approval date -> today, approver -> given
 * name, and the evidence line -> the given evidence (spec 010, R2) or
 * "Aprobado desde SDD Builder" when empty. A caller-provided evidence always
 * wins; without one, existing evidence is never overwritten.
 * Fails with a clear bilingual error when the block does not exist.
 */
export async function approveSpec(
  projectRoot: string,
  specId: string,
  approver: string,
  evidence?: string
): Promise<ApproveSpecResult> {
  const approverName = approver.trim();
  if (!approverName) {
    throw new Error("Approver name is required / Falta el nombre de quien aprueba");
  }

  const content = await readSpecDocument(projectRoot, specId, "spec.md");
  if (!STATUS_LINE_RE.test(content)) {
    throw new Error(
      `${specId}/spec.md has no "Estado de aprobación / Approval status" section — ` +
        "copy the block from specs/_template/spec.md first / " +
        `${specId}/spec.md no tiene la sección "Estado de aprobación" — copia el bloque de specs/_template/spec.md primero`
    );
  }

  const approvalDate = new Date().toISOString().slice(0, 10);
  const fieldsUpdated: string[] = [];
  let next = content.replace(STATUS_LINE_RE, (_line, prefix: string) => {
    fieldsUpdated.push("status");
    return `${prefix}\`Aprobado\``;
  });
  next = next.replace(DATE_LINE_RE, (_line, prefix: string) => {
    fieldsUpdated.push("date");
    return `${prefix}\`${approvalDate}\``;
  });
  next = next.replace(APPROVER_LINE_RE, (_line, prefix: string) => {
    fieldsUpdated.push("approver");
    return `${prefix}\`${approverName}\``;
  });

  const providedEvidence = evidence?.trim();
  let evidenceUpdated = false;
  next = next.replace(EVIDENCE_LINE_RE, (_line, prefix: string, existing: string | undefined) => {
    // Caller-provided evidence always wins (spec 010, R2); otherwise only
    // fill the line when it is empty — never overwrite a real link/quote.
    if (providedEvidence) {
      evidenceUpdated = true;
      fieldsUpdated.push("evidence");
      return `${prefix} ${providedEvidence}`;
    }
    if (existing && existing.trim()) return `${prefix} ${existing.trim()}`;
    evidenceUpdated = true;
    fieldsUpdated.push("evidence");
    return `${prefix} ${BUILDER_EVIDENCE} (${approvalDate})`;
  });

  await writeSpecDocument(projectRoot, specId, "spec.md", next);
  return { specId, status: "Aprobado", approvalDate, approver: approverName, evidenceUpdated, fieldsUpdated };
}

// ---------------------------------------------------------------------------
// updateSpecSections
// ---------------------------------------------------------------------------

export interface SpecSectionsInput {
  /** Main user story (free text). */
  story?: string;
  /** Acceptance scenarios; written as a numbered list. */
  scenarios?: string[];
  /** EARS acceptance criteria; written as a bullet list. */
  criteria?: string[];
  /** Requirements; written as a bullet list (spec 010, R2). */
  requirements?: string[];
  /** Spec properties (bridge to executable specs); bullet list (spec 010, R2). */
  properties?: string[];
  /** Success criteria; written as a bullet list (spec 010, R2). */
  successCriteria?: string[];
  /** Out of scope (free text). */
  outOfScope?: string;
}

export type SpecSectionKey = keyof SpecSectionsInput;

export interface UpdateSpecSectionsResult {
  specId: string;
  /** Sections whose existing heading content was replaced. */
  updated: SpecSectionKey[];
  /** Sections appended because the heading did not exist in this spec.md. */
  created: SpecSectionKey[];
}

interface SectionSpec {
  /** Level-2 heading matchers for the ES and EN template variants. */
  aliases: RegExp[];
  /** Canonical heading used when the section must be appended. */
  heading: string;
  render(value: string | string[]): string;
}

const renderText = (value: string | string[]): string => String(value).trim();
const renderNumbered = (value: string | string[]): string =>
  (value as string[]).map((item, i) => `${i + 1}. ${item.trim()}`).join("\n");
const renderBullets = (value: string | string[]): string =>
  (value as string[]).map((item) => `- ${item.trim()}`).join("\n");

const SECTION_SPECS: Record<SpecSectionKey, SectionSpec> = {
  story: {
    aliases: [/^##\s+historia de usuario/i, /^##\s+user stor/i],
    heading: "## Historia de usuario principal",
    render: renderText
  },
  scenarios: {
    aliases: [/^##\s+escenarios de aceptaci/i, /^##\s+acceptance scenarios/i],
    heading: "## Escenarios de aceptación",
    render: renderNumbered
  },
  criteria: {
    aliases: [/^##\s+criterios de aceptaci/i, /^##\s+acceptance criteria/i],
    heading:
      "## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)",
    render: renderBullets
  },
  requirements: {
    aliases: [/^##\s+requisitos/i, /^##\s+requirements/i],
    heading: "## Requisitos",
    render: renderBullets
  },
  properties: {
    aliases: [/^##\s+propiedades de la spec/i, /^##\s+spec propert/i],
    heading:
      "## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)",
    render: renderBullets
  },
  successCriteria: {
    aliases: [/^##\s+criterios de [ée]xito/i, /^##\s+success criteria/i],
    heading: "## Criterios de éxito",
    render: renderBullets
  },
  outOfScope: {
    aliases: [/^##\s+fuera de alcance/i, /^##\s+out of scope/i],
    heading: "## Fuera de alcance / Out of scope",
    render: renderText
  }
};

/** Document order of the spec template (specs/_template/spec.md). */
const SECTION_ORDER: SpecSectionKey[] = [
  "story",
  "scenarios",
  "criteria",
  "requirements",
  "properties",
  "successCriteria",
  "outOfScope"
];

const LIST_SECTIONS = new Set<SpecSectionKey>([
  "scenarios",
  "criteria",
  "requirements",
  "properties",
  "successCriteria"
]);

function normalizeSections(input: SpecSectionsInput): Map<SpecSectionKey, string> {
  const provided = new Map<SpecSectionKey, string>();
  for (const key of SECTION_ORDER) {
    const value = input[key];
    if (value === undefined) continue;
    if (LIST_SECTIONS.has(key)) {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw new Error(`Section "${key}" must be an array of strings / debe ser una lista de textos`);
      }
      provided.set(key, SECTION_SPECS[key].render(value.map((item) => item.trim()).filter(Boolean)));
    } else {
      if (typeof value !== "string") {
        throw new Error(`Section "${key}" must be a string / debe ser texto`);
      }
      provided.set(key, SECTION_SPECS[key].render(value as string));
    }
  }
  if (provided.size === 0) {
    throw new Error(
      "Expected at least one section: story, scenarios, criteria, requirements, properties, successCriteria, outOfScope / " +
        "Se esperaba al menos una sección: story, scenarios, criteria, requirements, properties, successCriteria, outOfScope"
    );
  }
  return provided;
}

/** Index of the first line matching any alias, or -1. */
function findHeading(lines: string[], spec: SectionSpec): number {
  return lines.findIndex((line) => spec.aliases.some((alias) => alias.test(line)));
}

/** Index of the next level-1/level-2 heading after `start`, or lines.length. */
function findSectionEnd(lines: string[], start: number): number {
  for (let i = start; i < lines.length; i += 1) {
    if (/^#{1,2}\s/.test(lines[i])) return i;
  }
  return lines.length;
}

/**
 * Replace ONLY the content under the guided-editor headings of a spec.md and
 * preserve everything else. Headings missing from the document (e.g. the ES
 * template has no "Fuera de alcance") are appended at the end with their
 * canonical bilingual heading. The write is atomic.
 */
export async function updateSpecSections(
  projectRoot: string,
  specId: string,
  sections: SpecSectionsInput
): Promise<UpdateSpecSectionsResult> {
  const provided = normalizeSections(sections);
  const content = await readSpecDocument(projectRoot, specId, "spec.md");
  const lines = content.split("\n");
  const updated: SpecSectionKey[] = [];
  const created: SpecSectionKey[] = [];

  for (const key of SECTION_ORDER) {
    const rendered = provided.get(key);
    if (rendered === undefined) continue;
    const spec = SECTION_SPECS[key];
    const headingIndex = findHeading(lines, spec);
    const body = rendered ? ["", ...rendered.split("\n")] : [""];

    if (headingIndex === -1) {
      // Append the missing section at the end without touching anything else.
      while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
      lines.push("", spec.heading, ...body, "");
      created.push(key);
      continue;
    }

    const end = findSectionEnd(lines, headingIndex + 1);
    lines.splice(headingIndex + 1, end - (headingIndex + 1), ...body, "");
    updated.push(key);
  }

  let next = lines.join("\n");
  if (!next.endsWith("\n")) next += "\n";
  await writeSpecDocument(projectRoot, specId, "spec.md", next);
  return { specId, updated, created };
}

// ---------------------------------------------------------------------------
// validateEarsCriterion (spec 008, R3)
// ---------------------------------------------------------------------------
// EARS lint for one acceptance criterion. Exposed here for agents (MCP) and
// server-side callers; the builder frontend keeps its own copy of the same
// rules in builder/src/ears.ts (the frontend does not import sdd-core).
// KEEP THE REGEXES IN SYNC with builder/src/ears.ts — a mcp:test assert
// exercises this export so both sides stay honest.

export type EarsLintLevel = "ok" | "warning";

export interface EarsLintResult {
  level: EarsLintLevel;
  /** True when the CUANDO/WHEN/SI/IF/MIENTRAS/WHILE … DEBERÁ/SHALL skeleton is present. */
  matchesPattern: boolean;
  /** Vague words found while the criterion carries no measurable number. */
  vagueWords: string[];
  /** Short bilingual hints; empty when the criterion lints clean. */
  hints: string[];
}

/**
 * EARS skeleton: a trigger keyword up front and an obligation keyword later.
 * Case-insensitive; tolerates a leading list bullet, plural "DEBERÁN" and the
 * unaccented "DEBERA". Accepts "EL SISTEMA DEBERÁ …" / "THE SYSTEM SHALL …".
 * Note: the obligation ends with a (?!\w) lookahead instead of \b because
 * "Á" is not an ASCII word character in JS regexes (a trailing \b would
 * silently reject the accented "DEBERÁ").
 */
const EARS_PATTERN_RE = /^\s*(?:[-*]\s*)?(?:CUANDO|WHEN|SI|IF|MIENTRAS|WHILE)\b.*\b(?:DEBER[ÁA]N?|SHALL)(?!\w)/i;

/** Vague adjectives that need a number to be testable (ES/EN + variants). */
const VAGUE_WORDS_RE = /\b(r[áa]pid[oa]s?|f[áa]cil(?:es)?|intuitiv[oa]s?|fast|easy|user[- ]?friendly)\b/gi;

const HAS_NUMBER_RE = /\d/;

/**
 * Live EARS lint for one criterion line. Never blocking: the result is a
 * suggestion (`ok`/`warning` + hints), not a validation error. Empty input
 * lints clean so callers can skip untouched rows.
 */
export function validateEarsCriterion(text: string): EarsLintResult {
  const value = text.trim();
  if (value === "") {
    return { level: "ok", matchesPattern: false, vagueWords: [], hints: [] };
  }

  const hints: string[] = [];
  const matchesPattern = EARS_PATTERN_RE.test(value);
  if (!matchesPattern) {
    hints.push(
      "Patrón EARS: CUANDO/SI/MIENTRAS … EL SISTEMA DEBERÁ … / " +
        "EARS pattern: WHEN/IF/WHILE … THE SYSTEM SHALL …"
    );
  }

  const vagueWords = HAS_NUMBER_RE.test(value)
    ? []
    : [...new Set((value.match(VAGUE_WORDS_RE) ?? []).map((word) => word.toLowerCase()))];
  if (vagueWords.length > 0) {
    hints.push(
      `Palabra vaga sin número medible: ${vagueWords.join(", ")} / ` +
        `Vague word without a measurable number: ${vagueWords.join(", ")}`
    );
  }

  return { level: hints.length > 0 ? "warning" : "ok", matchesPattern, vagueWords, hints };
}
