// Spec 028 — legacy discovery. TypeScript port of scripts/legacy-discovery.sh
// so npm/Desk installs (no bash, no ripgrep) can bootstrap first specs from an
// existing codebase. Parity is of HEURISTICS, not bytes: same signal classes,
// same suggested specs, same report shape — the bash needs `rg`, which the
// decision of 2026-07-23 (mcp-score-port-y-sidecar-execfile) ruled out for
// packaged installs.

import fs from "node:fs/promises";
import path from "node:path";
import { ensureProjectRootAllowed } from "./workspace.js";

export interface LegacyDiscoveryResult {
  target: string;
  outDir: string;
  routeSignals: number;
  flowSignals: number;
  suggestedSpecs: string[];
  reportPath: string;
  routesFile: string;
  flowsFile: string;
}

// Same patterns as scripts/legacy-discovery.sh, including its asymmetry on
// purpose: the signal scan is case-SENSITIVE (`rg -S`) while the suggestion
// match against the collected flow lines is case-INsensitive (`rg -qi`).
const ROUTE_SIGNAL_RE =
  /Route::|router\.|app\.(get|post|put|delete|patch)\(|FastAPI\(|@Get\(|@Post\(|@RequestMapping|path\(|endpoint|\/api\//;
const FLOW_SIGNAL_RE = /login|register|signup|checkout|payment|profile|reset password|forgot|2fa|otp|verification|cart|order/;

const AUTH_FLOW_RE = /login|register|2fa|otp|verification/i;
const COMMERCE_FLOW_RE = /checkout|payment|order|cart/i;
const ACCOUNT_FLOW_RE = /profile|settings|account/i;

/** Files bigger than this are bundles or binaries, not sources worth scanning. */
const MAX_FILE_BYTES = 1024 * 1024;

/**
 * Scan an existing codebase for route/API and user-flow signals, then write
 * the same three artifacts the bash script writes (routes-signals.txt,
 * flow-signals.txt, legacy-discovery-report.md) under
 * `<projectRoot>/analysis/legacy-discovery/` — always there, so a discovery
 * run can never write outside the analyzed project.
 *
 * `projectRoot` is the CODE root, not the SDD root: discovery runs before any
 * spec exists, so this function never calls resolveSddRoot. The template-root
 * guard still applies, same rule as every other tool.
 */
export async function runLegacyDiscovery(projectRoot: string): Promise<LegacyDiscoveryResult> {
  const target = path.resolve(projectRoot);
  await ensureProjectRootAllowed(target);

  const stats = await fs.stat(target).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`Legacy discovery target must be an existing directory: ${target}`);
  }

  const routes: string[] = [];
  const flows: string[] = [];
  await scanDir(target, target, routes, flows);

  const flowsText = flows.join("\n");
  const suggestedSpecs: string[] = [];
  if (AUTH_FLOW_RE.test(flowsText)) suggestedSpecs.push("001-authentication-baseline");
  if (COMMERCE_FLOW_RE.test(flowsText)) suggestedSpecs.push("002-commerce-flow-baseline");
  if (ACCOUNT_FLOW_RE.test(flowsText)) suggestedSpecs.push("003-account-management-baseline");
  if (suggestedSpecs.length === 0) suggestedSpecs.push("001-core-system-baseline");

  const out = path.join(target, "analysis/legacy-discovery");
  await fs.mkdir(out, { recursive: true });
  const routesFile = path.join(out, "routes-signals.txt");
  const flowsFile = path.join(out, "flow-signals.txt");
  const reportPath = path.join(out, "legacy-discovery-report.md");
  await fs.writeFile(routesFile, routes.length > 0 ? `${routes.join("\n")}\n` : "", "utf8");
  await fs.writeFile(flowsFile, flows.length > 0 ? `${flows.join("\n")}\n` : "", "utf8");
  await fs.writeFile(
    reportPath,
    renderReport(target, routes.length, flows.length, suggestedSpecs, routesFile, flowsFile),
    "utf8"
  );

  return {
    target,
    outDir: out,
    routeSignals: routes.length,
    flowSignals: flows.length,
    suggestedSpecs,
    reportPath,
    routesFile,
    flowsFile
  };
}

/**
 * Recursive scan collecting `relative/path:LINE:content` matches, the exact
 * format `rg -n` writes. Hidden entries are skipped because `rg --no-ignore`
 * still skips them (it disables ignore files, not hidden filtering); ignored
 * files such as node_modules ARE scanned, like the bash.
 */
async function scanDir(root: string, dir: string, routes: string[], flows: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanDir(root, full, routes, flows);
    } else if (entry.isFile()) {
      await scanFile(root, full, routes, flows);
    }
  }
}

async function scanFile(root: string, file: string, routes: string[], flows: string[]): Promise<void> {
  const stats = await fs.stat(file).catch(() => null);
  if (!stats || stats.size > MAX_FILE_BYTES) return;
  let content: string;
  try {
    content = await fs.readFile(file, "utf8");
  } catch {
    return; // binary or unreadable: not a source signal
  }
  const relative = path.relative(root, file);
  content.split("\n").forEach((line, index) => {
    const hit = `${relative}:${index + 1}:${line}`;
    if (ROUTE_SIGNAL_RE.test(line)) routes.push(hit);
    if (FLOW_SIGNAL_RE.test(line)) flows.push(hit);
  });
}

function renderReport(
  target: string,
  routeCount: number,
  flowCount: number,
  suggestedSpecs: string[],
  routesFile: string,
  flowsFile: string
): string {
  // Same stamp shape as the bash: date -u +"%Y-%m-%d %H:%M UTC".
  const stamp = `${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC`;
  return `# Legacy Discovery Report / Reporte de descubrimiento legado

Target analyzed / Objetivo analizado: ${target}
Generated at / Generado en: ${stamp}

## Signals found / Señales encontradas

- Route/API signals: ${routeCount}
- User flow signals: ${flowCount}

## Suggested first specs / Specs iniciales sugeridas

${suggestedSpecs.map((s) => `- ${s}`).join("\n")}

## Suggested prompting / Prompt sugerido

\`\`\`text
Using this project as legacy baseline, do reverse engineering into the SDD template.
Create idea/IDEA_GENERAL.md and the first numbered spec(s), preserving current behavior.
Recommend GitHub Spec Kit command flow and split into multiple specs if independent flows are detected.
\`\`\`

## Evidence files / Archivos de evidencia

- ${routesFile}
- ${flowsFile}
`;
}
