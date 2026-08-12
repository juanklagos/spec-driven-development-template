// Spec 032 — the `sdd-mcp connect` verb. All the file logic lives in
// @juanklagos/sdd-core (connect.ts); this is the report: what was touched,
// what was left alone, and the ONE next step. A setup command that says
// nothing is indistinguishable from one that did nothing.

import {
  AGENT_CLIENTS,
  applyConnect,
  manualInstructions,
  planConnect,
  type ConnectResult,
  type ConnectStatus
} from "@juanklagos/sdd-core";
import path from "node:path";

const STATUS_LABEL: Record<ConnectStatus, string> = {
  created: "creado    / created",
  updated: "actualizado / updated",
  unchanged: "sin cambios / unchanged",
  planned: "se escribiría / would write",
  error: "ERROR"
};

const KIND_LABEL = {
  mcp: "config MCP",
  skill: "skill",
  command: "comando / command"
} as const;

export interface ConnectCommandOptions {
  projectRoot: string;
  clients?: string[];
  dryRun: boolean;
  global: boolean;
}

/** Runs the connect flow and returns the text to print. Never throws for a
 *  per-client failure — those arrive as `error` results (R3). */
export async function runConnectCommand(options: ConnectCommandOptions): Promise<{ output: string; failed: boolean }> {
  const { projectRoot, clients, dryRun, global } = options;

  let results: ConnectResult[];
  try {
    results = dryRun
      ? await planConnect(projectRoot, { clients, global })
      : await applyConnect(projectRoot, { clients, global });
  } catch (error) {
    // A bad --client id or an unresolvable workspace: one clear line, not a stack.
    return { output: `sdd-mcp connect: ${error instanceof Error ? error.message : String(error)}`, failed: true };
  }

  const lines: string[] = [];
  lines.push(
    dryRun
      ? "sdd-mcp connect (--dry-run): nada se escribe. / nothing is written."
      : "sdd-mcp connect"
  );
  lines.push(`Workspace: ${projectRoot}`);
  lines.push("");

  if (results.length === 0) {
    // R9: no client found is a normal outcome, not a failure.
    lines.push("No se detectó ningún cliente de agente en este proyecto.");
    lines.push("No agent client detected in this project.");
    lines.push("");
    lines.push("Puedes forzar uno con --client <id>, o configurarlo a mano:");
    lines.push("You can force one with --client <id>, or configure it by hand:");
    lines.push("");
    for (const { client, file, snippet } of manualInstructions(projectRoot)) {
      lines.push(`  ${client.label} (${client.id}) → ${file}`);
      for (const snippetLine of snippet.split("\n")) lines.push(`      ${snippetLine}`);
      lines.push("");
    }
    return { output: lines.join("\n"), failed: false };
  }

  const byClient = new Map<string, ConnectResult[]>();
  for (const result of results) {
    byClient.set(result.clientId, [...(byClient.get(result.clientId) ?? []), result]);
  }

  for (const [clientId, clientResults] of byClient) {
    lines.push(`${clientResults[0].clientLabel} (${clientId})`);
    for (const result of clientResults) {
      lines.push(`  ${STATUS_LABEL[result.status].padEnd(22)} ${KIND_LABEL[result.kind].padEnd(18)} ${result.file}`);
      if (result.detail) lines.push(`      ${result.detail}`);
    }
    lines.push("");
  }

  const failed = results.some((r) => r.status === "error");
  if (failed) {
    lines.push("Algún archivo no se pudo interpretar y se dejó intacto (arriba, ERROR).");
    lines.push("Some file could not be parsed and was left untouched (ERROR above).");
    lines.push("");
  }

  // R11: the exact next step, per client, in one block.
  const touched = [...byClient.keys()].filter((id) => id !== "standard");
  const hints = AGENT_CLIENTS.filter((c) => touched.includes(c.id));
  lines.push(dryRun ? "Siguiente paso (tras ejecutar sin --dry-run):" : "Siguiente paso / Next step:");
  lines.push("  1. Reinicia tu cliente para que cargue el MCP. / Restart your client so it loads the MCP.");
  lines.push("  2. Abre el lienzo: / Open the board:");
  lines.push(`       npx @juanklagos/sdd-mcp@latest --http     → http://127.0.0.1:3334/builder`);
  lines.push("  3. Pon al agente a atender la cola: / Put the agent to serve the queue:");
  for (const client of hints) {
    lines.push(`       ${client.label.padEnd(14)} ${client.serveHint}`);
  }
  if (path.isAbsolute(projectRoot)) {
    lines.push("");
    lines.push("El agente trabajará sobre este workspace. / The agent will work on this workspace.");
  }

  return { output: lines.join("\n"), failed };
}
