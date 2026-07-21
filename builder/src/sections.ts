// Client-side parser that prefills the guided spec editor from spec.md.
// Reading only — every write goes through PUT /api/spec/:id/sections, whose
// surgical logic lives in sdd-core (spec-actions.ts). The heading aliases
// mirror that module so what we read is exactly what the server will replace.

import type { SpecSectionsInput } from "./types";

export type SectionKey = keyof Required<SpecSectionsInput>;

const ALIASES: Record<SectionKey, RegExp[]> = {
  story: [/^##\s+historia de usuario/i, /^##\s+user stor/i],
  scenarios: [/^##\s+escenarios de aceptaci/i, /^##\s+acceptance scenarios/i],
  criteria: [/^##\s+criterios de aceptaci/i, /^##\s+acceptance criteria/i],
  outOfScope: [/^##\s+fuera de alcance/i, /^##\s+out of scope/i]
};

/** Template placeholder lines we hide from the guided editor lists. */
const TEMPLATE_NOISE = [
  /\[(disparador|condición de error|trigger|error condition)\]/i,
  /^Guía \/ Guide:/i,
  /^EN: WHEN \[/i,
  /^Dado \.\.\., cuando \.\.\., entonces \.\.\.$/i
];

export interface ParsedSections {
  story: string;
  scenarios: string[];
  criteria: string[];
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

export function parseSpecSections(specMarkdown: string): ParsedSections {
  const lines = specMarkdown.split("\n");
  const story = sectionBody(lines, "story");
  const scenarios = sectionBody(lines, "scenarios");
  const criteria = sectionBody(lines, "criteria");
  const outOfScope = sectionBody(lines, "outOfScope");

  return {
    story: asText(story.body),
    scenarios: asList(scenarios.body, /^\d+\.\s*/),
    criteria: asList(criteria.body, /^[-*]\s*/),
    outOfScope: asText(outOfScope.body),
    present: {
      story: story.present,
      scenarios: scenarios.present,
      criteria: criteria.present,
      outOfScope: outOfScope.present
    }
  };
}
