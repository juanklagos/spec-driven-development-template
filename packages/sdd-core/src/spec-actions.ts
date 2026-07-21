// Surgical spec.md edits for the SDD Builder (spec 007):
//   - approveSpec: fill the existing "Estado de aprobación / Approval status"
//     block (status, date, approver, evidence) without touching anything else.
//   - updateSpecSections: replace ONLY the content under the guided-editor
//     headings (user story, scenarios, EARS criteria, out of scope) and
//     preserve the rest of the document (approval block, requirements, ...).
// Both operations are tolerant to the EN/ES headings of the two spec
// templates shipped in this repo (specs/_template/spec.md and
// templates/spec/spec.template.md) and reuse the atomic read/write layer
// from board.ts, so REST and MCP transports share the exact same behavior.

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
 * name, and the evidence line -> "Aprobado desde SDD Builder" when empty.
 * Fails with a clear bilingual error when the block does not exist.
 */
export async function approveSpec(
  projectRoot: string,
  specId: string,
  approver: string
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

  let evidenceUpdated = false;
  next = next.replace(EVIDENCE_LINE_RE, (_line, prefix: string, existing: string | undefined) => {
    // Only fill the evidence when it is empty; never overwrite a real link/quote.
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
  outOfScope: {
    aliases: [/^##\s+fuera de alcance/i, /^##\s+out of scope/i],
    heading: "## Fuera de alcance / Out of scope",
    render: renderText
  }
};

const SECTION_ORDER: SpecSectionKey[] = ["story", "scenarios", "criteria", "outOfScope"];

function normalizeSections(input: SpecSectionsInput): Map<SpecSectionKey, string> {
  const provided = new Map<SpecSectionKey, string>();
  for (const key of SECTION_ORDER) {
    const value = input[key];
    if (value === undefined) continue;
    if (key === "scenarios" || key === "criteria") {
      if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
        throw new Error(`Section "${key}" must be an array of strings / debe ser una lista de textos`);
      }
      provided.set(key, SECTION_SPECS[key].render(value.map((item) => item.trim()).filter(Boolean)));
    } else {
      if (typeof value !== "string") {
        throw new Error(`Section "${key}" must be a string / debe ser texto`);
      }
      provided.set(key, SECTION_SPECS[key].render(value));
    }
  }
  if (provided.size === 0) {
    throw new Error(
      "Expected at least one section: story, scenarios, criteria, outOfScope / " +
        "Se esperaba al menos una sección: story, scenarios, criteria, outOfScope"
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
