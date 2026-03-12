#!/usr/bin/env bash
set -euo pipefail

INDEX_FILE="specs/INDEX.md"
OUT_MERMAID="docs/roadmap.mmd"
OUT_MARKDOWN="docs/roadmap.md"

if [ ! -f "$INDEX_FILE" ]; then
  echo "Missing $INDEX_FILE"
  exit 1
fi

mkdir -p docs

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

echo "Generated $OUT_MERMAID and $OUT_MARKDOWN"
