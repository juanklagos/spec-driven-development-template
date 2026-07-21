// GET /dashboard: executive, server-rendered snapshot of the SDD workspace
// (specs, statuses, gate state, task progress). Read-only; the interactive
// canvas lives in /builder.
//
// Self-contained by design: no CDN, no build step, no runtime deps. Every
// shadcn/builder token from builder/src/styles.css is hand-inlined below as
// literal CSS, light/dark strictly via prefers-color-scheme (same rule as the
// builder, which has no theme toggle). One language at a time: the ?lang
// switch mirrors builder/src/i18n.ts and shares its localStorage key.

import {
  getBoardView,
  getGateSummary,
  isApprovedStatus,
  type SpecTone,
  type BoardSpecCard,
  type DependencyWarning,
  type GateSummary,
  type ValidationMessage
} from "@juanklagos/sdd-core";

export type DashboardLang = "es" | "en";

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/* ------------------------------------------------------------------ i18n -- */
// Keys that exist in builder/src/i18n.ts are copied verbatim (same key, same
// string) so /dashboard and /builder never disagree on a word. dash.* keys are
// dashboard-only. ES is the source of truth for the key set; EN must implement
// every one of them or `tsc` fails.

const ES = {
  // Verbatim builder keys
  "topbar.workspace": "Workspace",
  "topbar.lang": "Idioma",
  "topbar.gate.open": "Gate abierto",
  "topbar.gate.closed": "Gate cerrado",
  "topbar.gate.stats": "{errors} errores · {warnings} avisos · {approved}/{total} specs aprobadas",
  "status.approved": "Aprobada",
  "status.pending": "Pendiente",
  "status.done": "Hecha",
  "status.tasks": "{done}/{total} tareas",
  "status.open": "Abrir →",
  "status.gateErrors": "Errores del gate:",
  "status.depWarn": "Dependencias sin aprobar:",
  "sheet.tasks": "Tareas",
  "sheet.noTasks": "Sin tareas",
  "sheet.hardStop": "No hay código sin spec aprobada y plan consistente — aprueba la spec primero.",
  "kanban.openSpec": "Abrir spec",

  // Dashboard chrome
  "dash.title": "Panel SDD",
  "dash.subtitle": "Resumen ejecutivo del workspace",
  "dash.openBuilder": "Abrir el builder",
  "dash.reason.open": "Implementación permitida: las specs aprobadas y sus planes son consistentes.",
  "dash.reason.closed": "Implementación bloqueada: refina la spec y el plan antes de escribir código.",
  "dash.stats.section": "Resumen",
  "dash.stats.approved": "Specs aprobadas",
  "dash.stats.pending": "Specs pendientes",
  "dash.stats.done": "Specs hechas",
  "dash.stats.tasks": "Tareas completadas",
  "dash.stats.errors": "Errores",
  "dash.stats.warnings": "Avisos",
  "dash.stats.rule": "Contadas con la misma regla que el builder (aprobada/approved en spec.md).",
  "dash.stats.gateRule": "Gate + validación estructural del proyecto.",
  "dash.table.title": "Specs del workspace",
  "dash.table.spec": "Spec",
  "dash.table.progress": "Progreso",
  "dash.table.actions": "Acciones",
  "dash.rawStatus": "Estado en spec.md",
  "dash.openSpecAria": "Abrir el builder para la spec {id}",
  "dash.empty": "No hay specs en este workspace todavía.",
  "dash.empty.hint": "Crea la primera con /sdd:spec o desde el builder.",
  "dash.issues.errors": "{count} error(es)",
  "dash.issues.more": "y {count} más…",
  "dash.dep.badge": "⚠ dep",
  "dash.dep.line": "{dependent} está aprobada pero depende de {dependency}, que aún no lo está.",
  "dash.dep.label": "etiqueta: {label}",
  "dash.error.title": "No se pudo leer el workspace SDD",
  "dash.error.hint":
    "Apunta SDD_PROJECT_ROOT a un proyecto que contenga specs/ (o un sidecar spec/) y recarga esta página.",
  "dash.error.diagnostics": "Detalle técnico"
} as const;

/** Every translatable string on the page; a typo here is a compile error. */
type Key = keyof typeof ES;

