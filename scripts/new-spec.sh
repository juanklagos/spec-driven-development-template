#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/lib/sdd-root.sh"

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 \"feature-name\" [owner]"
  echo "Example: $0 \"authentication-baseline\" \"Team / Equipo\""
  exit 1
fi

SDD_ROOT="$(sdd_require_local_root "$SCRIPT_DIR/..")" || exit 1

PROJECT_ROOT="$(sdd_project_root "$SDD_ROOT")"

# Block spec creation in template root to avoid mixing framework and runnable project work.
if [ -f "$SDD_ROOT/sdd.policy.yaml" ] && [ -f "$SDD_ROOT/scripts/create-www-project.sh" ] && [ -d "$SDD_ROOT/www" ]; then
  echo "Error: refusing to create spec in template root."
  echo "Create/use a target project under www/<project-name>/ or install a spec sidecar in an external target path first."
  exit 1
fi

NAME_RAW="$1"
OWNER="${2:-TBD / Por definir}"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

NAME_SLUG="$(slugify "$NAME_RAW")"
if [ -z "$NAME_SLUG" ]; then
  echo "Error: invalid feature name after slugify"
  exit 1
fi

# Everything from here to the INDEX.md append is one allocation: scan, claim
# the directory, write the row. Two processes must not interleave inside it.
#
# The scan alone cannot be made safe: two simultaneous runs with different
# feature names both read the same max and both create `NNN-<their-slug>` —
# different directory names, so neither `mkdir` nor the existence check below
# catches it (verified 2026-07-21: 5/5 trials produced two `001-` bundles).
# The on-disk lock directory is the fix, and packages/sdd-core's reserveSpecDir
# contends for the very same one, so the script and the server also serialize
# against each other.
SPECS_DIR="$SDD_ROOT/specs"
SPECS_LOCK="$SPECS_DIR/.lock"
mkdir -p "$SPECS_DIR"
sdd_acquire_lock "$SPECS_LOCK" || exit 1
trap 'sdd_release_lock "$SPECS_LOCK"' EXIT INT TERM

# Next number = highest three-digit prefix on disk + 1.
# KEEP IN SYNC with nextSpecNumber() in packages/sdd-core/src/index.ts: this
# script and sdd_create_spec / POST /api/spec are the two supported ways to
# create a spec, so they must allocate the same id.
NEXT_NUM="$(find "$SDD_ROOT/specs" -mindepth 1 -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' 2>/dev/null \
  | sed -E 's#.*/([0-9]{3})-.*#\1#' \
  | sort -n \
  | tail -n 1)"

if [ -z "$NEXT_NUM" ]; then
  NEXT_NUM="001"
else
  NEXT_NUM=$(printf "%03d" $((10#$NEXT_NUM + 1)))
fi

SPEC_DIR="$SDD_ROOT/specs/${NEXT_NUM}-${NAME_SLUG}"
if [ -e "$SPEC_DIR" ]; then
  echo "Error: spec folder already exists: $SPEC_DIR"
  exit 1
fi

mkdir -p "$SPEC_DIR/contracts"
for f in spec.md plan.md tasks.md research.md history.md; do
  cp "$SDD_ROOT/specs/_template/$f" "$SPEC_DIR/$f"
done
cp "$SDD_ROOT/specs/_template/contracts/README.md" "$SPEC_DIR/contracts/README.md"

# Replace placeholder text when present.
for f in spec.md plan.md tasks.md research.md history.md; do
  sed -i.bak "s/\[Feature Name\]/$NAME_RAW/g" "$SPEC_DIR/$f" || true
  sed -i.bak "s/\[Spec Number\]/$NEXT_NUM/g" "$SPEC_DIR/$f" || true
  rm -f "$SPEC_DIR/$f.bak"
done

if [ ! -f "$SDD_ROOT/specs/INDEX.md" ]; then
  cat > "$SDD_ROOT/specs/INDEX.md" <<'INDEXEOF'
# Specification Index / Índice de especificaciones

| Number / Número | Name / Nombre | Status / Estado | Priority / Prioridad | Owner / Responsable | Updated / Actualización |
|---|---|---|---|---|---|
INDEXEOF
fi

TODAY="$(date +%F)"
NEW_ROW="| ${NEXT_NUM} | ${NAME_SLUG} | Draft / Borrador | Medium / Media | ${OWNER} | ${TODAY} |"
printf "%s\n" "$NEW_ROW" >> "$SDD_ROOT/specs/INDEX.md"

echo "Created: $(sdd_rel_from "$PROJECT_ROOT" "$SPEC_DIR")"
echo "Added row to $(sdd_rel_from "$PROJECT_ROOT" "$SDD_ROOT/specs/INDEX.md")"
