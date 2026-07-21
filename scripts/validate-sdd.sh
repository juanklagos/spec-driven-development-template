#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

ROOT_INPUT="${1-}"
STRICT="${2:-}"
ROOT="$(sdd_require_root "$ROOT_INPUT" "$SCRIPT_DIR/..")" || exit 1

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

require_dir() {
  local path="$1"
  if [ -d "$ROOT/$path" ]; then
    ok "Directory exists: $path"
  else
    fail "Missing directory: $path"
  fi
}

require_file() {
  local path="$1"
  if [ -f "$ROOT/$path" ]; then
    ok "File exists: $path"
  else
    fail "Missing file: $path"
  fi
}

printf "Validating SDD structure in: %s\n" "$(cd "$ROOT" && pwd)"

require_dir "idea"
require_dir "specs"
require_dir "bitacora"
require_file "idea/IDEA_GENERAL.md"
require_file "specs/INDEX.md"
require_dir "specs/_template"
require_file "specs/_template/spec.md"

if [ -f "$ROOT/idea/IDEA_GENERAL.md" ]; then
  # Check if the file has real content beyond the template structure.
  # Strip HTML comments, blank lines, lines starting with # or <!-- or - (empty bullets), and *Created using*
  real_content=$(sed -e 's/<!--.*-->//g' "$ROOT/idea/IDEA_GENERAL.md" \
    | grep -vE '^\s*$|^\s*#|^\s*>|^\s*-\s*$|^\s*\*Created|^\s*---' \
    | grep -vE '^\s*<!--' \
    | wc -c | tr -d ' ')
  if [ "$real_content" -le 50 ]; then
    warn "idea/IDEA_GENERAL.md exists but appears to be unfilled (only template structure). Please add your project details."
  fi
fi

require_file "specs/_template/plan.md"
require_file "specs/_template/tasks.md"
require_file "specs/_template/research.md"
require_file "specs/_template/history.md"

if [ -f "$ROOT/scripts/check-sdd-policy.sh" ]; then
  if bash "$ROOT/scripts/check-sdd-policy.sh" "$ROOT"; then
    ok "SDD policy check"
  else
    fail "SDD policy check failed"
  fi
else
  fail "Missing scripts/check-sdd-policy.sh"
fi

spec_dirs=()
while IFS= read -r spec_dir; do
  spec_dirs+=("$spec_dir")
