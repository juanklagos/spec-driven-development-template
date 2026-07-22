#!/usr/bin/env bash
# Generate llms.txt at the repository root from the real docs content.
# Usage: ./scripts/generate-llms-txt.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT_DIR/llms.txt"
BASE_URL="https://github.com/juanklagos/spec-driven-development-template/blob/main"

title_of() {
  # First H1 of the file, stripped of leading '# ' and emoji-safe.
  sed -n 's/^# //p' "$1" | head -1
}

{
  echo "# Spec-Driven Development Template"
  echo
  echo "> Bilingual (EN/ES) template to learn Spec-Driven Development and apply it to real projects with AI agents. GitHub Spec Kit is the base workflow; this repo adds starter structure, a gate that verifies spec approval, plan consistency and recorded consent, and states its own scope on every run, agent rules, a local MCP server, and a compact spec/ sidecar for existing codebases."
  echo
  echo "Key rules for agents: read AGENTS.md and template-context/core-instructions/AGENT_OPERATING_SYSTEM.md first. Validation: ./scripts/validate-sdd.sh . --strict, ./scripts/check-sdd-policy.sh ., ./scripts/check-sdd-gate.sh ."
  echo
  echo "## Start here"
  echo
  echo "- [README](${BASE_URL}/README.md): overview, entry doors, golden rule"
  echo "- [AGENTS.md](${BASE_URL}/AGENTS.md): rules for AI agents"
  echo "- [AI_START_HERE](${BASE_URL}/AI_START_HERE.md): operating rules and prompts by level"
  echo "- [QUICKSTART](${BASE_URL}/QUICKSTART.md): technical quickstart"
  echo "- [sdd.policy.yaml](${BASE_URL}/sdd.policy.yaml): machine-readable policy"
  echo
  echo "## Docs (English)"
  echo
  for f in "$ROOT_DIR"/docs/en/*.md; do
    name="$(basename "$f")"
    t="$(title_of "$f")"
    [ -n "$t" ] || t="$name"
    echo "- [$t](${BASE_URL}/docs/en/$name)"
  done
  echo
  echo "## Docs (Español)"
  echo
  for f in "$ROOT_DIR"/docs/es/*.md; do
    name="$(basename "$f")"
    t="$(title_of "$f")"
    [ -n "$t" ] || t="$name"
    echo "- [$t](${BASE_URL}/docs/es/$name)"
  done
  echo
  echo "## Optional"
  echo
  echo "- [CHANGELOG](${BASE_URL}/CHANGELOG.md): release history"
  echo "- [Examples](${BASE_URL}/examples/README.md): complete worked examples"
  echo "- [MCP server](${BASE_URL}/packages/sdd-mcp/README.md): local sdd-mcp server"
  echo "- [SDD skill](${BASE_URL}/skills/sdd-workflow/SKILL.md): portable Agent Skill of this workflow"
} > "$OUT"

echo "Generated $OUT ($(wc -l < "$OUT" | tr -d ' ') lines)"