const EN: Record<Key, string> = {
  // Verbatim builder keys
  "topbar.workspace": "Workspace",
  "topbar.lang": "Language",
  "topbar.gate.open": "Gate open",
  "topbar.gate.closed": "Gate closed",
  "topbar.gate.stats": "{errors} errors · {warnings} warnings · {approved}/{total} specs approved",
  "status.approved": "Approved",
  "status.pending": "Pending",
  "status.done": "Done",
  "status.tasks": "{done}/{total} tasks",
  "status.open": "Open →",
  "status.gateErrors": "Gate errors:",
  "status.depWarn": "Unapproved dependencies:",
  "sheet.tasks": "Tasks",
  "sheet.noTasks": "No tasks",
  "sheet.hardStop": "No code before approved spec and consistent plan — approve the spec first.",
  "kanban.openSpec": "Open spec",

  // Dashboard chrome
  "dash.title": "SDD Dashboard",
  "dash.subtitle": "Executive overview of the workspace",
  "dash.openBuilder": "Open builder",
  "dash.reason.open": "Implementation allowed: approved specs and their plans are consistent.",
  "dash.reason.closed": "Implementation blocked: refine the spec and the plan before writing code.",
  "dash.stats.section": "Summary",
  "dash.stats.approved": "Approved specs",
  "dash.stats.pending": "Pending specs",
  "dash.stats.done": "Done specs",
  "dash.stats.tasks": "Completed tasks",
  "dash.stats.errors": "Errors",
  "dash.stats.warnings": "Warnings",
  "dash.stats.rule": "Counted with the same rule as the builder (approved/aprobada in spec.md).",
  "dash.stats.gateRule": "Gate + structural project validation.",
  "dash.table.title": "Workspace specs",
  "dash.table.spec": "Spec",
  "dash.table.progress": "Progress",
  "dash.table.actions": "Actions",
  "dash.rawStatus": "Status in spec.md",
  "dash.openSpecAria": "Open the builder for spec {id}",
  "dash.empty": "No specs in this workspace yet.",
  "dash.empty.hint": "Create the first one with /sdd:spec or from the builder.",
  "dash.issues.errors": "{count} error(s)",
  "dash.issues.more": "and {count} more…",
  "dash.dep.badge": "⚠ dep",
  "dash.dep.line": "{dependent} is approved but depends on {dependency}, which is not approved yet.",
  "dash.dep.label": "label: {label}",
  "dash.error.title": "Could not read the SDD workspace",
  "dash.error.hint":
    "Point SDD_PROJECT_ROOT at a project that contains specs/ (or a spec/ sidecar) and reload this page.",
  "dash.error.diagnostics": "Technical detail"
};

const DICT: Record<DashboardLang, Record<Key, string>> = { es: ES, en: EN };

type Translate = (key: Key, vars?: Record<string, string | number>) => string;

/** Flat dictionary + {var} placeholders, same contract as builder/src/i18n.ts. */
const makeT =
  (lang: DashboardLang): Translate =>
  (key, vars) => {
    const raw = DICT[lang][key];
    if (!vars) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
    );
  };

/**
 * Resolves the page language: an explicit `?lang=es|en` wins, then the
 * Accept-Language header, then Spanish (the template's primary language).
 * Exported so the HTTP route stops guessing.
 */
export function resolveDashboardLang(url?: URL | null, acceptLanguage?: string | null): DashboardLang {
  const requested = url?.searchParams.get("lang")?.toLowerCase();
  if (requested === "es" || requested === "en") return requested;
  return /^\s*en\b/i.test(acceptLanguage ?? "") ? "en" : "es";
}

/* ------------------------------------------------------------ view model -- */

// The tone is computed once in sdd-core (specTone) and travels with the
// board view, so canvas, kanban and this dashboard can never disagree.
type Tone = SpecTone;

const toneKey: Record<Tone, Key> = {
  ok: "status.approved",
  pending: "status.pending",
  done: "status.done"
};

/** "007-i18n-and-shadcn" -> { num: "007", name: "i18n and shadcn" } (raw, like SpecNode). */
const splitSpecId = (id: string): { num: string; name: string } => {
  const match = id.match(/^(\d{3})-(.+)$/);
  return match ? { num: match[1], name: match[2].replace(/-/g, " ") } : { num: "•", name: id };
};

const pct = (done: number, total: number): number =>
  total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;

const depVars = (warning: DependencyWarning): Record<string, string> => ({
  dependent: warning.dependent,
  dependency: warning.dependency,
  label: warning.label
});

/** Tooltip body: localized heading + one bullet per line. */
const tooltip = (heading: string, lines: string[]): string =>
  escapeHtml([heading, ...lines.map((line) => `• ${line}`)].join("\n"));

/**
 * getGateSummary already partitions gate.messages + validation.messages into
 * specIssues/generalIssues, so re-merging gate.messages would only manufacture
 * duplicates. Read the partition, never the raw lists.
 */
