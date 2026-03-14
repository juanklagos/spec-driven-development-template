#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
POLICY_PATH="$ROOT/sdd.policy.yaml"

errors=0
warnings=0

ok() {
  printf "[OK] %s\n" "$1"
}

warn() {
  printf "[WARN] %s\n" "$1"
  warnings=$((warnings + 1))
}

fail() {
  printf "[FAIL] %s\n" "$1"
  errors=$((errors + 1))
}

extract_required_files() {
  awk '
    /^required_files:/ { in_list=1; next }
    in_list && /^agent_rule_markers:/ { in_list=0 }
    in_list && /^  - / {
      sub(/^  - /, "", $0)
      print $0
    }
  ' "$POLICY_PATH"
}

printf "Checking SDD policy in: %s\n" "$(cd "$ROOT" && pwd)"

if [ ! -f "$POLICY_PATH" ]; then
  fail "Missing sdd.policy.yaml"
  printf "\nSDD Policy summary: %d error(s), %d warning(s).\n" "$errors" "$warnings"
  exit 1
fi
ok "Policy file exists: sdd.policy.yaml"

if rg -q '^hard_stop:' "$POLICY_PATH"; then
  ok "Policy defines hard_stop block"
else
  fail "Policy missing hard_stop block"
fi

if rg -q '^required_files:' "$POLICY_PATH"; then
  ok "Policy defines required_files block"
else
  fail "Policy missing required_files block"
fi

while IFS= read -r rel_path; do
  [ -z "$rel_path" ] && continue
  if [ -f "$ROOT/$rel_path" ]; then
    ok "Required file exists: $rel_path"
  else
    fail "Required file missing: $rel_path"
  fi
done < <(extract_required_files)

# Validate rule-file content markers in key files.
for rf in ".cursorrules" ".clauderules" "CLAUDE.md" "GEMINI.md" "WINDSURF.md" "AIDER.md" "ROO.md" ".github/copilot-instructions.md" "INSTRUCTIONS.md"; do
  if [ -f "$ROOT/$rf" ]; then
    if rg -q "template-context/core-instructions/AGENT_OPERATING_SYSTEM.md" "$ROOT/$rf"; then
      ok "$rf references canonical source"
    else
      fail "$rf does not reference canonical source"
    fi

    if rg -q "No code before approved spec and consistent plan\." "$ROOT/$rf" || rg -q "No hay código sin spec aprobada y plan consistente\." "$ROOT/$rf"; then
      ok "$rf includes hard-stop phrasing"
    else
      warn "$rf should include explicit hard-stop phrase"
    fi
  fi
done

printf "\nSDD Policy summary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi
