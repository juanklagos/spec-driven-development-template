#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"

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

printf "Checking SDD gate in: %s\n" "$(cd "$ROOT" && pwd)"

spec_count=0
while IFS= read -r spec_path; do
  spec_count=$((spec_count + 1))
  spec_dir="$(dirname "$spec_path")"
  spec_name="$(basename "$spec_dir")"
  plan_path="$spec_dir/plan.md"
  tasks_path="$spec_dir/tasks.md"

  if rg -qi "Estado / Status" "$spec_path"; then
    ok "$spec_name has approval status section"
  else
    fail "$spec_name/spec.md missing approval status section"
  fi

  status_line="$(rg -n "Estado / Status:" "$spec_path" || true)"
  status_value="$(echo "$status_line" | sed -E 's/.*`([^`]*)`.*/\1/' | tr -d '[:space:]')"
  if echo "$status_value" | rg -qi "^(Aprobado|Approved)$"; then
    if rg -q "YYYY-MM-DD" "$spec_path"; then
      fail "$spec_name approved but approval date still placeholder"
    fi
    if rg -q "Nombre o rol" "$spec_path"; then
      fail "$spec_name approved but approved by still placeholder"
    fi
    if rg -q "Approval evidence.*:\s*$" "$spec_path"; then
      fail "$spec_name approved but approval evidence is empty"
    fi

    if [ -f "$plan_path" ]; then
      plan_hits=0
      rg -qi "Riesgo|Risk" "$plan_path" && plan_hits=$((plan_hits + 1)) || true
      rg -qi "Dependency|Dependencies|Dependencia|Dependencias" "$plan_path" && plan_hits=$((plan_hits + 1)) || true
      rg -qi "Hito|Milestone|Fase|Phase" "$plan_path" && plan_hits=$((plan_hits + 1)) || true
      if [ "$plan_hits" -lt 2 ]; then
        fail "$spec_name approved but plan.md appears incomplete (risks/dependencies/phases)"
      else
        ok "$spec_name approved with minimum plan consistency signals"
      fi
    else
      fail "$spec_name approved but plan.md is missing"
    fi

    if [ -f "$tasks_path" ]; then
      task_lines="$(rg -c "^- \[( |x|X)\]" "$tasks_path" || true)"
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
fi

printf "\nSDD Gate summary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi
