#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 \"consent summary\""
  echo "Example: $0 \"User approved implementation for spec 001-auth\""
  exit 1
fi

SUMMARY="$*"
STAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"
SDD_ROOT="$(sdd_resolve_root "$PWD" || sdd_resolve_root "$SCRIPT_DIR/.." || true)"

if [ -z "$SDD_ROOT" ]; then
  echo "Error: could not resolve SDD root."
  exit 1
fi

PROJECT_ROOT="$(sdd_project_root "$SDD_ROOT")"

mkdir -p "$SDD_ROOT/.sdd"
LOG_FILE="$SDD_ROOT/.sdd/user-consent.log"

echo "[$STAMP] $SUMMARY" >> "$LOG_FILE"

echo "✅ User consent recorded in: $(sdd_rel_from "$PROJECT_ROOT" "$LOG_FILE")"
