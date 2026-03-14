#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
STRICT="${2:-}"

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
  if "$ROOT/scripts/check-sdd-policy.sh" "$ROOT"; then
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
  if command -v git >/dev/null 2>&1 && [ -d "$ROOT/.git" ]; then
    while IFS= read -r spec_path; do
      spec_name="${spec_path#specs/}"
      spec_name="${spec_name%%/*}"
      if [ -n "$spec_name" ] && [[ "$spec_name" =~ ^[0-9]{3}- ]]; then
        if ! git -C "$ROOT" diff --name-only -- "specs/$spec_name/history.md" | grep -q .; then
          warn "Strict mode: $spec_name changed but history.md was not updated in working tree."
        fi
      fi
    done < <(git -C "$ROOT" diff --name-only -- 'specs/*' | grep -Ev 'specs/.*/history\.md$' || true)
  else
    warn "Strict mode requested, but git repository is not available in root."
  fi
fi

printf "\nSummary: %d error(s), %d warning(s).\n" "$errors" "$warnings"

if [ "$errors" -gt 0 ]; then
  exit 1
fi
