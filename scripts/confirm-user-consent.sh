#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 \"consent summary\""
  echo "Example: $0 \"User approved implementation for spec 001-auth\""
  exit 1
fi

SUMMARY="$*"
STAMP="$(date '+%Y-%m-%d %H:%M:%S %z')"

mkdir -p .sdd
LOG_FILE=".sdd/user-consent.log"

echo "[$STAMP] $SUMMARY" >> "$LOG_FILE"

echo "✅ User consent recorded in: $LOG_FILE"
