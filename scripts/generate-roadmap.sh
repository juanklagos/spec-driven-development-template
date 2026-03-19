#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

ROOT="$(sdd_resolve_root "$PWD" || sdd_resolve_root "$SCRIPT_DIR/.." || true)"
if [ -z "$ROOT" ]; then
  echo "Error: could not resolve SDD root."
  exit 1
fi

INDEX_FILE="$ROOT/specs/INDEX.md"
OUT_MERMAID="$ROOT/docs/roadmap.mmd"
OUT_MARKDOWN="$ROOT/docs/roadmap.md"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Missing $INDEX_FILE"
  exit 1
fi

mkdir -p "$ROOT/docs"

echo "flowchart LR" > "$OUT_MERMAID"
echo "  START[\"Idea\"]" >> "$OUT_MERMAID"

prev="START"
rows=0

while IFS='|' read -r _ number name status priority owner updated _; do
  number="$(echo "$number" | xargs)"
  name="$(echo "$name" | xargs)"
  status="$(echo "$status" | xargs)"
  priority="$(echo "$priority" | xargs)"

  if [[ "$number" =~ ^[0-9]{3}$ ]]; then
    node="S${number}"
    label="${number} - ${name}\\n${status}\\n${priority}"
    echo "  ${node}[\"${label}\"]" >> "$OUT_MERMAID"
    echo "  ${prev} --> ${node}" >> "$OUT_MERMAID"
    prev="$node"
    rows=$((rows + 1))
  fi
done < "$INDEX_FILE"

cat > "$OUT_MARKDOWN" <<EOF2
# Project Roadmap / Hoja de ruta

This roadmap is auto-generated from specs/INDEX.md.

Este roadmap se genera automáticamente desde specs/INDEX.md.


auto-generated at: $(date -u +"%Y-%m-%d %H:%M UTC")


auto-detected specs: $rows


auto-diagram source: $OUT_MERMAID


auto-diagram preview:


auto-generated Mermaid:

\`\`\`mermaid
$(cat "$OUT_MERMAID")
\`\`\`
EOF2

echo "Generated $(sdd_rel_from "$(sdd_project_root "$ROOT")" "$OUT_MERMAID") and $(sdd_rel_from "$(sdd_project_root "$ROOT")" "$OUT_MARKDOWN")"
