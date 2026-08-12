// Spec 029, R1 — the sidecar's file classification, made explicit.
//
// The rule already existed, but only as the order of lines in a bash script:
// `copy_framework_file` (cp -f, ours, repaired on every install) versus
// `copy_if_absent` (the user's, preserved forever). Buried there, nothing
// could ask "what would an update touch?" before touching it — which is the
// whole point of this spec.
//
// This module is the single source. `install-spec-sidecar.sh` stays the
// installer, and `sidecar-files.test.ts` fails if the two ever disagree: a
// file the bash copies but this list does not know would be invisible to
// every upgrade, which is exactly the silent divergence we are removing.

/**
 * FRAMEWORK: ours. A stale or tampered copy is a broken gate, so an update
 * overwrites it without asking.
 * PRESERVED: the user's to edit. An update never writes it without an
 * explicit yes, even when the reference content changed.
 */
export type SidecarFileKind = "framework" | "preserved";

export interface SidecarFile {
  /** Path inside the framework payload (source of truth for the content). */
  source: string;
  /** Path inside the sidecar, relative to its root. */
  target: string;
  kind: SidecarFileKind;
  /** Only installed by the "recommended" profile. */
  recommendedOnly?: boolean;
}

export const SIDECAR_FILES: SidecarFile[] = [
  // --- Preserved: the user owns these ---------------------------------------
  { source: "templates/sidecar/README.md", target: "README.md", kind: "preserved" },
  { source: "templates/sidecar/AGENTS.md", target: "AGENTS.md", kind: "preserved" },
  { source: "templates/sidecar/AI_START_HERE.md", target: "AI_START_HERE.md", kind: "preserved" },
  { source: "templates/sidecar/INSTRUCTIONS.md", target: "INSTRUCTIONS.md", kind: "preserved" },
  { source: "templates/sidecar/sdd.policy.yaml", target: "sdd.policy.yaml", kind: "preserved" },
  {
    source: "templates/sidecar/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md",
    target: "template-context/core-instructions/AGENT_OPERATING_SYSTEM.md",
    kind: "preserved"
  },
  { source: "specs/README.md", target: "specs/README.md", kind: "preserved" },
  { source: "specs/_template/spec.md", target: "specs/_template/spec.md", kind: "preserved" },
  { source: "specs/_template/plan.md", target: "specs/_template/plan.md", kind: "preserved" },
  { source: "specs/_template/tasks.md", target: "specs/_template/tasks.md", kind: "preserved" },
  { source: "specs/_template/research.md", target: "specs/_template/research.md", kind: "preserved" },
  { source: "specs/_template/history.md", target: "specs/_template/history.md", kind: "preserved" },
  {
    source: "specs/_template/contracts/README.md",
    target: "specs/_template/contracts/README.md",
    kind: "preserved"
  },
  { source: "bitacora/README.md", target: "bitacora/README.md", kind: "preserved" },
  {
    source: "bitacora/templates/DAILY_TEMPLATE.md",
    target: "bitacora/templates/DAILY_TEMPLATE.md",
    kind: "preserved"
  },
  {
    source: "bitacora/templates/HANDOFF_TEMPLATE.md",
    target: "bitacora/templates/HANDOFF_TEMPLATE.md",
    kind: "preserved"
  },
  {
    source: "bitacora/templates/DECISION_TEMPLATE.md",
    target: "bitacora/templates/DECISION_TEMPLATE.md",
    kind: "preserved"
  },
  { source: ".sdd.README.template.md", target: ".sdd/README.md", kind: "preserved" },
  {
    source: "template-context/README.md",
    target: "template-context/README.md",
    kind: "preserved",
    recommendedOnly: true
  },
  {
    source: "template-context/05-SDD-EXECUTION-GATE.md",
    target: "template-context/05-SDD-EXECUTION-GATE.md",
    kind: "preserved",
    recommendedOnly: true
  },
  {
    source: "template-context/06-AI-RULES-MATRIX.md",
    target: "template-context/06-AI-RULES-MATRIX.md",
    kind: "preserved",
    recommendedOnly: true
  },

  // --- Framework: the enforcement machinery, repaired on every update -------
  { source: "scripts/lib/sdd-root.sh", target: "scripts/lib/sdd-root.sh", kind: "framework" },
  { source: "scripts/lib/sdd-attribution.sh", target: "scripts/lib/sdd-attribution.sh", kind: "framework" },
  { source: "scripts/lib/sdd-scaffold.sh", target: "scripts/lib/sdd-scaffold.sh", kind: "framework" },
  { source: "scripts/validate-sdd.sh", target: "scripts/validate-sdd.sh", kind: "framework" },
  { source: "scripts/check-sdd-policy.sh", target: "scripts/check-sdd-policy.sh", kind: "framework" },
  { source: "scripts/check-sdd-gate.sh", target: "scripts/check-sdd-gate.sh", kind: "framework" },
  { source: "scripts/confirm-user-consent.sh", target: "scripts/confirm-user-consent.sh", kind: "framework" },
  { source: "scripts/new-spec.sh", target: "scripts/new-spec.sh", kind: "framework" }
];

/** Files whose mode must stay executable after an update. */
export const SIDECAR_EXECUTABLES = new Set([
  "scripts/validate-sdd.sh",
  "scripts/check-sdd-policy.sh",
  "scripts/check-sdd-gate.sh",
  "scripts/confirm-user-consent.sh",
  "scripts/new-spec.sh"
]);

export function sidecarFilesFor(profile: string): SidecarFile[] {
  return profile === "recommended" || profile === "full"
    ? SIDECAR_FILES
    : SIDECAR_FILES.filter((file) => !file.recommendedOnly);
}
