#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 4 ]; then
  echo "Usage: $0 <project-name> [assistant] [--no-spec-kit] [--minimal-template|--recommended-template|--full-template]"
  echo "Example: $0 my-app codex"
  echo "Example: $0 my-app codex --no-spec-kit"
  echo "Example: $0 my-app codex --recommended-template"
  echo "Example: $0 my-app codex --full-template"
  exit 1
fi

PROJECT_NAME="$1"
ASSISTANT="codex"
USE_SPEC_KIT="yes"
PROFILE="--profile=recommended"

shift
for arg in "$@"; do
  case "$arg" in
    --no-spec-kit)
      USE_SPEC_KIT="no"
      ;;
    --full-template)
      PROFILE="--profile=full"
      ;;
    --recommended-template)
      PROFILE="--profile=recommended"
      ;;
    --minimal-template)
      PROFILE="--profile=minimal"
      ;;
    *)
      ASSISTANT="$arg"
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

SLUG="$(slugify "$PROJECT_NAME")"
if [ -z "$SLUG" ]; then
  echo "Error: invalid project name"
  exit 1
fi

TARGET="$ROOT_DIR/www/$SLUG"
if [ -e "$TARGET" ]; then
  echo "Error: target already exists: $TARGET"
  exit 1
fi

mkdir -p "$ROOT_DIR/www"

if [ "$USE_SPEC_KIT" = "no" ]; then
  "$SCRIPT_DIR/init-project.sh" "$TARGET" "$PROFILE"
else
  if "$SCRIPT_DIR/init-project-with-spec-kit.sh" "$TARGET" "$ASSISTANT" "$PROFILE"; then
    :
  else
    echo "[WARN] Spec Kit init failed. Falling back to plain template init."
    "$SCRIPT_DIR/init-project.sh" "$TARGET" "$PROFILE"
  fi
fi

cat <<MSG

✅ Project workspace created at:
   $TARGET
Profile:
   ${PROFILE#--profile=}

EN:
- Work and implement inside this folder.
- Keep template root for framework maintenance only.

ES:
- Trabaja e implementa dentro de esta carpeta.
- Mantén la raíz del template solo para mantenimiento del framework.

Next / Siguiente:
  cd "$TARGET"
  ./scripts/validate-sdd.sh . --strict
  ./scripts/check-sdd-policy.sh .
  ./scripts/check-sdd-gate.sh .
MSG
