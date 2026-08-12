#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

usage() {
  echo "Usage: $0 [--spec <NNN-slug>] \"consent summary\""
  echo "Example: $0 --spec 001-auth \"User approved implementation for spec 001-auth\""
  echo "Example: $0 \"User approved implementation for spec 001-auth\"   # spec id auto-detected"
}

SPEC_ID=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    --spec)
      SPEC_ID="${2-}"
      if [ -z "$SPEC_ID" ]; then
        echo "Error: --spec needs a spec id (NNN-slug)."
        usage
        exit 1
      fi
      shift 2
      ;;
    --spec=*)
      SPEC_ID="${1#--spec=}"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      break
      ;;
  esac
done

if [ "$#" -lt 1 ]; then
  usage
  exit 1
fi

SUMMARY="$*"

# Consent is recorded PER SPEC. The log used to be free text and the gate only
# checked that it was non-empty, so one consent line opened the gate for every
# spec approved afterwards — including specs the user had never seen (verified
# 2026-07-21). A `[spec:<id>]` marker is what makes a line machine-parseable.
# KEEP IN SYNC with recordUserConsent in packages/sdd-core/src/index.ts and the
# consent block in scripts/check-sdd-gate.sh.
SPEC_ID_EXPLICIT=1
if [ -z "$SPEC_ID" ]; then
  SPEC_ID_EXPLICIT=0
  SPEC_ID="$(printf "%s" "$SUMMARY" \
    | grep -o -E '(^|[^a-zA-Z0-9-])[0-9]{3}-[a-z0-9][a-z0-9-]*' \
    | head -n 1 \
    | sed -E 's/^[^0-9]*//' || true)"
fi

STAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"
SDD_ROOT="$(sdd_require_local_root "$SCRIPT_DIR/..")" || exit 1

PROJECT_ROOT="$(sdd_project_root "$SDD_ROOT")"

mkdir -p "$SDD_ROOT/.sdd"
LOG_FILE="$SDD_ROOT/.sdd/user-consent.log"

if [ -n "$SPEC_ID" ] && [ ! -d "$SDD_ROOT/specs/$SPEC_ID" ]; then
  if [ "$SPEC_ID_EXPLICIT" -eq 1 ]; then
    echo "Error: no such spec in this workspace: specs/$SPEC_ID"
    echo "EN: record consent against a spec that exists, or omit --spec."
    echo "ES: registra el consentimiento sobre una spec que exista, u omite --spec."
    exit 1
  fi
  # Only guessed from the summary text; never turn a guess into a failure.
  SPEC_ID=""
fi

if [ -n "$SPEC_ID" ]; then
  echo "[$STAMP] [spec:$SPEC_ID] $SUMMARY" >> "$LOG_FILE"
  echo "✅ User consent recorded for $SPEC_ID in: $(sdd_rel_from "$PROJECT_ROOT" "$LOG_FILE")"
else
  echo "[$STAMP] $SUMMARY" >> "$LOG_FILE"
  echo "✅ User consent recorded in: $(sdd_rel_from "$PROJECT_ROOT" "$LOG_FILE")"
  echo "⚠️  No spec id in this entry. The gate can only treat it as a legacy,"
  echo "    workspace-wide record. Prefer: $0 --spec <NNN-slug> \"...\""
fi
