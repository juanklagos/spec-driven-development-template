#!/usr/bin/env bash
# Keeps the license surface from drifting again.
#
# The 2026-07-21 relicense touched LICENSE, NOTICE, TEMPLATE-OUTPUT.md, eight
# manifests, three package copies and the README badges. Getting one of them
# wrong is silent: npm reads package.json, GitHub reads the root LICENSE, and
# corporate scanners read the tarball. They can disagree for months.
#
# Ships warn-only on purpose. An error-severity check with no bypass, written by
# the only maintainer, gets commented out the first time it goes red on a
# deadline. Pass --strict (or set SDD_LICENSE_STRICT=1) to make findings fail.
#
# Usage: ./scripts/check-license-surface.sh [project_root] [--strict]

set -uo pipefail

PROJECT_ROOT="."
STRICT="${SDD_LICENSE_STRICT:-0}"
for arg in "$@"; do
  case "$arg" in
    --strict) STRICT=1 ;;
    *) PROJECT_ROOT="$arg" ;;
  esac
done
cd "$PROJECT_ROOT" || { echo "No such directory: $PROJECT_ROOT" >&2; exit 2; }

EXPECTED_SPDX="MIT"
# The one sentence that proves the file is really MIT and not a stub.
MIT_MARKER="Permission is hereby granted, free of charge"
COPYRIGHT_HOLDER="Juan Carlos Alvarez Lagos"
# Terms that must never reappear on a declaration surface.
STALE_TERM="polyform"

ERRORS=0
WARNINGS=0
fail() { printf "  ✗ %s\n" "$1"; ERRORS=$((ERRORS + 1)); }
warn() { printf "  ! %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }
pass() { printf "  ✓ %s\n" "$1"; }

echo "SDD license surface check"
echo

# ---------------------------------------------------------------- root LICENSE
echo "Root license file"
ROOT_LICENSES="$(find . -maxdepth 1 -name 'LICENSE*' -type f | sort)"
ROOT_COUNT="$(printf "%s" "$ROOT_LICENSES" | grep -c . || true)"
if [ "$ROOT_COUNT" -eq 0 ]; then
  fail "no LICENSE file at the repository root — GitHub will report NOASSERTION"
elif [ "$ROOT_COUNT" -gt 1 ]; then
  fail "$ROOT_COUNT files match LICENSE* at the root; GitHub cannot pick one:"
  printf "%s\n" "$ROOT_LICENSES" | sed 's/^/      /'
else
  pass "exactly one root LICENSE"
fi

if [ -f LICENSE ]; then
  grep -q "$MIT_MARKER" LICENSE \
    && pass "root LICENSE carries the MIT permission notice" \
    || fail "root LICENSE does not contain the MIT permission notice"
  grep -q "$COPYRIGHT_HOLDER" LICENSE \
    && pass "root LICENSE names the copyright holder" \
    || fail "root LICENSE does not name '$COPYRIGHT_HOLDER'"
fi

# ------------------------------------------------------- package license copies
echo
echo "Package license copies"
# Derived at runtime, never hardcoded: a new package must not silently escape.
PUBLISHABLE="$(git ls-files 'packages/*/package.json' 2>/dev/null | grep -v node_modules || true)"
if [ -z "$PUBLISHABLE" ]; then
  warn "no packages/*/package.json tracked by git — skipping package checks"
fi

for manifest in $PUBLISHABLE; do
  dir="$(dirname "$manifest")"
  private="$(node -p "require('./$manifest').private === true" 2>/dev/null || echo false)"
  [ "$private" = "true" ] && continue

  for want in LICENSE NOTICE TEMPLATE-OUTPUT.md; do
    if [ ! -f "$dir/$want" ]; then
      fail "$dir/$want is missing on disk (npm pack silently ignores files[] entries that do not exist)"
      continue
    fi
    if [ "$want" = "LICENSE" ] && [ -f LICENSE ]; then
      cmp -s LICENSE "$dir/LICENSE" \
        && pass "$dir/LICENSE is byte-identical to the root" \
        || fail "$dir/LICENSE differs from the root LICENSE"
    fi
  done

  # files[] must actually list them, or they never reach the tarball.
  for want in LICENSE NOTICE TEMPLATE-OUTPUT.md; do
    listed="$(node -p "((require('./$manifest').files)||[]).includes('$want')" 2>/dev/null || echo false)"
    [ "$listed" = "true" ] \
      && pass "$manifest files[] lists $want" \
      || fail "$manifest files[] does not list $want — it will not ship"
  done
done

# --------------------------------------------------------------- SPDX declared
echo
echo "Declared license"
MANIFESTS="$(git ls-files '*package.json' '.claude-plugin/*.json' 2>/dev/null | grep -v node_modules || true)"
for manifest in $MANIFESTS; do
  declared="$(node -p "require('./$manifest').license || ''" 2>/dev/null || echo '')"
  if [ -z "$declared" ]; then
    # Nested manifests (marketplace entries) declare it one level down.
    nested="$(node -p "JSON.stringify(require('./$manifest')).includes('\"license\":\"$EXPECTED_SPDX\"')" 2>/dev/null || echo false)"
    [ "$nested" = "true" ] \
      && pass "$manifest declares $EXPECTED_SPDX (nested)" \
      || warn "$manifest has no license field"
  elif [ "$declared" = "$EXPECTED_SPDX" ]; then
    pass "$manifest declares $EXPECTED_SPDX"
  else
    fail "$manifest declares '$declared', expected '$EXPECTED_SPDX'"
  fi
done

# ------------------------------------------------------------------ stale terms
echo
echo "Stale license terms"
# Scoped to declaration surfaces only. Free prose is excluded on purpose: the
# decision record filename 2026-03-12-polyform-noncommercial-source-available.md
# must keep existing, and history must not be rewritten to please a grep.
SURFACES="LICENSE NOTICE TEMPLATE-OUTPUT.md README.md README.es.md"
SURFACES="$SURFACES $MANIFESTS $(git ls-files 'packages/*/server.json' 'packages/*/README.md' 2>/dev/null || true)"
STALE_HITS=""
for f in $SURFACES; do
  [ -f "$f" ] || continue
  if grep -qi "$STALE_TERM" "$f"; then
    STALE_HITS="$STALE_HITS $f"
  fi
done
if [ -n "$STALE_HITS" ]; then
  fail "'$STALE_TERM' still present on declaration surfaces:"
  for f in $STALE_HITS; do printf "      %s\n" "$f"; done
else
  pass "no stale license terms on declaration surfaces"
fi

# -------------------------------------------------------------------- versions
echo
echo "Version alignment"
ROOT_VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo '')"
for manifest in $PUBLISHABLE; do
  v="$(node -p "require('./$manifest').version" 2>/dev/null || echo '')"
  [ "$v" = "$ROOT_VERSION" ] \
    && pass "$manifest at $v" \
    || fail "$manifest at '$v', root package.json at '$ROOT_VERSION'"
done
if [ -f packages/sdd-mcp/server.json ]; then
  sv="$(node -p "require('./packages/sdd-mcp/server.json').version" 2>/dev/null || echo '')"
  [ "$sv" = "$ROOT_VERSION" ] \
    && pass "server.json at $sv (MCP Registry entry)" \
    || fail "server.json at '$sv' but the packages are at '$ROOT_VERSION' — the Registry would advertise the wrong version"
fi

# ---------------------------------------------------------------------- verdict
echo
echo "License surface summary: $ERRORS finding(s), $WARNINGS warning(s)."
if [ "$ERRORS" -gt 0 ]; then
  if [ "$STRICT" = "1" ]; then
    echo "Strict mode: failing."
    exit 1
  fi
  echo "Advisory mode: not failing the build. Run with --strict once the findings are clear."
fi
exit 0
