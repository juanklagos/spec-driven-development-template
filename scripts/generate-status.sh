#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

ROOT="$(sdd_resolve_root "$PWD" || sdd_resolve_root "$SCRIPT_DIR/.." || true)"
if [ -z "$ROOT" ]; then
  echo "Error: could not resolve SDD root."
  exit 1
fi

OUT="$ROOT/STATUS.md"
INDEX="$ROOT/specs/INDEX.md"

if [ ! -f "$INDEX" ]; then
  echo "Missing specs/INDEX.md"
  exit 1
fi

active_rows=""
all_rows=""

while IFS='|' read -r _ number name status priority owner updated _; do
  number="$(echo "$number" | xargs)"
  name="$(echo "$name" | xargs)"
  status="$(echo "$status" | xargs)"
  priority="$(echo "$priority" | xargs)"
  owner="$(echo "$owner" | xargs)"
  updated="$(echo "$updated" | xargs)"

  if [[ "$number" =~ ^[0-9]{3}$ ]]; then
    row="| $number | $name | $status | $priority | $owner | $updated |"
    all_rows+="$row\n"
    if echo "$status" | rg -qi "in progress|en progreso|ready|listo|active|activo"; then
      active_rows+="$row\n"
    fi
  fi
done < "$INDEX"

if [ -z "$active_rows" ]; then
  active_rows="| - | - | - | - | - | - |\n"
fi

pending_total=0
completed_total=0
while IFS= read -r task_file; do
  p=$(rg -c "^- \[ \]" "$task_file" || true)
  c=$(rg -c "^- \[[xX]\]" "$task_file" || true)
  pending_total=$((pending_total + p))
  completed_total=$((completed_total + c))
done < <(find "$ROOT/specs" -mindepth 2 -maxdepth 2 -type f -name tasks.md | sort)

last_log="No entries"
if [ -f "$ROOT/bitacora/global/PROJECT_LOG.md" ]; then
  last_log=$(tail -n 8 "$ROOT/bitacora/global/PROJECT_LOG.md" | sed 's/^/  /')
fi

cat > "$OUT" <<EOF2
# Status Dashboard / Tablero de estado

Generated at / Generado en: $(date -u +"%Y-%m-%d %H:%M UTC")

## Active specs / Specs activas

| Number | Name | Status | Priority | Owner | Updated |
|---|---|---|---|---|---|
$(printf "%b" "$active_rows")

## All specs snapshot / Resumen de todas las specs

| Number | Name | Status | Priority | Owner | Updated |
|---|---|---|---|---|---|
$(printf "%b" "$all_rows")

## Task progress / Progreso de tareas

- Pending / Pendientes: $pending_total
- Completed / Completadas: $completed_total

## Recent log excerpt / Extracto reciente de bitácora

\`\`\`text
$last_log
\`\`\`
EOF2

echo "Generated $(sdd_rel_from "$(sdd_project_root "$ROOT")" "$OUT")"