done < <(find "$ROOT/specs" -mindepth 1 -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' | sort)

if [ ${#spec_dirs[@]} -eq 0 ]; then
  warn "No numbered spec directories found in specs/."
else
  for spec_path in "${spec_dirs[@]}"; do
    spec_name="${spec_path##*/}"
    for file in spec.md plan.md tasks.md research.md history.md; do
      if [ -f "$spec_path/$file" ]; then
        ok "$spec_name/$file"
      else
        fail "$spec_name missing $file"
      fi
    done
  done
fi

require_dir "bitacora/global"
require_dir "bitacora/diaria"
require_dir "bitacora/handoffs"
require_dir "bitacora/decisiones"

if [ -f "$ROOT/bitacora/global/PROJECT_LOG.md" ]; then
  ok "bitacora/global/PROJECT_LOG.md"
else
  warn "bitacora/global/PROJECT_LOG.md is missing (recommended)."
fi

if [ "$STRICT" = "--strict" ]; then
  PROJECT_ROOT="$(sdd_project_root "$ROOT")"
  PREFIX="$(sdd_relative_prefix "$PROJECT_ROOT" "$ROOT")"
  SPEC_PREFIX="specs"
  if [ -n "$PREFIX" ]; then
    SPEC_PREFIX="$PREFIX/specs"
  fi

  if command -v git >/dev/null 2>&1 && [ -d "$PROJECT_ROOT/.git" ]; then
    # Which revisions to compare.
    #
    # `git diff` with no range only ever reports UNCOMMITTED working-tree
    # changes. That is right locally, and useless in CI: after a clean checkout
    # the tree is pristine, so this check returned empty every time and had
    # never once fired on a pull request. Resolve a real base when one exists.
    #
    # Every git call is guarded: under `set -euo pipefail` an unresolvable ref
    # would abort the whole script with exit 128.
    DIFF_RANGE=""
    DIFF_SOURCE="working tree (uncommitted changes)"
    if [ -n "${SDD_DIFF_BASE:-}" ]; then
      if git -C "$PROJECT_ROOT" rev-parse --verify --quiet "${SDD_DIFF_BASE}^{commit}" >/dev/null 2>&1; then
        DIFF_RANGE="${SDD_DIFF_BASE}...HEAD"
        DIFF_SOURCE="SDD_DIFF_BASE=${SDD_DIFF_BASE}"
      else
        warn "Strict mode: SDD_DIFF_BASE='${SDD_DIFF_BASE}' does not resolve in this repository; falling back to the working tree."
      fi
    elif [ -n "${GITHUB_BASE_REF:-}" ]; then
      # Pull request. The remote-tracking ref is the one that exists after
      # actions/checkout; the bare branch name usually does not.
      for candidate in "refs/remotes/origin/${GITHUB_BASE_REF}" "origin/${GITHUB_BASE_REF}" "${GITHUB_BASE_REF}"; do
        if git -C "$PROJECT_ROOT" rev-parse --verify --quiet "${candidate}^{commit}" >/dev/null 2>&1; then
          DIFF_RANGE="${candidate}...HEAD"
          DIFF_SOURCE="$candidate"
          break
        fi
      done
      if [ -z "$DIFF_RANGE" ]; then
        warn "Strict mode: base ref '${GITHUB_BASE_REF}' is not in this checkout. Add 'fetch-depth: 0' to actions/checkout so the spec/history check can run."
      fi
    fi

    if [ -n "$DIFF_RANGE" ]; then
      changed_specs="$(git -C "$PROJECT_ROOT" diff --name-only "$DIFF_RANGE" -- "$SPEC_PREFIX" 2>/dev/null || true)"
    else
      changed_specs="$(git -C "$PROJECT_ROOT" diff --name-only -- "$SPEC_PREFIX" 2>/dev/null || true)"
    fi

    while IFS= read -r spec_path; do
      [ -n "$spec_path" ] || continue
      case "$spec_path" in
        */history.md) continue ;;
      esac
      spec_name="${spec_path#$SPEC_PREFIX/}"
      spec_name="${spec_name%%/*}"
      if [ -n "$spec_name" ] && printf "%s" "$spec_name" | grep -Eq '^[0-9]{3}-'; then
        if [ -n "$DIFF_RANGE" ]; then
          history_changed="$(git -C "$PROJECT_ROOT" diff --name-only "$DIFF_RANGE" -- "$SPEC_PREFIX/$spec_name/history.md" 2>/dev/null || true)"
        else
          history_changed="$(git -C "$PROJECT_ROOT" diff --name-only -- "$SPEC_PREFIX/$spec_name/history.md" 2>/dev/null || true)"
        fi
        if [ -z "$history_changed" ]; then
          warn "Strict mode: $spec_name changed but history.md was not updated ($DIFF_SOURCE)."
        fi
      fi
    done <<EOF_CHANGED
$changed_specs
EOF_CHANGED
  else
    warn "Strict mode requested, but git repository is not available in the project root."
  fi

  # Gentle nudge, never a gate: a project with approved specs and an empty
  # decision log has already lost the "why" behind its own choices. This only
  # ever emits a WARNING — it must never fail the run on its own.
  # Approval rule KEPT IN SYNC with SDD_APPROVED_STATUS_ERE in
  # scripts/check-sdd-gate.sh and isApprovedStatus in packages/sdd-core:
  # only a backticked status value counts as a status.
  approved_specs=0
  if [ ${#spec_dirs[@]} -gt 0 ]; then
    for spec_path in "${spec_dirs[@]}"; do
      [ -f "$spec_path/spec.md" ] || continue
      status_line="$(grep -E -- "Estado / Status:" "$spec_path/spec.md" | head -n 1 || true)"
      status_value="$(sdd_extract_status_value "$status_line")"
      [ -n "$status_value" ] || continue
      if printf "%s" "$status_value" | grep -E -i -q -- 'aprobad[oa]|approved'; then
        approved_specs=$((approved_specs + 1))
      fi
    done
  fi

  if [ "$approved_specs" -gt 0 ] && [ -d "$ROOT/bitacora/decisiones" ]; then
    decision_count="$(find "$ROOT/bitacora/decisiones" -maxdepth 1 -type f -name '*.md' \
      ! -name 'README.md' 2>/dev/null | wc -l | tr -d ' ')"
    if [ "${decision_count:-0}" -eq 0 ]; then
      warn "Strict mode: $approved_specs approved spec(s) but bitacora/decisiones/ has no decision records. Run /sdd:decision to capture why the important choices were made. Suggestion only, never a gate."
    else
      ok "Decision log: $decision_count record(s) in bitacora/decisiones/."
    fi
  fi
fi

printf "\nSummary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi
