#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

ROOT_INPUT=""
REQUIRE_OPEN=0
while [ "$#" -gt 0 ]; do
  case "$1" in
    --require-open) REQUIRE_OPEN=1 ;;
    -h|--help)
      echo "Usage: $0 [project_root] [--require-open]"
      echo "  --require-open   exit 2 when the gate is closed (nothing approved yet)."
      echo "                   Default behaviour is unchanged: 0 on success, 1 on errors."
      exit 0
      ;;
    -*)
      echo "Error: unknown option: $1" >&2
      echo "Usage: $0 [project_root] [--require-open]" >&2
      exit 2
      ;;
    *) [ -n "$ROOT_INPUT" ] || ROOT_INPUT="$1" ;;
  esac
  shift
done
ROOT="$(sdd_require_root "$ROOT_INPUT" "$SCRIPT_DIR/..")" || exit 1

# KEEP IN SYNC with APPROVED_STATUS_ERE / isApprovedStatus in
# packages/sdd-core/src/board.ts — the ONE approval rule of this project.
# Bash cannot import TypeScript, so scripts/test-mcp-integration.mjs reads this
# literal out of this file and asserts it equals the exported constant, and
# runs both gates over the same fixtures.
SDD_APPROVED_STATUS_ERE='aprobad[oa]|approved'
# Negation wins: 'No aprobado' / 'Not approved' / 'unapproved' contain an
# approval word but mean the opposite. KEEP IN SYNC with NEGATED_STATUS_ERE.
SDD_NEGATED_STATUS_ERE='(^|[^a-z])(no|not|sin|un|non)[ -]?(aprobad[oa]|approved)'

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
approved_names=""
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

  # Only a backticked value is a status. Without this guard the substring rule
  # below would read the whole "- Estado / Status: ..." line and call anything
  # mentioning "approved" approved, while sdd-core (which requires the
  # backticks) read the same spec as pending.
  status_line="$(first_line_match "Estado / Status:" "$spec_path")"
  status_value="$(sdd_extract_status_value "$status_line")"
  if printf "%s" "$status_value" | grep -E -i -q -- "$SDD_NEGATED_STATUS_ERE"; then
    # Negation wins: "No aprobado" contains an approval word but is not approval.
    :
  elif printf "%s" "$status_value" | grep -E -i -q -- "$SDD_APPROVED_STATUS_ERE"; then
    approved_count=$((approved_count + 1))
    approved_names="${approved_names}${spec_name}"$'\n'
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
    # Consent is PER SPEC. KEEP IN SYNC with checkGate/hasRecordedConsent in
    # packages/sdd-core/src/index.ts — all three rules below:
    #
    #   1. Non-blank content, not just an existing file: a zero-byte log (a bare
    #      `touch`, or an interrupted confirm-user-consent.sh) is not consent.
    #   2. A `[spec:<id>]` entry is consent for THAT spec. Verified 2026-07-21:
    #      with only the global non-empty test, consenting once to 001 opened
    #      the gate for an unrelated, later-approved 002 the user never saw.
    #   3. Migration, never a hard break: a log written before per-spec entries
    #      existed (any non-blank line with no `[spec:` marker) still covers the
    #      whole workspace, but downgrades to a WARNING naming the exact command
    #      to migrate. Only a log that already speaks the new format, yet says
    #      nothing about this spec, is an error.
    consent_log="$ROOT/.sdd/user-consent.log"
    if [ -s "$consent_log" ] && grep -q '[^[:space:]]' "$consent_log"; then
      ok "User consent log present for execution stage: .sdd/user-consent.log"

      has_legacy_consent=0
      if grep -v -E '\[spec:[^]]+\]' "$consent_log" | grep -q '[^[:space:]]'; then
        has_legacy_consent=1
      fi

      consent_cmd="./scripts/confirm-user-consent.sh"
      [ "$(basename "$ROOT")" = "spec" ] && consent_cmd="./spec/scripts/confirm-user-consent.sh"

      legacy_covered=""
      while IFS= read -r approved_name; do
        [ -n "$approved_name" ] || continue
        if grep -qF "[spec:$approved_name]" "$consent_log"; then
          ok "$approved_name has recorded user consent"
        elif [ "$has_legacy_consent" -eq 1 ]; then
          legacy_covered="${legacy_covered}${legacy_covered:+, }${approved_name}"
        else
          fail "$approved_name approved but no user consent recorded for it. Run: $consent_cmd --spec $approved_name \"User approved implementation for spec $approved_name\""
        fi
      done <<< "$approved_names"

      if [ -n "$legacy_covered" ]; then
        warn "Legacy consent log covers these approved specs without a per-spec entry: $legacy_covered. Migrate each one with: $consent_cmd --spec <NNN-slug> \"User approved implementation for spec <NNN-slug>\""
      fi
    else
      fail "Missing or empty user consent log (.sdd/user-consent.log) for approved spec execution"
    fi
  else
    warn "No approved specs yet; user consent log not required at base SDD stage"
  fi
fi

# KEEP IN SYNC with computeVerdict in packages/sdd-core/src/index.ts.
# Errors always win: a broken workspace says nothing about approval.
if [ "$errors" -gt 0 ]; then
  verdict="blocked"
  verdict_es="BLOQUEADA"
  verdict_why="hay errores que arreglar antes de nada / errors must be fixed first"
elif [ "$approved_count" -gt 0 ]; then
  verdict="open"
  verdict_es="ABIERTA"
  verdict_why="$approved_count spec(s) aprobada(s) y consentida(s) / approved and consented"
else
  verdict="closed"
  verdict_es="CERRADA"
  verdict_why="todavia no hay ninguna spec aprobada / nothing approved yet"
fi

# The posture line prints on every run, including green ones, and cannot be
# suppressed. A green chip must never be able to mean "we did not check".
printf "\nCompuerta / Gate: %s / %s — %s\n" "$verdict_es" "$verdict" "$verdict_why"
printf "Comprobado / Checked: politica, estructura de specs, estado de aprobacion, consentimiento por spec, dependencias.\n"
printf "NO comprobado / NOT checked: si el codigo del proyecto corresponde a una spec aprobada (spec 014).\n"

printf "\nSDD Gate summary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi

if [ "$REQUIRE_OPEN" -eq 1 ] && [ "$verdict" = "closed" ]; then
  printf "\n--require-open: la compuerta esta cerrada / the gate is closed. Exit 2.\n" >&2
  exit 2
fi