const errorMessages = (gate: GateSummary): ValidationMessage[] =>
  [...gate.generalIssues, ...Object.values(gate.specIssues).flat()].filter(
    (issue) => issue.level === "error"
  );

/* ------------------------------------------------------------------- CSS -- */
// Tokens verbatim from builder/src/styles.css (the Tailwind @theme block
// expanded to plain custom properties).
const STYLES = `
:root {
  color-scheme: light dark;
  --radius: 0.625rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --background: oklch(0.977 0.003 247.9);
  --foreground: oklch(0.235 0.02 257.3);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.235 0.02 257.3);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.235 0.02 257.3);
  --primary: oklch(0.627 0.17 149.2);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.955 0.006 255.5);
  --secondary-foreground: oklch(0.235 0.02 257.3);
  --muted: oklch(0.945 0.007 255.5);
  --muted-foreground: oklch(0.5 0.025 257.3);
  --accent: oklch(0.955 0.006 255.5);
  --accent-foreground: oklch(0.235 0.02 257.3);
  --destructive: oklch(0.577 0.245 27.3);
  --destructive-foreground: oklch(0.985 0 0);
  --border: oklch(0.906 0.01 255.5);
  --input: oklch(0.906 0.01 255.5);
  --ring: oklch(0.627 0.17 149.2);
  --primary-soft: oklch(0.627 0.17 149.2 / 14%);
  --amber: oklch(0.681 0.143 75.8);
  --amber-soft: oklch(0.681 0.143 75.8 / 15%);
  --blue: oklch(0.546 0.215 262.9);
  --blue-soft: oklch(0.546 0.215 262.9 / 13%);
  --danger-soft: oklch(0.577 0.245 27.3 / 12%);
  --gray-edge: oklch(0.551 0.023 264.4);
  --shadow-card: 0 1px 2px rgb(15 23 42 / 0.08), 0 4px 14px rgb(15 23 42 / 0.08);
  --shadow-strong: 0 8px 30px rgb(15 23 42 / 0.22);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.172 0.014 261.7);
    --foreground: oklch(0.925 0.008 255.5);
    --card: oklch(0.225 0.016 261.7);
    --card-foreground: oklch(0.925 0.008 255.5);
    --popover: oklch(0.225 0.016 261.7);
    --popover-foreground: oklch(0.925 0.008 255.5);
    --primary: oklch(0.723 0.192 149.6);
    --primary-foreground: oklch(0.205 0.03 150);
    --secondary: oklch(0.28 0.02 260);
    --secondary-foreground: oklch(0.925 0.008 255.5);
    --muted: oklch(0.268 0.018 260);
    --muted-foreground: oklch(0.69 0.02 256.8);
    --accent: oklch(0.28 0.02 260);
    --accent-foreground: oklch(0.925 0.008 255.5);
    --destructive: oklch(0.704 0.191 22.2);
    --destructive-foreground: oklch(0.985 0 0);
    --border: oklch(0.32 0.02 260);
    --input: oklch(0.34 0.02 260);
    --ring: oklch(0.723 0.192 149.6);
    --primary-soft: oklch(0.723 0.192 149.6 / 16%);
    --amber: oklch(0.795 0.161 86.1);
    --amber-soft: oklch(0.795 0.161 86.1 / 16%);
    --blue: oklch(0.707 0.143 254.6);
    --blue-soft: oklch(0.707 0.143 254.6 / 15%);
    --danger-soft: oklch(0.704 0.191 22.2 / 14%);
    --gray-edge: oklch(0.707 0.022 261.3);
    --shadow-card: 0 1px 2px rgb(0 0 0 / 0.4), 0 4px 14px rgb(0 0 0 / 0.35);
    --shadow-strong: 0 8px 30px rgb(0 0 0 / 0.55);
  }
}

*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--background);
  color: var(--foreground);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.45;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

p, h1, h2, h3, ul, ol { margin: 0; }
ul { padding: 0; list-style: none; }
a { color: inherit; }

code {
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.86em;
  background: var(--muted);
  border-radius: 4px;
  padding: 0.05em 0.35em;
}

:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; border-radius: var(--radius-sm); }

.visually-hidden {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

.shell { max-width: 74rem; margin: 0 auto; padding: 2.25rem 1.25rem 3rem; }

/* ---------- top bar ---------- */
.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1rem;
  padding-bottom: 1.1rem;
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 0.6rem; min-width: 0; }
.brand-mark {
  width: 2.25rem; height: 2.25rem; flex: none;
  display: grid; place-items: center;
  font-size: 1.15rem;
  border-radius: var(--radius-lg);
  background: var(--primary-soft);
  border: 1px solid var(--border);
}
.brand h1 { font-size: 1.05rem; font-weight: 700; letter-spacing: -0.01em; }
.brand p { font-size: 0.78rem; color: var(--muted-foreground); }
.topbar-actions { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; flex-wrap: wrap; }

.workspace-chip {
  display: inline-flex; align-items: center; gap: 0.45rem;
  border: 1px solid var(--border);
  background: var(--card);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  max-width: 100%;
  min-width: 0;
  box-shadow: var(--shadow-card);
}
.workspace-chip .label {
  font-size: 0.64rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: var(--muted-foreground); flex: none;
}
.workspace {
  max-width: 32ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: left;
  color: var(--muted-foreground);
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  font-size: 0.76rem;
}

.langs {
  display: inline-flex; gap: 2px; padding: 2px;
  background: var(--card); border: 1px solid var(--border); border-radius: 999px;
}
.langs a {
  padding: 0.2rem 0.6rem; border-radius: 999px; text-decoration: none;
  font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em;
  color: var(--muted-foreground);
}
.langs a:hover { color: var(--foreground); }
.langs a[aria-current="page"] { background: var(--primary-soft); color: var(--primary); }

.btn {
  display: inline-flex; align-items: center; gap: 0.4rem;
  height: 2rem; padding: 0 0.9rem;
  border: 1px solid transparent; border-radius: var(--radius-md);
  font-size: 0.78rem; font-weight: 600;
  text-decoration: none; white-space: nowrap;
}
.btn-primary { background: var(--primary); color: var(--primary-foreground); box-shadow: var(--shadow-card); }
.btn-primary:hover { filter: brightness(1.06); }

/* ---------- sections ---------- */
.section { margin-top: 2.75rem; }
.section-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 1rem; margin-bottom: 0.85rem; flex-wrap: wrap;
}
.section-title {
  font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.16em; color: var(--muted-foreground);
}
.section-meta { font-size: 0.72rem; color: var(--muted-foreground); font-variant-numeric: tabular-nums; }

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  padding: 0.9rem 1rem;
}

/* ---------- gate band ---------- */
.gate {
  position: relative;
  overflow: hidden;
  padding: 1.15rem 1.25rem 1.15rem 1.5rem;
  background-image: linear-gradient(100deg, var(--primary-soft), transparent 62%);
}
.gate.closed { background-image: linear-gradient(100deg, var(--danger-soft), transparent 62%); }
.gate::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 4px; background: var(--primary); }
.gate.closed::before { background: var(--destructive); }
.gate-title { font-size: 1.3rem; font-weight: 700; letter-spacing: -0.015em; }
.gate-reason { margin-top: 0.4rem; color: var(--muted-foreground); max-width: 64ch; }
.gate-stats {
  margin-top: 0.55rem; font-size: 0.8rem;
  color: var(--muted-foreground); font-variant-numeric: tabular-nums;
}

/* ---------- hairline stat grid ---------- */
/* Six tiles, always in a grid that divides evenly (6 / 3 / 2): auto-fit would
   orphan a tile and expose the hairline background as an empty slab. */
.stats {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.stat { background: var(--card); padding: 1rem 1.1rem; min-width: 0; }
.stat-value {
  font-size: 1.6rem; font-weight: 700; letter-spacing: -0.03em;
  line-height: 1.1; font-variant-numeric: tabular-nums;
}
.stat-value .stat-total { font-size: 0.95rem; font-weight: 600; color: var(--muted-foreground); }
.stat-value.primary { color: var(--primary); }
.stat-value.amber { color: var(--amber); }
.stat-value.danger { color: var(--destructive); }
.stat-label {
  margin-top: 0.3rem; font-size: 0.64rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.12em; color: var(--muted-foreground);
  overflow-wrap: anywhere;
}

/* ---------- spec list ---------- */
.speclist {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.speclist.empty { padding: 2.25rem 1.25rem; text-align: center; color: var(--muted-foreground); }
.speclist.empty strong { display: block; color: var(--foreground); margin-bottom: 0.25rem; }

.specrow {
  display: grid;
  grid-template-columns: minmax(0, 32rem) minmax(0, 1fr) 4.5rem;
  align-items: center;
  gap: 0.8rem 1.25rem;
  padding: 1rem 1.25rem;
}
.specrow-head {
  padding-top: 0.6rem; padding-bottom: 0.6rem;
  background: var(--muted);
  border-bottom: 1px solid var(--border);
  font-size: 0.64rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--muted-foreground);
}
/* Transparent 1px frame on every row so the hover ring never shifts layout. */
.specrow-item { border: 1px solid transparent; transition: border-color 0.12s ease, box-shadow 0.12s ease; }
.specrow-item + .specrow-item { border-top-color: var(--border); }
.specrow-item:hover {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft), var(--shadow-card);
  border-radius: var(--radius-lg);
}

.spec-id { min-width: 0; }
.spec-top { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.spec-num { font-size: 0.72rem; font-weight: 700; color: var(--muted-foreground); flex: none; }
.spec-badges { display: inline-flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; justify-content: flex-end; }
.spec-name {
  margin-top: 0.35rem;
  font-size: 0.95rem; font-weight: 600; line-height: 1.3;
  letter-spacing: -0.012em; overflow-wrap: anywhere;
}

.prog { min-width: 0; }
.progress-track { height: 7px; border-radius: 999px; background: var(--muted); overflow: hidden; }
.progress-fill { height: 100%; border-radius: 999px; background: var(--amber); transition: width 0.25s ease; }
.progress-fill.ok, .progress-fill.done { background: var(--primary); }
.prog-label {
  margin-top: 0.4rem; font-size: 0.72rem;
  color: var(--muted-foreground); font-variant-numeric: tabular-nums;
}

.rowlink {
  justify-self: end;
  font-size: 0.78rem; font-weight: 700;
  color: var(--primary); text-decoration: none; white-space: nowrap;
}
.rowlink:hover { text-decoration: underline; text-underline-offset: 3px; }

/* ---------- badges (verbatim from the builder) ---------- */
.badge-tone {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.1rem 0.55rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700; white-space: nowrap;
}
.badge-tone.ok { background: var(--primary-soft); color: var(--primary); }
.badge-tone.pending { background: var(--amber-soft); color: var(--amber); }
.badge-tone.done { background: var(--primary-soft); color: var(--primary); outline: 1px solid var(--primary); }
.badge-tone.error { background: var(--danger-soft); color: var(--destructive); outline: 1px solid var(--destructive); cursor: help; }
.badge-tone.warn { background: var(--amber-soft); color: var(--amber); outline: 1px solid var(--amber); cursor: help; }

/* ---------- issue panels ---------- */
.panel { padding: 1rem 1.15rem; }
.panel.danger-edge { border-color: var(--destructive); }
.panel.amber-edge { border-color: var(--amber); }
.issue-list { display: grid; gap: 0.55rem; }
.issue-list li { display: flex; gap: 0.55rem; align-items: flex-start; font-size: 0.82rem; overflow-wrap: anywhere; }
.issue-mark { flex: none; margin-top: 0.05rem; }
.issue-mark.error { color: var(--destructive); }
.issue-mark.warn { color: var(--amber); }
.issue-meta { color: var(--muted-foreground); font-size: 0.72rem; }
.count-pill {
  font-size: 0.7rem; font-weight: 700; color: var(--muted-foreground);
  background: var(--muted); border-radius: 999px; padding: 0.1rem 0.55rem;
  font-variant-numeric: tabular-nums;
}

/* ---------- error state ---------- */
.state { padding: 1.4rem 1.35rem; border-left: 4px solid var(--destructive); }
.state h2 { font-size: 1.15rem; font-weight: 700; letter-spacing: -0.015em; }
.state p { margin-top: 0.6rem; color: var(--muted-foreground); max-width: 64ch; }
.state details { margin-top: 0.9rem; font-size: 0.8rem; color: var(--muted-foreground); }
.state details summary { cursor: pointer; font-weight: 600; }
.state details pre {
  margin: 0.5rem 0 0; padding: 0.6rem 0.7rem;
  background: var(--muted); border-radius: var(--radius-md);
  white-space: pre-wrap; overflow-wrap: anywhere; overflow-x: auto;
  font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
}

/* ---------- footer ---------- */
footer {
  margin-top: 3rem; padding-top: 1.15rem;
  border-top: 1px solid var(--border);
  display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem;
  justify-content: space-between; align-items: center;
  font-size: 0.76rem; color: var(--muted-foreground);
}
footer .rule { display: inline-flex; align-items: flex-start; gap: 0.4rem; overflow-wrap: anywhere; }
footer a { color: var(--muted-foreground); text-decoration: none; }
footer a:hover { color: var(--foreground); text-decoration: underline; text-underline-offset: 3px; }

@media (max-width: 1000px) {
  .stats { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .specrow { grid-template-columns: minmax(0, 1fr); gap: 0.8rem; }
  .specrow-head { display: none; }
  .rowlink { justify-self: start; }
}

@media (max-width: 34rem) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 30rem) {
  .shell { padding: 1.5rem 0.9rem 2.5rem; }
  .section { margin-top: 2rem; }
  .topbar-actions { margin-left: 0; width: 100%; }
  .gate { padding: 1rem 1rem 1rem 1.25rem; }
  .gate-title { font-size: 1.1rem; }
  .stat { padding: 0.85rem 0.9rem; }
  .stat-value { font-size: 1.35rem; }
  .specrow { padding: 0.95rem 1rem; }
  .workspace { max-width: 20ch; }
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; }
}
`;

// Keeps /dashboard and /builder on the same language: an explicit ?lang choice
// is persisted under the key the builder reads (builder/src/i18n.ts), and a
// stored choice is honored when the URL says nothing. Guarded so it can never
// loop (it only redirects when the URL carries no lang at all).
const LANG_SCRIPT = `
(function () {
  var KEY = "sdd-builder-lang";
  try {
    var params = new URLSearchParams(location.search);
    var urlLang = params.get("lang");
    if (urlLang === "es" || urlLang === "en") { localStorage.setItem(KEY, urlLang); return; }
    var stored = localStorage.getItem(KEY);
    if ((stored === "es" || stored === "en") && stored !== document.documentElement.lang) {
      params.set("lang", stored);
      location.replace(location.pathname + "?" + params.toString());
    }
  } catch (e) { /* private mode: keep the server-rendered language */ }
})();
`;

/* ---------------------------------------------------------------- layout -- */

const page = (lang: DashboardLang, t: Translate, projectRoot: string, main: string): string => {
  const langLink = (code: DashboardLang): string =>
    `<a href="?lang=${code}"${code === lang ? ' aria-current="page"' : ""} hreflang="${code}">${code.toUpperCase()}</a>`;

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>🌱 ${escapeHtml(t("dash.title"))}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="shell">
  <header class="topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">🌱</span>
      <div>
        <h1>${escapeHtml(t("dash.title"))}</h1>
        <p>${escapeHtml(t("dash.subtitle"))}</p>
      </div>
    </div>
    <div class="topbar-actions">
      <span class="workspace-chip" title="${escapeHtml(projectRoot)}">
        <span class="label">${escapeHtml(t("topbar.workspace"))}</span>
        <span class="workspace">&#8206;${escapeHtml(projectRoot)}&#8206;</span>
      </span>
      <nav class="langs" aria-label="${escapeHtml(t("topbar.lang"))}">${langLink("es")}${langLink("en")}</nav>
      <a class="btn btn-primary" href="/builder">${escapeHtml(t("dash.openBuilder"))} →</a>
    </div>
  </header>
  <main>
${main}
  </main>
  <footer>
    <span class="rule"><span aria-hidden="true">⛔</span> ${escapeHtml(t("sheet.hardStop"))}</span>
    <a href="https://github.com/juanklagos/spec-driven-development-template" rel="noreferrer noopener">spec-driven-development-template</a>
  </footer>
</div>
<script>${LANG_SCRIPT}</script>
</body>
</html>`;
};

/* ------------------------------------------------------------- renderers -- */

const gateSection = (t: Translate, gate: GateSummary): string => `
    <section class="section" style="margin-top:1.5rem">
      <div class="card gate ${gate.ok ? "open" : "closed"}">
        <h2 class="gate-title">${gate.ok ? "🟢" : "🔴"} ${escapeHtml(
          t(gate.ok ? "topbar.gate.open" : "topbar.gate.closed")
        )}</h2>
        <p class="gate-reason">${escapeHtml(t(gate.ok ? "dash.reason.open" : "dash.reason.closed"))}</p>
        <p class="gate-stats">${escapeHtml(
          t("topbar.gate.stats", {
            errors: gate.errors,
            warnings: gate.warnings,
            approved: gate.approvedSpecs,
            total: gate.totalSpecs
          })
        )}</p>
      </div>
    </section>`;

const statsSection = (t: Translate, gate: GateSummary, specs: BoardSpecCard[]): string => {
  // One approval rule for every locally-computed tile: core's isApprovedStatus,
  // the same regex the builder cards use. The gate banner above prints
  // gate.approvedSpecs, which checkGate derives from an exact string match — the
  // tiles say which rule they follow in their tooltip.
  const approved = specs.filter((spec) => isApprovedStatus(spec.status)).length;
  const pending = specs.length - approved;
  const done = specs.filter((spec) => spec.tone === "done").length;
  const tasksDone = specs.reduce((sum, spec) => sum + spec.tasks.done, 0);
  const tasksTotal = specs.reduce((sum, spec) => sum + spec.tasks.total, 0);

  const stat = (value: string, label: Key, tone: "" | "primary" | "amber" | "danger", hint: Key): string => `
        <div class="stat" title="${escapeHtml(t(hint))}">
          <p class="stat-value${tone ? ` ${tone}` : ""}">${value}</p>
          <p class="stat-label">${escapeHtml(t(label))}</p>
        </div>`;

  return `
    <section class="section" aria-labelledby="stats-h">
      <div class="section-head">
        <h2 class="section-title" id="stats-h">${escapeHtml(t("dash.stats.section"))}</h2>
        <p class="section-meta">${escapeHtml(
          t("status.tasks", { done: tasksDone, total: tasksTotal })
        )}</p>
      </div>
      <div class="stats">${stat(
        String(approved),
        "dash.stats.approved",
        approved > 0 ? "primary" : "",
        "dash.stats.rule"
      )}${stat(String(pending), "dash.stats.pending", pending > 0 ? "amber" : "", "dash.stats.rule")}${stat(
        String(done),
        "dash.stats.done",
        done > 0 ? "primary" : "",
        "dash.stats.rule"
      )}${stat(
        `${tasksDone}<span class="stat-total"> / ${tasksTotal}</span>`,
        "dash.stats.tasks",
        "",
        "dash.stats.rule"
      )}${stat(
        String(gate.errors),
        "dash.stats.errors",
        gate.errors > 0 ? "danger" : "",
        "dash.stats.gateRule"
      )}${stat(
        String(gate.warnings),
        "dash.stats.warnings",
        gate.warnings > 0 ? "amber" : "",
        "dash.stats.gateRule"
      )}
      </div>
    </section>`;
};

const specRow = (t: Translate, spec: BoardSpecCard, gate: GateSummary): string => {
  const tone = spec.tone;
  const { num, name } = splitSpecId(spec.id);
  const { done, total } = spec.tasks;
  const percent = pct(done, total);
  const tasksText = total > 0 ? t("status.tasks", { done, total }) : t("sheet.noTasks");

  const specErrors = (gate.specIssues[spec.id] ?? []).filter((issue) => issue.level === "error");
  const depWarnings = gate.dependencyWarnings.filter((warning) => warning.dependent === spec.id);

  const errorBadge = specErrors.length
    ? `<span class="badge-tone error" title="${tooltip(
        t("status.gateErrors"),
        specErrors.map((issue) => issue.message)
      )}">⚠ ${specErrors.length}</span>`
    : "";
  const depBadge = depWarnings.length
    ? `<span class="badge-tone warn" title="${tooltip(
        t("status.depWarn"),
        depWarnings.map((warning) => t("dash.dep.line", depVars(warning)))
      )}">${escapeHtml(t("dash.dep.badge"))}</span>`
    : "";

  return `
        <li class="specrow specrow-item">
          <div class="spec-id">
            <div class="spec-top">
              <span class="spec-num">📋 ${escapeHtml(num)}</span>
              <span class="spec-badges">${errorBadge}${depBadge}<span class="badge-tone ${tone}" title="${escapeHtml(
                `${t("dash.rawStatus")}: ${spec.status || "—"}`
              )}">${escapeHtml(t(toneKey[tone]))}</span></span>
            </div>
            <h3 class="spec-name">${escapeHtml(name)}</h3>
          </div>
          <div class="prog">
            <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-label="${escapeHtml(
              tasksText
            )}">
              <div class="progress-fill ${tone}" style="width:${percent}%"></div>
            </div>
            <p class="prog-label">${escapeHtml(tasksText)}${total > 0 ? ` · ${percent}%` : ""}</p>
          </div>
          <a class="rowlink" href="/builder" title="${escapeHtml(t("kanban.openSpec"))}" aria-label="${escapeHtml(
            t("dash.openSpecAria", { id: spec.id })
          )}">${escapeHtml(t("status.open"))}</a>
        </li>`;
};

const specsSection = (t: Translate, specs: BoardSpecCard[], gate: GateSummary): string => {
  const body = specs.length
    ? `<ul class="speclist">
        <li class="specrow specrow-head">
          <span>${escapeHtml(t("dash.table.spec"))}</span>
          <span>${escapeHtml(t("dash.table.progress"))}</span>
          <span class="visually-hidden">${escapeHtml(t("dash.table.actions"))}</span>
        </li>${specs.map((spec) => specRow(t, spec, gate)).join("")}
      </ul>`
    : `<div class="speclist empty">
        <strong>${escapeHtml(t("dash.empty"))}</strong>${escapeHtml(t("dash.empty.hint"))}
      </div>`;

  return `
    <section class="section" aria-labelledby="specs-h">
      <div class="section-head">
        <h2 class="section-title" id="specs-h">${escapeHtml(t("dash.table.title"))}</h2>
        <span class="count-pill">${specs.length}</span>
      </div>
      ${body}
    </section>`;
};

const MAX_LISTED_ERRORS = 12;

const errorsSection = (t: Translate, gate: GateSummary): string => {
  const errors = errorMessages(gate);
  if (errors.length === 0) return "";
  const shown = errors.slice(0, MAX_LISTED_ERRORS);
  const rest = errors.length - shown.length;

  // Validator messages are engine diagnostics produced by core in English; they
  // are rendered verbatim as data under a localized heading.
  const items = shown
    .map(
      (issue) => `
          <li>
            <span class="issue-mark error" aria-hidden="true">✕</span>
            <span>${escapeHtml(issue.message)}
              <span class="issue-meta">(${escapeHtml(issue.code)}${
                issue.path ? ` · ${escapeHtml(issue.path)}` : ""
              })</span>
            </span>
          </li>`
    )
    .join("");
  const more = rest > 0
    ? `
          <li><span class="issue-mark error" aria-hidden="true">…</span><span class="issue-meta">${escapeHtml(
            t("dash.issues.more", { count: rest })
          )}</span></li>`
    : "";

  return `
    <section class="section" aria-labelledby="errors-h">
      <div class="section-head">
        <h2 class="section-title" id="errors-h">${escapeHtml(t("status.gateErrors"))}</h2>
        <span class="count-pill">${errors.length}</span>
      </div>
      <ul class="card panel danger-edge issue-list">${items}${more}
      </ul>
    </section>`;
};

const dependenciesSection = (t: Translate, warnings: DependencyWarning[]): string => {
  if (warnings.length === 0) return "";
  // core's DependencyWarning.message is bilingual by design; this page is
  // single-language, so the sentence is rebuilt from the structured fields.
  const items = warnings
    .map(
      (warning) => `
          <li>
            <span class="issue-mark warn" aria-hidden="true">⚠</span>
            <span>${escapeHtml(t("dash.dep.line", depVars(warning)))}
              <span class="issue-meta">${escapeHtml(t("dash.dep.label", { label: warning.label }))}</span>
            </span>
          </li>`
    )
    .join("");

  return `
    <section class="section" aria-labelledby="deps-h">
      <div class="section-head">
        <h2 class="section-title" id="deps-h">${escapeHtml(t("status.depWarn"))}</h2>
        <span class="count-pill">${warnings.length}</span>
      </div>
      <ul class="card panel amber-edge issue-list">${items}
      </ul>
    </section>`;
};

const errorState = (t: Translate, detail: string): string => `
    <section class="section" style="margin-top:1.5rem">
      <div class="card state">
        <h2>🚧 ${escapeHtml(t("dash.error.title"))}</h2>
        <p>${escapeHtml(t("dash.error.hint"))}</p>
        <details>
          <summary>${escapeHtml(t("dash.error.diagnostics"))}</summary>
          <pre>${escapeHtml(detail)}</pre>
        </details>
      </div>
    </section>`;

/* -------------------------------------------------------------- exported -- */

/**
 * Renders the read-only SDD dashboard fully in `opts.lang`.
 * Never throws for a missing or unreadable workspace: it renders a localized
 * card inside the normal page shell (no stack trace reaches the browser).
 */
export async function renderDashboard(
  projectRoot: string,
  opts: { lang: DashboardLang } = { lang: "es" }
): Promise<string> {
  const lang: DashboardLang = opts?.lang === "en" ? "en" : "es";
  const t = makeT(lang);

  try {
    // getGateSummary already bundles checkGate + validateProject +
    // getDependencyWarnings, so one call covers the whole semaphore.
    const [board, gate] = await Promise.all([getBoardView(projectRoot), getGateSummary(projectRoot)]);
    const specs = [...board.specs].sort((a, b) => a.id.localeCompare(b.id));

    return page(
      lang,
      t,
      projectRoot,
      [
        gateSection(t, gate),
        statsSection(t, gate, specs),
        specsSection(t, specs, gate),
        errorsSection(t, gate),
        dependenciesSection(t, gate.dependencyWarnings)
      ]
        .filter(Boolean)
        .join("\n")
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return page(lang, t, projectRoot, errorState(t, detail));
  }
}
