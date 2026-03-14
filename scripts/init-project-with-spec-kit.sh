#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 3 ]; then
  echo "Uso: $0 /ruta/del-proyecto [asistente] [--profile=minimal|recommended|full]"
  echo "Ejemplo: $0 /tmp/mi-proyecto codex"
  echo "Ejemplo: $0 /tmp/mi-proyecto codex --profile=recommended"
  echo "Ejemplo: $0 /tmp/mi-proyecto codex --profile=full"
  exit 1
fi

TARGET="$1"
ASSISTANT="codex"
PROFILE="--profile=minimal"

shift
for arg in "$@"; do
  case "$arg" in
    --profile=minimal|--profile=recommended|--profile=full)
      PROFILE="$arg"
      ;;
    *)
      ASSISTANT="$arg"
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

"$SCRIPT_DIR/init-project.sh" "$TARGET" "$PROFILE"

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
  echo "Error: Neither 'specify', 'uv', nor 'uvx' commands were found."
  echo "Please install uv (https://github.com/astral-sh/uv) or specify-cli first:"
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

cat <<MSG
Proyecto inicializado con plantilla + GitHub Spec Kit en: $TARGET

Siguiente flujo sugerido:
1) /speckit.constitution
2) /speckit.specify
3) /speckit.plan
4) /speckit.tasks
5) /speckit.implement
6) ./scripts/validate-sdd.sh . --strict
7) ./scripts/check-sdd-policy.sh .
8) ./scripts/check-sdd-gate.sh .
9) Optional: ./scripts/score-spec.sh --all && ./scripts/generate-status.sh
MSG
