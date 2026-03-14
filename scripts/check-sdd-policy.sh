#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
POLICY_PATH="$ROOT/sdd.policy.yaml"

errors=0
warnings=0

if command -v rg >/dev/null 2>&1; then
  SEARCH_BIN="rg"
else
  SEARCH_BIN="grep"
fi

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

match_q() {
  local pattern="$1"
  local file="$2"
  if [ "$SEARCH_BIN" = "rg" ]; then
    rg -q -- "$pattern" "$file"
  else
    grep -E -q -- "$pattern" "$file"
  fi
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

if match_q '^hard_stop:' "$POLICY_PATH"; then
  ok "Policy defines hard_stop block"
else
  fail "Policy missing hard_stop block"
fi

if match_q '^required_files:' "$POLICY_PATH"; then
  ok "Policy defines required_files block"
else
  fail "Policy missing required_files block"
fi

if match_q '^execution_root:' "$POLICY_PATH"; then
  ok "Policy defines execution_root block"
else
  fail "Policy missing execution_root block"
fi

if match_q "default_scaffold_profile:[[:space:]]*recommended" "$POLICY_PATH"; then
  ok "Policy default scaffold profile is recommended"
else
  warn "Policy should define default_scaffold_profile: recommended"
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
    if match_q "template-context/core-instructions/AGENT_OPERATING_SYSTEM.md" "$ROOT/$rf"; then
      ok "$rf references canonical source"
    else
      fail "$rf does not reference canonical source"
    fi

    if match_q "No code before approved spec and consistent plan\." "$ROOT/$rf" || match_q "No hay código sin spec aprobada y plan consistente\." "$ROOT/$rf"; then
      ok "$rf includes hard-stop phrasing"
    else
      warn "$rf should include explicit hard-stop phrase"
    fi

    if match_q "www/<project-name>|www/<nombre-proyecto>" "$ROOT/$rf"; then
      ok "$rf includes execution-root phrasing"
    else
      warn "$rf should include explicit execution-root phrasing"
    fi
  fi
done

# Template root must expose the workspace and helper creator script.
if [ -f "$ROOT/scripts/init-project.sh" ]; then
  if [ -d "$ROOT/www" ]; then
    ok "Template workspace exists: www/"
  else
    fail "Template workspace missing: www/"
  fi

  if [ -f "$ROOT/scripts/create-www-project.sh" ]; then
    ok "Workspace bootstrap script exists: scripts/create-www-project.sh"
  else
    fail "Workspace bootstrap script missing: scripts/create-www-project.sh"
  fi
fi

printf "\nSDD Policy summary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi
