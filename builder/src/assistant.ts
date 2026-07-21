// ✨ Assistant heuristic (spec 008, R1). Pure and local: no API keys, no
// network. From a plain-language project description it proposes a DRAFT —
// one idea note, 2-4 epics and 3-6 spec names grouped by detected domains —
// that the wizard previews (rename/remove/regenerate) BEFORE anything is
// written to disk. Accepting the draft applies a BoardPlan through the same
// store path as the template gallery (real POST /api/spec + PUT /api/board).
// Real intelligence is delegated to the user's agent over MCP: see
// buildOrchestratorPrompt in prompts.ts and guide 51.

import { IDEA_COLOR } from "./convert";
import { EPIC_NOTE, type BoardPlan, type BoardPlanEdge, type BoardPlanNote } from "./templates";

export type EpicKey = "core" | "experience" | "business" | "operations";

export interface DraftEpic {
  key: EpicKey;
  /** Short bilingual tag shown next to each spec row in the wizard. */
  label: string;
  /** Note text used when the draft lands on the board. */
  noteText: string;
}

export interface DraftSpec {
  key: string;
  /** Feature name sent to POST /api/spec — lowercase, accent-free (clean slugs). */
  name: string;
  epicKey: EpicKey;
}

export interface AssistantDraft {
  description: string;
  variant: number;
  ideaText: string;
  epics: DraftEpic[];
  specs: DraftSpec[];
}

const EPIC_DEFS: Record<EpicKey, { label: string; noteText: string }> = {
  core: {
    label: "Núcleo / Core",
    noteText: "📦 Núcleo / Core\nDatos y reglas de negocio / Data and business rules"
  },
  experience: {
    label: "Experiencia / Experience",
    noteText: "📦 Experiencia / Experience\nLo que ve el usuario / What the user sees"
  },
  business: {
    label: "Negocio / Business",
    noteText: "📦 Negocio / Business\nIngresos y pagos / Revenue and payments"
  },
  operations: {
    label: "Operaciones / Operations",
    noteText: "📦 Operaciones / Operations\nDetrás del mostrador / Behind the counter"
  }
};

interface DomainRule {
  key: string;
  epicKey: EpicKey;
  match: RegExp;
  /** Alternative accent-free names; the Regenerate variant rotates them. */
  names: string[];
}

// Order = priority when more than MAX_SPECS domains match.
const DOMAIN_RULES: DomainRule[] = [
  {
    key: "auth",
    epicKey: "core",
    match: /(\bauth\b|login|registro|inicio de sesi[oó]n|usuarios?\b|cuentas?\b|sign\s?-?up|sign\s?-?in|accounts?\b)/i,
    names: ["registro y login", "cuentas y autenticacion"]
  },
  {
    key: "catalog",
    epicKey: "experience",
    match: /(cat[aá]logo|productos?\b|tienda|inventario|e-?commerce|\bstore\b|\bshop\b|products?\b|catalog)/i,
    names: ["catalogo de productos", "productos e inventario"]
  },
  {
    key: "payments",
    epicKey: "business",
    match: /(pagos?\b|checkout|cobros?\b|suscripci|facturaci[oó]n|payments?\b|billing|subscriptions?\b|stripe)/i,
    names: ["checkout y pagos", "pagos y facturacion"]
  },
  {
    key: "orders",
    epicKey: "operations",
    match: /(pedidos?\b|env[ií]os?\b|orders?\b|shipping|deliver(?:y|ies)|entregas?\b)/i,
    names: ["gestion de pedidos", "pedidos y envios"]
  },
  {
    key: "admin",
    epicKey: "operations",
    match: /(panel|\badmin\b|administraci[oó]n|dashboard|back-?office)/i,
    names: ["panel de administracion", "backoffice de gestion"]
  },
  {
    key: "api",
    epicKey: "core",
    match: /(\bapis?\b|backend|integraci[oó]n(?:es)?|webhooks?\b|\brest\b|graphql)/i,
    names: ["api del servicio", "endpoints de api"]
  },
  {
    key: "notifications",
    epicKey: "operations",
    match: /(notificaci|avisos?\b|recordatorios?\b|notifications?\b|reminders?\b|emails?\b|correos?\b|\bpush\b)/i,
    names: ["notificaciones", "avisos y correos"]
  },
  {
    key: "profile",
    epicKey: "experience",
    match: /(perfil(?:es)?\b|profiles?\b|preferencias|ajustes|settings)/i,
    names: ["perfil de usuario", "perfil y preferencias"]
  },
  {
    key: "search",
    epicKey: "experience",
    match: /(b[uú]squeda|buscador|buscar|filtros?\b|search|filters?\b)/i,
    names: ["busqueda y filtros", "buscador del sitio"]
  }
];

/** Generic MVP fallback used when few (or no) domains are detected. */
const FALLBACK_SPECS: Array<Pick<DomainRule, "key" | "epicKey" | "names">> = [
  { key: "model", epicKey: "core", names: ["modelo de datos", "datos y persistencia"] },
  { key: "flow", epicKey: "experience", names: ["flujo principal", "recorrido basico"] },
  { key: "ui", epicKey: "experience", names: ["interfaz", "pantallas principales"] }
];

const MIN_SPECS = 3;
const MAX_SPECS = 6;
const IDEA_MAX_CHARS = 160;

function pickName(names: string[], variant: number): string {
  return names[variant % names.length];
}

/**
 * Deterministic draft for (description, variant): the same input always
 * proposes the same board, and "Regenerate" bumps the variant to rotate the
 * alternative spec names. Guarantees 3-6 specs and at least 2 epics.
 */
export function generateDraft(description: string, variant: number): AssistantDraft {
  const text = description.trim();
  const specs: DraftSpec[] = DOMAIN_RULES.filter((rule) => rule.match.test(text))
    .slice(0, MAX_SPECS)
    .map((rule) => ({ key: rule.key, name: pickName(rule.names, variant), epicKey: rule.epicKey }));

  // Pad with the generic MVP fallback up to the minimum...
  for (const fallback of FALLBACK_SPECS) {
    if (specs.length >= MIN_SPECS) break;
    if (specs.some((spec) => spec.key === fallback.key)) continue;
    specs.push({ key: fallback.key, name: pickName(fallback.names, variant), epicKey: fallback.epicKey });
  }
  // ...and make sure at least two epics exist (a one-column board reads flat).
  if (specs.length < MAX_SPECS && new Set(specs.map((spec) => spec.epicKey)).size < 2) {
    const other = FALLBACK_SPECS.find(
      (fallback) =>
        fallback.epicKey !== specs[0]?.epicKey && !specs.some((spec) => spec.key === fallback.key)
    );
    if (other) {
      specs.push({ key: other.key, name: pickName(other.names, variant), epicKey: other.epicKey });
    }
  }

  const epicKeys = [...new Set(specs.map((spec) => spec.epicKey))];
  const epics: DraftEpic[] = epicKeys.map((key) => ({
    key,
    label: EPIC_DEFS[key].label,
    noteText: EPIC_DEFS[key].noteText
  }));

  const ideaText =
    "💡 " + (text.length > IDEA_MAX_CHARS ? `${text.slice(0, IDEA_MAX_CHARS - 1)}…` : text || "Idea");

  return { description: text, variant, ideaText, epics, specs };
}

// --- Draft -> BoardPlan ----------------------------------------------------
// Layout mirrors the template gallery: epics on a top row, specs below in
// rows of four; the idea note sits above everything. Edges: idea → epic
// ("inspira / inspires") and epic → spec ("contiene / contains").

const SPEC_STEP_X = 380;
const SPEC_STEP_Y = 240;
const SPECS_PER_ROW = 4;
const EPIC_STEP_X = 420;

const INSPIRES = "inspira / inspires";
const CONTAINS = "contiene / contains";

const IDEA_NOTE = { width: 320, height: 150 };

/**
 * Build the plan actually applied to the board. `chosen` carries the wizard
 * edits (renamed/removed specs); epics left without a spec are dropped so no
 * orphan note lands on the canvas.
 */
export function draftToPlan(
  draft: AssistantDraft,
  chosen: Array<{ key: string; name: string }>
): BoardPlan {
  const byKey = new Map(draft.specs.map((spec) => [spec.key, spec]));
  const specs = chosen
    .map((edit) => {
      const original = byKey.get(edit.key);
      return original ? { ...original, name: edit.name } : undefined;
    })
    .filter((spec): spec is DraftSpec => spec !== undefined);

  const usedEpicKeys = new Set(specs.map((spec) => spec.epicKey));
  const epics = draft.epics.filter((epic) => usedEpicKeys.has(epic.key));

  const notes: BoardPlanNote[] = [
    { key: "idea", text: draft.ideaText, color: IDEA_COLOR, x: 40, y: -220, ...IDEA_NOTE },
    ...epics.map(
      (epic, i): BoardPlanNote => ({
        key: `epic-${epic.key}`,
        text: epic.noteText,
        color: EPIC_NOTE.color,
        x: 60 + i * EPIC_STEP_X,
        y: 0,
        width: EPIC_NOTE.width,
        height: EPIC_NOTE.height
      })
    )
  ];

  const planSpecs = specs.map((spec, i) => ({
    key: spec.key,
    name: spec.name,
    x: (i % SPECS_PER_ROW) * SPEC_STEP_X,
    y: 220 + Math.floor(i / SPECS_PER_ROW) * SPEC_STEP_Y
  }));

  const edges: BoardPlanEdge[] = [
    ...epics.map((epic): BoardPlanEdge => ({ from: "idea", to: `epic-${epic.key}`, label: INSPIRES })),
    ...specs.map((spec): BoardPlanEdge => ({ from: `epic-${spec.epicKey}`, to: spec.key, label: CONTAINS }))
  ];

  return { id: "assistant", notes, specs: planSpecs, edges };
}
