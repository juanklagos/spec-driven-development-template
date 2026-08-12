// Spec 029, R4 — `sdd-mcp upgrade` for people who do not use an agent.
//
// Under the spec 021 contract: never silence. It always says which version it
// found, which it is moving to, every file it touched, and — the part that
// matters — every file it deliberately did NOT touch because it is yours.

import { compareSidecar, resolveSddRoot, upgradeSidecar, type UpgradeFileResult } from "@juanklagos/sdd-core";

const ACTION_LABEL: Record<UpgradeFileResult["action"], string> = {
  refreshed: "reparado    / refreshed",
  created: "creado      / created",
  overwritten: "sobrescrito / overwritten",
  skipped: "TUYO, intacto / yours, untouched",
  unchanged: "sin cambios / unchanged",
  planned: "se tocaria  / would touch"
};

export interface UpgradeCommandOptions {
  projectRoot: string;
  dryRun: boolean;
  applyPreserved?: string[];
}

export async function runUpgradeCommand(
  options: UpgradeCommandOptions
): Promise<{ output: string; failed: boolean }> {
  const { projectRoot, dryRun, applyPreserved } = options;
  const lines: string[] = [];

  let sddRoot: string;
  try {
    sddRoot = await resolveSddRoot(projectRoot);
  } catch (error) {
    return {
      output: [
        `sdd-mcp upgrade: ${error instanceof Error ? error.message : String(error)}`,
        "",
        "¿Es un proyecto con SDD instalado? Si aún no lo tiene:",
        "Is this a project with SDD installed? If not yet:",
        "  npx @juanklagos/create-sdd-project@latest ."
      ].join("\n"),
      failed: true
    };
  }

  const version = (await import("./cli.js")).packageVersion();
  const comparison = await compareSidecar(sddRoot, version);

  lines.push(dryRun ? "sdd-mcp upgrade (--dry-run): nada se escribe. / nothing is written." : "sdd-mcp upgrade");
  lines.push(`Sidecar: ${comparison.sidecarRoot}`);
  lines.push(
    `Version instalada / installed: ${comparison.templateVersion ?? "desconocida / unknown"}  →  ` +
      `servidor / server: ${comparison.packageVersion}`
  );
  lines.push("");

  // R2 scenario 2: up to date means say so and write nothing.
  if (comparison.upToDate) {
    lines.push("Ya está al día: no hay nada que hacer y no se escribió nada.");
    lines.push("Already up to date: nothing to do, nothing written.");
    return { output: lines.join("\n"), failed: false };
  }

  const result = await upgradeSidecar(sddRoot, version, { dryRun, applyPreserved });

  const touched = result.files.filter((f) => f.action !== "unchanged");
  if (touched.length === 0) {
    lines.push("Nada que cambiar en los archivos; solo se alineó el marcador de versión.");
    lines.push("No file changes; only the version marker was aligned.");
  }
  for (const file of touched) {
    lines.push(`  ${ACTION_LABEL[file.action].padEnd(30)} ${file.target}`);
  }

  if (result.pending.length > 0) {
    lines.push("");
    lines.push("Estos archivos son TUYOS y difieren de la versión nueva. No se tocaron:");
    lines.push("These files are YOURS and differ from the new version. They were not touched:");
    for (const target of result.pending) lines.push(`  ${target}`);
    lines.push("");
    lines.push("Para adoptar la versión nueva de alguno (perderás tus cambios en él):");
    lines.push("To adopt the new version of one (you will lose your edits in it):");
    lines.push(`  sdd-mcp upgrade --apply ${result.pending[0]}`);
  }

  lines.push("");
  if (dryRun) {
    lines.push("Ejecuta lo mismo sin --dry-run para aplicarlo. / Run the same without --dry-run to apply it.");
  } else {
    lines.push(
      result.markerUpdated
        ? `Marcador actualizado a ${result.toVersion}. / Marker updated to ${result.toVersion}.`
        : "El marcador ya estaba al día. / The marker was already current."
    );
  }

  return { output: lines.join("\n"), failed: false };
}
