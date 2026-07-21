// Copy-first prompts for the SDD Builder (spec 008). No deep links into any
// particular agent app on purpose — a copied prompt works with every agent
// (Claude Code, Codex, Cursor, ...). Since spec 010 (R1) each prompt is
// emitted in ONE language — the UI language — instead of the old ES+EN block.
//   - buildOrchestratorPrompt (R1): tells an MCP-connected agent to populate
//     the board with real intelligence (sdd_board_* + sdd_update_spec_sections).
//     Also documented in guide 51 (docs/en|es/51-*).
//   - buildImplementPrompt (R2): the exact implementation kickoff for an
//     approved spec — gate first, consent, hard stop.

import type { Lang } from "./i18n";

export interface ImplementPromptInput {
  projectRoot: string;
  specId: string;
  /** Absolute spec directory as reported by the API (works for sidecars too). */
  specDir: string;
}

export function buildOrchestratorPrompt(description: string, projectRoot: string, lang: Lang): string {
  if (lang === "es") {
    const idea = description.trim() || "[describe tu proyecto]";
    const root = projectRoot || "[ruta del workspace]";
    return [
      `Eres mi agente SDD conectado al MCP \`sdd-mcp\`. Mi proyecto: "${idea}".`,
      "Objetivo: puebla el SDD Builder board como el asistente ✨, pero con inteligencia real.",
      `1. Lee el estado actual con \`sdd_board_read\` (projectRoot: ${root}).`,
      "2. Propón 2-4 épicas y 3-6 specs con nombres claros, en minúsculas y sin acentos; enséñame la propuesta y espera mi OK antes de escribir nada.",
      "3. Con mi OK: crea cada spec real con `sdd_create_spec`; rellena su borrador con `sdd_update_spec_sections` (historia de usuario, escenarios, criterios EARS «CUANDO … EL SISTEMA DEBERÁ …», requisitos, criterios de éxito, fuera de alcance); dibuja el board con `sdd_board_write` + `sdd_board_connect` (nota de idea → épicas → specs, edges con propósito: contiene/depende de/bloquea/relacionada).",
      "4. No implementes código: el gate SDD sigue cerrado hasta que yo apruebe las specs."
    ].join("\n");
  }
  const idea = description.trim() || "[describe your project]";
  const root = projectRoot || "[workspace path]";
  return [
    `You are my SDD agent connected to the \`sdd-mcp\` MCP. My project: "${idea}".`,
    "Goal: populate the SDD Builder board like the ✨ assistant, but with real intelligence.",
    `1. Read the current state with \`sdd_board_read\` (projectRoot: ${root}).`,
    "2. Propose 2-4 epics and 3-6 specs with clear lowercase accent-free names; show me the proposal and wait for my OK before writing anything.",
    "3. On my OK: create each real spec with `sdd_create_spec`; fill its draft with `sdd_update_spec_sections` (user story, scenarios, EARS criteria \"WHEN … THE SYSTEM SHALL …\", requirements, success criteria, out of scope); draw the board with `sdd_board_write` + `sdd_board_connect` (idea note → epics → specs, purposeful edges: contains/depends on/blocks/related).",
    "4. Do not implement code: the SDD gate stays closed until I approve the specs."
  ].join("\n");
}

export function buildImplementPrompt(
  { projectRoot, specId, specDir }: ImplementPromptInput,
  lang: Lang
): string {
  if (lang === "es") {
    return [
      `Implementa la spec ${specId} de mi workspace SDD.`,
      "",
      `- Workspace: ${projectRoot}`,
      `- Spec activa: ${specDir} — lee spec.md, plan.md y tasks.md antes de tocar código.`,
      "- Antes de implementar: ejecuta la compuerta SDD — `/sdd:gate` en Claude Code, o los scripts del workspace (`./scripts/check-sdd-gate.sh`; en sidecar, `./spec/scripts/check-sdd-gate.sh`) — y registra mi consentimiento explícito (`./scripts/confirm-user-consent.sh` o la tool MCP `sdd_record_user_consent`).",
      "- Hard stop: no hay código sin spec aprobada y plan consistente. Si el gate falla, detente y dime exactamente qué falta.",
      "- Mientras trabajas: marca las tareas de tasks.md al completarlas y cierra con validación + resumen (objetivo, cambios, validación, riesgos, siguiente paso)."
    ].join("\n");
  }
  return [
    `Implement spec ${specId} from my SDD workspace.`,
    "",
    `- Workspace: ${projectRoot}`,
    `- Active spec: ${specDir} — read spec.md, plan.md and tasks.md before touching code.`,
    "- Before implementing: run the SDD gate — `/sdd:gate` in Claude Code, or the workspace scripts (`./scripts/check-sdd-gate.sh`; for a sidecar, `./spec/scripts/check-sdd-gate.sh`) — and record my explicit consent (`./scripts/confirm-user-consent.sh` or the `sdd_record_user_consent` MCP tool).",
    "- Hard stop: no code before approved spec and consistent plan. If the gate fails, stop and tell me exactly what is missing.",
    "- While working: tick tasks.md items as you finish them and close with validation + a summary (objective, changes, validation, risks, next step)."
  ].join("\n");
}

/**
 * Clipboard helper with a legacy fallback; returns false when both fail.
 * navigator.clipboard.writeText can HANG forever in embedded browsers that
 * never answer the permission prompt, so it races a short timeout before
 * trying the legacy execCommand path.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  const modern = navigator.clipboard
    ? Promise.race([
        navigator.clipboard.writeText(text).then(
          () => true,
          () => false
        ),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1200))
      ])
    : Promise.resolve(false);
  if (await modern) return true;

  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
