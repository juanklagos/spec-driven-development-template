#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Uso: $0 /ruta/del-proyecto [asistente]"
  echo "Ejemplo: $0 /tmp/mi-proyecto codex"
  exit 1
fi

TARGET="$1"
ASSISTANT="${2:-codex}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

"$SCRIPT_DIR/init-project.sh" "$TARGET"

cd "$TARGET"

if command -v specify >/dev/null 2>&1; then
  specify init . --ai "$ASSISTANT" --force
else
  uvx --from git+https://github.com/github/spec-kit.git specify init . --ai "$ASSISTANT" --force
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
MSG
