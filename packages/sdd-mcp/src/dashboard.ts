// GET /dashboard: server-rendered HTML snapshot of the workspace (specs,
// statuses, gate state). Read-only; the interactive canvas lives in /builder.

import { checkGate, listSpecs } from "@juanklagos/sdd-core";

const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function renderDashboard(projectRoot: string): Promise<string> {
  let specsRows = "";
  let gateSummary = "";
  try {
    const specs = await listSpecs(projectRoot);
    specsRows = specs.length
      ? specs
          .map(
            (s) =>
              `<tr><td>${escapeHtml(s.id)}</td><td><code>${escapeHtml(s.dir)}</code></td><td><span class="badge ${
                /aprobado|approved|done|completada/i.test(s.status) ? "ok" : "pending"
              }">${escapeHtml(s.status)}</span></td></tr>`
          )
          .join("\n")
      : `<tr><td colspan="3">No specs found in this workspace / No hay specs en este workspace</td></tr>`;

    const gate = await checkGate(projectRoot);
    const gateClass = gate.ok ? "ok" : "fail";
    const gateText = gate.ok ? "OPEN — implementation allowed" : "CLOSED — refine spec/plan first";
    gateSummary = `<p class="badge ${gateClass}">Gate: ${gateText}</p>
      <p>${gate.approvedSpecs}/${gate.totalSpecs} specs approved · ${gate.errors} error(s) · ${gate.warnings} warning(s)</p>`;
  } catch (error) {
    gateSummary = `<p class="badge fail">Could not read SDD workspace at <code>${escapeHtml(projectRoot)}</code>: ${escapeHtml(
      error instanceof Error ? error.message : String(error)
    )}</p>
      <p>Set <code>SDD_PROJECT_ROOT</code> to a workspace that contains <code>specs/</code> (or a <code>spec/</code> sidecar).</p>`;
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SDD Dashboard</title>
<style>
  :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
  body { margin: 2rem auto; max-width: 60rem; padding: 0 1rem; line-height: 1.5; }
  h1 { font-size: 1.4rem; } code { font-size: 0.9em; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid color-mix(in srgb, currentColor 20%, transparent); }
  .badge { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 600; }
  .ok { background: #16a34a22; color: #16a34a; }
  .pending { background: #ca8a0422; color: #ca8a04; }
  .fail { background: #dc262622; color: #dc2626; }
  footer { margin-top: 2rem; font-size: 0.85rem; opacity: 0.7; }
</style>
</head>
<body>
<h1>🌱 SDD Dashboard</h1>
<p>Workspace: <code>${escapeHtml(projectRoot)}</code></p>
${gateSummary}
<table>
<thead><tr><th>Spec</th><th>Folder</th><th>Status</th></tr></thead>
<tbody>
${specsRows}
</tbody>
</table>
<footer>Golden rule: no code before approved spec and consistent plan. ·
<a href="https://github.com/juanklagos/spec-driven-development-template">spec-driven-development-template</a></footer>
</body>
</html>`;
}
