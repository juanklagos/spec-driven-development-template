// Multi-agent policy check: sdd.policy.yaml exists and declares its blocks,
// every file it lists is present, and each agent rule file still points at the
// canonical operating system.
//
// PAIRED WITH scripts/check-sdd-policy.sh, which implements the exact same
// rules for shells and CI. Bash cannot import TypeScript, so the pairing is
// kept honest by scripts/test-mcp-integration.mjs, which runs BOTH over the
// same fixtures and asserts they open and close together.
//
// This module exists because checkGate() never ran the policy check at all
// while scripts/check-sdd-gate.sh runs it first: deleting spec/CLAUDE.md,
// .cursorrules and AGENTS.md gave bash 3 errors and exit 1, and the MCP /
// builder gate a cheerful `ok: true, errors: 0`.

import { promises as fs } from "node:fs";
import path from "node:path";
import { summarize, type ValidationMessage, type ValidationResult } from "./validation.js";
import { exists, resolveSddRoot, safeReadFile } from "./workspace.js";

/** Top-level policy blocks whose absence closes the gate. */
const REQUIRED_POLICY_BLOCKS: ReadonlyArray<readonly [string, string]> = [
  ["hard_stop", "policy-missing-hard-stop"],
  ["required_files", "policy-missing-required-files"],
  ["execution_root", "policy-missing-execution-root"],
  ["user_consent", "policy-missing-user-consent"]
];

/**
 * Agent rule files whose content markers are validated when they are present.
 * KEEP IN SYNC with the `for rf in ...` loop of scripts/check-sdd-policy.sh.
 */
const AGENT_RULE_FILES = [
  ".cursorrules",
  ".clauderules",
  "CLAUDE.md",
  "GEMINI.md",
  "WINDSURF.md",
  "AIDER.md",
  "ROO.md",
  ".github/copilot-instructions.md",
  "INSTRUCTIONS.md"
] as const;

const CANONICAL_SOURCE_MARKER = "template-context/core-instructions/AGENT_OPERATING_SYSTEM.md";
const HARD_STOP_MARKERS = [
  "No code before approved spec and consistent plan.",
  "No hay código sin spec aprobada y plan consistente."
] as const;
const EXECUTION_ROOT_MARKER = /recommended default workspace|espacio de trabajo recomendado por defecto/;

/**
 * The `required_files:` list of sdd.policy.yaml.
 * Mirrors the awk block of scripts/check-sdd-policy.sh: everything indented as
 * `  - ` between `required_files:` and `agent_rule_markers:`.
 */
export function parseRequiredFiles(policyContent: string): string[] {
  const files: string[] = [];
  let inList = false;

  for (const line of policyContent.split("\n")) {
    if (/^required_files:/.test(line)) {
      inList = true;
      continue;
    }
    if (inList && /^agent_rule_markers:/.test(line)) {
      inList = false;
      continue;
    }
    if (!inList) continue;
    const match = line.match(/^ {2}- (.*)$/);
    if (match) files.push(match[1].trim());
  }

  return files;
}

/** Policy compliance of an SDD workspace (or of the `spec/` sidecar of one). */
export async function checkPolicy(projectRoot: string): Promise<ValidationResult> {
  const root = await resolveSddRoot(projectRoot);
  const messages: ValidationMessage[] = [];
  const policyPath = path.join(root, "sdd.policy.yaml");

  if (!(await exists(policyPath))) {
    messages.push({
      level: "error",
      code: "policy-missing",
      message: "Missing sdd.policy.yaml",
      path: "sdd.policy.yaml"
    });
    return summarize(messages);
  }

  const policy = await fs.readFile(policyPath, "utf8");

  for (const [block, code] of REQUIRED_POLICY_BLOCKS) {
    if (!new RegExp(`^${block}:`, "m").test(policy)) {
      messages.push({
        level: "error",
        code,
        message: `Policy missing ${block} block`,
        path: "sdd.policy.yaml"
      });
    }
  }

  if (!/default_scaffold_profile:[ \t]*recommended/.test(policy)) {
    messages.push({
      level: "warning",
      code: "policy-default-scaffold-profile",
      message: "Policy should define default_scaffold_profile: recommended",
      path: "sdd.policy.yaml"
    });
  }

  for (const relativePath of parseRequiredFiles(policy)) {
    if (!(await exists(path.join(root, ...relativePath.split("/"))))) {
      messages.push({
        level: "error",
        code: "policy-required-file-missing",
        message: `Required file missing: ${relativePath}`,
        path: relativePath
      });
    }
  }

  for (const ruleFile of AGENT_RULE_FILES) {
    const filePath = path.join(root, ...ruleFile.split("/"));
    if (!(await exists(filePath))) continue;
    const content = await safeReadFile(filePath);

    if (!content.includes(CANONICAL_SOURCE_MARKER)) {
      messages.push({
        level: "error",
        code: "policy-rule-file-canonical-source",
        message: `${ruleFile} does not reference canonical source`,
        path: ruleFile
      });
    }

    if (!HARD_STOP_MARKERS.some((marker) => content.includes(marker))) {
      messages.push({
        level: "warning",
        code: "policy-rule-file-hard-stop",
        message: `${ruleFile} should include explicit hard-stop phrase`,
        path: ruleFile
      });
    }

    if (!EXECUTION_ROOT_MARKER.test(content)) {
      messages.push({
        level: "warning",
        code: "policy-rule-file-execution-root",
        message: `${ruleFile} should include recommended default workspace phrasing`,
        path: ruleFile
      });
    }
  }

  // Only the full template layout ships the project initializer; a compact
  // spec/ sidecar has neither www/ nor create-www-project.sh and must not be
  // asked for them (same guard as scripts/check-sdd-policy.sh).
  if (await exists(path.join(root, "scripts/init-project.sh"))) {
    if (!(await exists(path.join(root, "www")))) {
      messages.push({
        level: "error",
        code: "policy-missing-workspace",
        message: "Template workspace missing: www/",
        path: "www"
      });
    }
    if (!(await exists(path.join(root, "scripts/create-www-project.sh")))) {
      messages.push({
        level: "error",
        code: "policy-missing-bootstrap-script",
        message: "Workspace bootstrap script missing: scripts/create-www-project.sh",
        path: "scripts/create-www-project.sh"
      });
    }
  }

  return summarize(messages);
}
