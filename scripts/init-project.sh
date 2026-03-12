#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 /ruta/del-nuevo-proyecto"
  exit 1
fi

TARGET="$1"

mkdir -p "$TARGET/idea" \
         "$TARGET/specs/_template/contracts" \
         "$TARGET/bitacora/global" \
         "$TARGET/bitacora/diaria" \
         "$TARGET/bitacora/handoffs" \
         "$TARGET/bitacora/decisiones" \
         "$TARGET/bitacora/templates"

cp -n idea/IDEA_GENERAL.md "$TARGET/idea/IDEA_GENERAL.md"
cp -n specs/README.md "$TARGET/specs/README.md"
cp -n specs/INDEX.md "$TARGET/specs/INDEX.md"
cp -n specs/_template/spec.md "$TARGET/specs/_template/spec.md"
cp -n specs/_template/plan.md "$TARGET/specs/_template/plan.md"
cp -n specs/_template/tasks.md "$TARGET/specs/_template/tasks.md"
cp -n specs/_template/research.md "$TARGET/specs/_template/research.md"
cp -n specs/_template/contracts/README.md "$TARGET/specs/_template/contracts/README.md"
cp -n bitacora/README.md "$TARGET/bitacora/README.md"
cp -n bitacora/global/PROJECT_LOG.md "$TARGET/bitacora/global/PROJECT_LOG.md"
cp -n bitacora/templates/DAILY_TEMPLATE.md "$TARGET/bitacora/templates/DAILY_TEMPLATE.md"
cp -n bitacora/templates/HANDOFF_TEMPLATE.md "$TARGET/bitacora/templates/HANDOFF_TEMPLATE.md"
cp -n bitacora/templates/DECISION_TEMPLATE.md "$TARGET/bitacora/templates/DECISION_TEMPLATE.md"

cat <<MSG
Proyecto inicializado en: $TARGET

Siguientes pasos:
1) Completa idea/IDEA_GENERAL.md
2) Crea la primera especificación en specs/001-nombre/
3) Registra la primera entrada en bitacora/global/PROJECT_LOG.md
MSG
