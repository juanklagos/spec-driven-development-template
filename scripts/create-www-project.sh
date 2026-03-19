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

if [ "${PROFILE#--profile=}" = "full" ]; then
  if [ "$USE_SPEC_KIT" = "no" ]; then
    "$SCRIPT_DIR/init-project.sh" "$TARGET" "$PROFILE"
  else
    if "$SCRIPT_DIR/init-project-with-spec-kit.sh" "$TARGET" "$ASSISTANT" "$PROFILE"; then
      :
    else
      echo "[WARN] Spec Kit init failed. Falling back to plain full template init."
      "$SCRIPT_DIR/init-project.sh" "$TARGET" "$PROFILE"
    fi
  fi
else
  "$SCRIPT_DIR/install-spec-sidecar.sh" "$TARGET" "$PROFILE"

  if [ "$USE_SPEC_KIT" = "yes" ]; then
    (
      cd "$TARGET"
      if command -v specify >/dev/null 2>&1; then
        specify init . --ai "$ASSISTANT" --force
      elif command -v uv >/dev/null 2>&1; then
        uv tool install specify-cli --from git+https://github.com/github/spec-kit.git >/dev/null
        if command -v specify >/dev/null 2>&1; then
          specify init . --ai "$ASSISTANT" --force
        else
          uvx --from git+https://github.com/github/spec-kit.git specify init . --ai "$ASSISTANT" --force
        fi
      elif command -v uvx >/dev/null 2>&1; then
        uvx --from git+https://github.com/github/spec-kit.git specify init . --ai "$ASSISTANT" --force
      else
        echo "[WARN] Spec Kit was requested, but neither 'specify', 'uv', nor 'uvx' were found."
      fi
    )
  else
    :
  fi
fi

cat <<MSG

✅ Project workspace created at:
   $TARGET
Profile:
   ${PROFILE#--profile=}

EN:
- Work in this project root.
- Keep SDD artifacts in ./spec/ unless you explicitly chose the full template mode.
- Keep template root for framework maintenance only.

ES:
- Trabaja en la raíz de este proyecto.
- Mantén los artefactos SDD dentro de ./spec/ salvo que hayas elegido el modo full.
- Mantén la raíz del template solo para mantenimiento del framework.

Next / Siguiente:
  cd "$TARGET"
  ./spec/scripts/new-spec.sh "first-feature" "Owner"
  # Record consent only right before implementation starts:
  ./spec/scripts/confirm-user-consent.sh "User approved implementation for spec 001"
  ./spec/scripts/validate-sdd.sh . --strict
  ./spec/scripts/check-sdd-policy.sh .
  ./spec/scripts/check-sdd-gate.sh .
MSG
