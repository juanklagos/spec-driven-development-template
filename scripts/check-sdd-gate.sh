#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

ROOT_INPUT="${1:-.}"
ROOT="$(sdd_resolve_root "$ROOT_INPUT" || sdd_resolve_root "$SCRIPT_DIR/.." || true)"
if [ -z "$ROOT" ]; then
  echo "Error: could not resolve SDD root from: $ROOT_INPUT"
  exit 1
fi

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

match_qi() {
  local pattern="$1"
  local file="$2"
  if [ "$SEARCH_BIN" = "rg" ]; then
    rg -qi -- "$pattern" "$file"
  else
    grep -E -i -q -- "$pattern" "$file"
  fi
}

first_line_match() {
  local pattern="$1"
  local file="$2"
  if [ "$SEARCH_BIN" = "rg" ]; then
    rg -n -- "$pattern" "$file" | head -n 1 || true
  else
    grep -n -E -- "$pattern" "$file" | head -n 1 || true
  fi
}

count_matches() {
  local pattern="$1"
  local file="$2"
  if [ "$SEARCH_BIN" = "rg" ]; then
    rg -c -- "$pattern" "$file" || true
  else
    grep -E -c -- "$pattern" "$file" || true
  fi
}

printf "Checking SDD gate in: %s\n" "$(cd "$ROOT" && pwd)"

if [ -f "$ROOT/scripts/check-sdd-policy.sh" ]; then
  if bash "$ROOT/scripts/check-sdd-policy.sh" "$ROOT"; then
    ok "SDD policy check"
  else
    fail "SDD policy check failed"
  fi
else
  fail "Missing scripts/check-sdd-policy.sh"
fi

spec_count=0
approved_count=0
while IFS= read -r spec_path; do
  spec_count=$((spec_count + 1))
  spec_dir="$(dirname "$spec_path")"
  spec_name="$(basename "$spec_dir")"
  plan_path="$spec_dir/plan.md"
  tasks_path="$spec_dir/tasks.md"

  if match_qi "Estado / Status" "$spec_path"; then
    ok "$spec_name has approval status section"
  else
    fail "$spec_name/spec.md missing approval status section"
  fi

  status_line="$(first_line_match "Estado / Status:" "$spec_path")"
  status_value="$(echo "$status_line" | sed -E 's/.*`([^`]*)`.*/\1/' | tr -d '[:space:]')"
  if echo "$status_value" | grep -E -i -q "^(Aprobado|Approved)$"; then
    approved_count=$((approved_count + 1))
    if match_q "YYYY-MM-DD" "$spec_path"; then
      fail "$spec_name approved but approval date still placeholder"
    fi
    if match_q "Nombre o rol" "$spec_path"; then
      fail "$spec_name approved but approved by still placeholder"
    fi
    if match_q "Approval evidence.*:[[:space:]]*$" "$spec_path"; then
      fail "$spec_name approved but approval evidence is empty"
    fi

    if [ -f "$plan_path" ]; then
      plan_hits=0
      match_qi "Riesgo|Risk" "$plan_path" && plan_hits=$((plan_hits + 1)) || true
      match_qi "Dependency|Dependencies|Dependencia|Dependencias" "$plan_path" && plan_hits=$((plan_hits + 1)) || true
      match_qi "Hito|Milestone|Fase|Phase" "$plan_path" && plan_hits=$((plan_hits + 1)) || true
      if [ "$plan_hits" -lt 2 ]; then
        fail "$spec_name approved but plan.md appears incomplete (risks/dependencies/phases)"
      else
        ok "$spec_name approved with minimum plan consistency signals"
      fi
    else
      fail "$spec_name approved but plan.md is missing"
    fi

    if [ -f "$tasks_path" ]; then
      task_lines="$(count_matches "^- \\[( |x|X)\\]" "$tasks_path")"
      if [ "${task_lines:-0}" -le 0 ]; then
        fail "$spec_name approved but tasks.md has no checklist tasks"
      else
        ok "$spec_name approved with checklist tasks"
      fi
    else
      fail "$spec_name approved but tasks.md is missing"
    fi
  else
    warn "$spec_name not approved yet (implementation gate should remain closed)"
  fi
done < <(find "$ROOT/specs" -mindepth 1 -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' \
  | sort \
  | while IFS= read -r d; do
      [ -f "$d/spec.md" ] && printf "%s\n" "$d/spec.md"
    done)

if [ "$spec_count" -eq 0 ]; then
  warn "No numbered specs found; gate check skipped."
else
  if [ "$approved_count" -gt 0 ]; then
    if [ -s "$ROOT/.sdd/user-consent.log" ]; then
      ok "User consent log present for execution stage: .sdd/user-consent.log"
    else
      fail "Missing user consent log (.sdd/user-consent.log) for approved spec execution"
    fi
  else
    warn "No approved specs yet; user consent log not required at base SDD stage"
  fi
fi

printf "\nSDD Gate summary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi
