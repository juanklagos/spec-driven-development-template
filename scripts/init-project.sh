#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Uso: $0 /ruta/del-nuevo-proyecto [--profile=minimal|full]"
  echo "Ejemplo: $0 /tmp/mi-proyecto"
  echo "Ejemplo: $0 /tmp/mi-proyecto --profile=full"
  exit 1
fi

TARGET="$1"
PROFILE="minimal"
if [ "${2:-}" != "" ]; then
  case "$2" in
    --profile=minimal) PROFILE="minimal" ;;
    --profile=full) PROFILE="full" ;;
    *)
      echo "Error: perfil no soportado: $2"
      echo "Usa --profile=minimal o --profile=full"
      exit 1
      ;;
  esac
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

mkdir -p "$TARGET/idea" \
         "$TARGET/specs/_template/contracts" \
         "$TARGET/bitacora/global" \
         "$TARGET/bitacora/diaria" \
         "$TARGET/bitacora/handoffs" \
         "$TARGET/bitacora/decisiones" \
         "$TARGET/bitacora/templates" \
         "$TARGET/template-context/core-instructions" \
         "$TARGET/scripts" \
         "$TARGET/.github/workflows"

cp -n "$ROOT_DIR/sdd.policy.yaml" "$TARGET/sdd.policy.yaml"
cp -n "$ROOT_DIR/INSTRUCTIONS.md" "$TARGET/INSTRUCTIONS.md"
cp -n "$ROOT_DIR/idea/IDEA_GENERAL.md" "$TARGET/idea/IDEA_GENERAL.md"
cp -n "$ROOT_DIR/specs/README.md" "$TARGET/specs/README.md"
cp -n "$ROOT_DIR/specs/INDEX.md" "$TARGET/specs/INDEX.md"
cp -n "$ROOT_DIR/specs/_template/spec.md" "$TARGET/specs/_template/spec.md"
cp -n "$ROOT_DIR/specs/_template/plan.md" "$TARGET/specs/_template/plan.md"
cp -n "$ROOT_DIR/specs/_template/tasks.md" "$TARGET/specs/_template/tasks.md"
cp -n "$ROOT_DIR/specs/_template/research.md" "$TARGET/specs/_template/research.md"
cp -n "$ROOT_DIR/specs/_template/history.md" "$TARGET/specs/_template/history.md"
cp -n "$ROOT_DIR/specs/_template/contracts/README.md" "$TARGET/specs/_template/contracts/README.md"
cp -n "$ROOT_DIR/bitacora/README.md" "$TARGET/bitacora/README.md"
cp -n "$ROOT_DIR/bitacora/global/PROJECT_LOG.md" "$TARGET/bitacora/global/PROJECT_LOG.md"
cp -n "$ROOT_DIR/bitacora/templates/DAILY_TEMPLATE.md" "$TARGET/bitacora/templates/DAILY_TEMPLATE.md"
cp -n "$ROOT_DIR/bitacora/templates/HANDOFF_TEMPLATE.md" "$TARGET/bitacora/templates/HANDOFF_TEMPLATE.md"
cp -n "$ROOT_DIR/bitacora/templates/DECISION_TEMPLATE.md" "$TARGET/bitacora/templates/DECISION_TEMPLATE.md"
mkdir -p "$TARGET/template-context"
cp -n "$ROOT_DIR/template-context/README.md" "$TARGET/template-context/README.md"
cp -n "$ROOT_DIR/template-context/05-SDD-EXECUTION-GATE.md" "$TARGET/template-context/05-SDD-EXECUTION-GATE.md"
cp -n "$ROOT_DIR/template-context/06-AI-RULES-MATRIX.md" "$TARGET/template-context/06-AI-RULES-MATRIX.md"
cp -n "$ROOT_DIR/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md" "$TARGET/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md"
cp -n "$ROOT_DIR/AGENTS.md" "$TARGET/AGENTS.md"
cp -n "$ROOT_DIR/AI_START_HERE.md" "$TARGET/AI_START_HERE.md"
cp -n "$ROOT_DIR/QUICKSTART.md" "$TARGET/QUICKSTART.md"
cp -n "$ROOT_DIR/START_HERE_NON_TECH.md" "$TARGET/START_HERE_NON_TECH.md"
cp -n "$ROOT_DIR/.cursorrules" "$TARGET/.cursorrules"
cp -n "$ROOT_DIR/.clauderules" "$TARGET/.clauderules"
cp -n "$ROOT_DIR/CLAUDE.md" "$TARGET/CLAUDE.md"
cp -n "$ROOT_DIR/GEMINI.md" "$TARGET/GEMINI.md"
cp -n "$ROOT_DIR/WINDSURF.md" "$TARGET/WINDSURF.md"
cp -n "$ROOT_DIR/AIDER.md" "$TARGET/AIDER.md"
cp -n "$ROOT_DIR/ROO.md" "$TARGET/ROO.md"
cp -n "$ROOT_DIR/.github/copilot-instructions.md" "$TARGET/.github/copilot-instructions.md"
cp -n "$ROOT_DIR/scripts/validate-sdd.sh" "$TARGET/scripts/validate-sdd.sh"
cp -n "$ROOT_DIR/scripts/check-sdd-policy.sh" "$TARGET/scripts/check-sdd-policy.sh"
cp -n "$ROOT_DIR/scripts/check-sdd-gate.sh" "$TARGET/scripts/check-sdd-gate.sh"
cp -n "$ROOT_DIR/scripts/new-spec.sh" "$TARGET/scripts/new-spec.sh"
chmod +x "$TARGET/scripts/validate-sdd.sh"
chmod +x "$TARGET/scripts/check-sdd-policy.sh"
chmod +x "$TARGET/scripts/check-sdd-gate.sh"
chmod +x "$TARGET/scripts/new-spec.sh"

if [ "$PROFILE" = "full" ]; then
  mkdir -p "$TARGET/playbooks" \
           "$TARGET/quality/evidence/templates" \
           "$TARGET/template-context/prompts"
  cp -R "$ROOT_DIR/templates" "$TARGET/templates"
  cp -R "$ROOT_DIR/template-context/." "$TARGET/template-context/"
  cp -R "$ROOT_DIR/playbooks/." "$TARGET/playbooks/"
  cp -R "$ROOT_DIR/quality/." "$TARGET/quality/"
  cp -n "$ROOT_DIR/scripts/score-spec.sh" "$TARGET/scripts/score-spec.sh"
  cp -n "$ROOT_DIR/scripts/generate-roadmap.sh" "$TARGET/scripts/generate-roadmap.sh"
  cp -n "$ROOT_DIR/scripts/generate-status.sh" "$TARGET/scripts/generate-status.sh"
  cp -n "$ROOT_DIR/scripts/legacy-discovery.sh" "$TARGET/scripts/legacy-discovery.sh"
  chmod +x "$TARGET/scripts/score-spec.sh" \
           "$TARGET/scripts/generate-roadmap.sh" \
           "$TARGET/scripts/generate-status.sh" \
           "$TARGET/scripts/legacy-discovery.sh"
fi

cat <<MSG
🎉 Project initialized at / Proyecto inicializado en: $TARGET
Profile / Perfil: $PROFILE

Next steps / Siguientes pasos:
  1) Fill idea/IDEA_GENERAL.md / Completa idea/IDEA_GENERAL.md
  2) Create first spec / Crea la primera spec:
     ./scripts/new-spec.sh "feature-name" "Owner"
  3) Log your first session / Registra tu primera sesión:
     bitacora/global/PROJECT_LOG.md
  4) Validate / Valida:
     ./scripts/validate-sdd.sh . --strict
  5) Check SDD policy / Verifica política SDD:
     ./scripts/check-sdd-policy.sh .
  6) Check SDD gate / Verifica compuerta SDD:
     ./scripts/check-sdd-gate.sh .
  7) Optional (full profile) / Opcional (perfil full): generate status and roadmap:
     ./scripts/generate-status.sh && ./scripts/generate-roadmap.sh

📖 Read QUICKSTART.md for a guided walkthrough and Spec Kit-first setup.
   Lee QUICKSTART.md para un recorrido guiado.
MSG
