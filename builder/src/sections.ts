// Client-side parser that prefills the guided spec editor from spec.md.
// Reading only — every write goes through PUT /api/spec/:id/sections, whose
// surgical logic lives in sdd-core (spec-actions.ts). The heading aliases
// mirror that module so what we read is exactly what the server will replace.
// Spec 010 (R2) extends the guided sections to the FULL template: story,
// scenarios, EARS criteria, requirements, spec properties, success criteria
// and out of scope — plus a read-only view of the approval block.

import type { SpecSectionsInput } from "./types";

export type SectionKey = keyof Required<SpecSectionsInput>;

const ALIASES: Record<SectionKey, RegExp[]> = {
  story: [/^##\s+historia de usuario/i, /^##\s+user stor/i],
  scenarios: [/^##\s+escenarios de aceptaci/i, /^##\s+acceptance scenarios/i],
  criteria: [/^##\s+criterios de aceptaci/i, /^##\s+acceptance criteria/i],
  requirements: [/^##\s+requisitos/i, /^##\s+requirements/i],
  properties: [/^##\s+propiedades de la spec/i, /^##\s+spec properties/i],
  successCriteria: [/^##\s+criterios de [ée]xito/i, /^##\s+success criteria/i],
  outOfScope: [/^##\s+fuera de alcance/i, /^##\s+out of scope/i]
};

/** Template placeholder lines we hide from the guided editor lists. */
const TEMPLATE_NOISE = [
  /\[(disparador|condición de error|trigger|error condition)\]/i,
  /^Guía \/ Guide:/i,
  /^EN: WHEN \[/i,
  /^Dado \.\.\., cuando \.\.\., entonces \.\.\.$/i,
  /^Requisito \d+$/i,
  /^Requirement \d+$/i,
  /^Criterio \d+$/i,
  /^Criterion \d+$/i,
  /^<!--.*-->$/
];

export interface ParsedSections {
  story: string;
  scenarios: string[];
  criteria: string[];
  requirements: string[];
  properties: string[];
  successCriteria: string[];
  outOfScope: string;
  /** Which headings exist in the document (missing ones get appended on save). */
  present: Record<SectionKey, boolean>;
}

function sectionBody(lines: string[], key: SectionKey): { body: string[]; present: boolean } {
  const start = lines.findIndex((line) => ALIASES[key].some((alias) => alias.test(line)));
  if (start === -1) return { body: [], present: false };
  const body: string[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^#{1,2}\s/.test(lines[i])) break;
    body.push(lines[i]);
  }
  return { body, present: true };
}

function asText(body: string[]): string {
  return body.join("\n").trim();
}

function asList(body: string[], itemPattern: RegExp): string[] {
  return body
    .map((line) => line.trim())
    .filter((line) => itemPattern.test(line))
    .map((line) => line.replace(itemPattern, "").trim())
    .filter((item) => item.length > 0 && !TEMPLATE_NOISE.some((noise) => noise.test(item)));
}

const BULLET_RE = /^[-*]\s*/;
const NUMBERED_RE = /^\d+\.\s*/;

export function parseSpecSections(specMarkdown: string): ParsedSections {
  const lines = specMarkdown.split("\n");
  const story = sectionBody(lines, "story");
  const scenarios = sectionBody(lines, "scenarios");
  const criteria = sectionBody(lines, "criteria");
  const requirements = sectionBody(lines, "requirements");
  const properties = sectionBody(lines, "properties");
  const successCriteria = sectionBody(lines, "successCriteria");
  const outOfScope = sectionBody(lines, "outOfScope");

  return {
    story: asText(story.body),
    scenarios: asList(scenarios.body, NUMBERED_RE),
    criteria: asList(criteria.body, BULLET_RE),
    requirements: asList(requirements.body, BULLET_RE),
    properties: asList(properties.body, BULLET_RE),
    successCriteria: asList(successCriteria.body, BULLET_RE),
    outOfScope: asText(outOfScope.body),
    present: {
      story: story.present,
      scenarios: scenarios.present,
      criteria: criteria.present,
      requirements: requirements.present,
      properties: properties.present,
      successCriteria: successCriteria.present,
      outOfScope: outOfScope.present
    }
  };
}

// ---------------------------------------------------------------------------
// Approval block (read-only view for the Approval tab, spec 010, R2). The
// line regexes mirror sdd-core approveSpec so what we display is exactly what
// the server edits.
// ---------------------------------------------------------------------------

export interface ParsedApproval {
  /** Raw status value (e.g. "Aprobado" / "Pendiente"), empty when missing. */
  status: string;
  date: string;
  approver: string;
  evidence: string;
  /** True when spec.md carries the backticked "Estado / Status" line. */
  present: boolean;
}

const STATUS_LINE_RE = /^\s*-\s*Estado \/ Status:\s*`([^`]*)`/m;
const DATE_LINE_RE = /^\s*-\s*Fecha de aprobación \/ Approval date:\s*`([^`]*)`/m;
const APPROVER_LINE_RE = /^\s*-\s*Aprobado por \/ Approved by:\s*`([^`]*)`/m;
const EVIDENCE_LINE_RE = /^\s*-\s*Evidencia de aprobación[^\n]*Approval evidence[^:\n]*:[ \t]*(\S[^\n]*)?$/m;

/** Placeholder values from the template that should read as "not set". */
const PLACEHOLDER_RE = /^(YYYY-MM-DD|Nombre o rol)$/i;

function cleanField(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return PLACEHOLDER_RE.test(trimmed) ? "" : trimmed;
}

export function parseApproval(specMarkdown: string): ParsedApproval {
  const status = specMarkdown.match(STATUS_LINE_RE)?.[1];
  return {
    status: (status ?? "").trim(),
    date: cleanField(specMarkdown.match(DATE_LINE_RE)?.[1]),
    approver: cleanField(specMarkdown.match(APPROVER_LINE_RE)?.[1]),
    evidence: cleanField(specMarkdown.match(EVIDENCE_LINE_RE)?.[1]),
    present: status !== undefined
  };
}
