#!/usr/bin/env bash
set -euo pipefail

# Reset the SDD template to a clean state for a new project.
# Usage: ./scripts/reset-template.sh [--confirm]
#
# EN: Removes example content and resets all template files to blank state.
# ES: Elimina contenido de ejemplo y restablece todos los archivos del template a estado limpio.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ "${1:-}" != "--confirm" ]; then
  cat <<MSG
⚠️  This will reset the template to a clean state:

  - Clear idea/IDEA_GENERAL.md (keep structure, remove content)
  - Clear bitacora/global/PROJECT_LOG.md (keep format only)
  - Clear specs/INDEX.md (keep header, remove entries)
  - Clear STATUS.md (keep template format)
  - Remove any numbered spec folders in specs/ (001-*, 002-*, etc.)
  - Remove analysis/ output files

  Files in examples/, docs/, and scripts/ will NOT be touched.

To confirm, run:
  ./scripts/reset-template.sh --confirm

MSG
  exit 0
fi

echo "🔄 Resetting SDD template to clean state..."

# Reset IDEA_GENERAL.md to template-only version
cat > "$ROOT/idea/IDEA_GENERAL.md" <<'IDEA'
# 🎯 General Project Idea / Idea general del proyecto

> [!IMPORTANT]
> **EN:** This file is the foundation of your project. Before writing any code or detailed specs, define the "What" and "Why" here.
> **ES:** Este archivo es la base de tu proyecto. Antes de escribir código o especificaciones detalladas, define el "¿Qué?" y el "¿Por qué?" aquí.

---

## 💎 Project Name / Nombre del proyecto
<!-- EN: Name of the application or service. -->
<!-- ES: Nombre de la aplicación o servicio. -->

## 🧩 Problem to solve / Problema que se quiere resolver
<!-- EN: Describe the current pain point or gap you are addressing. -->
<!-- ES: Describe el problema actual o la brecha que intentas resolver. -->

## 🚀 Main Goal / Objetivo principal
<!-- EN: What is the single most important outcome of this project? -->
<!-- ES: ¿Cuál es el resultado más importante que busca este proyecto? -->

## 📏 Initial Scope / Alcance inicial (MVP)
<!-- EN: List the core features for the first version. -->
<!-- ES: Lista las características principales para la primera versión. -->
- 

## 🚫 Out of Scope / Fuera de alcance
<!-- EN: What will NOT be built in this phase? (Crucial for avoiding scope creep). -->
<!-- ES: ¿Qué NO se construirá en esta fase? (Crucial para evitar que el alcance crezca sin control). -->
- 

## 👤 Target Users / Usuarios objetivo
<!-- EN: Who are you building this for? -->
<!-- ES: ¿Para quién estás construyendo esto? -->

## ⚠️ Main Risks & Assumptions / Riesgos y Supuestos principales
<!-- EN: Technical or business hurdles you expect to face. -->
<!-- ES: Obstáculos técnicos o de negocio que esperas encontrar. -->
- 

## 📈 Success Metrics / Métricas de éxito
<!-- EN: How will you know the project is successful? (e.g., users, performance, specific behavior). -->
<!-- ES: ¿Cómo sabrás si el proyecto es exitoso? (ej. usuarios, rendimiento, comportamiento específico). -->

## ✅ Global Completion Criteria / Criterio de terminado global
<!-- EN: What needs to happen to call this project "finished"? -->
<!-- ES: ¿Qué debe suceder para considerar este proyecto como "terminado"? -->

---
*Created using the [Spec-Driven Development Template](https://github.com/juanklagos/spec-driven-development-template)*
IDEA

echo "  ✅ Reset idea/IDEA_GENERAL.md"

# Reset PROJECT_LOG.md
cat > "$ROOT/bitacora/global/PROJECT_LOG.md" <<'LOG'
# Project log / Registro general del proyecto

## Entry format / Formato de entrada

### [YYYY-MM-DD HH:MM] Session N / Sesión N
- **Goal / Objetivo:**
- **Work completed / Trabajo realizado:**
- **Decisions made / Decisiones tomadas:**
- **Blockers / Bloqueos:**
- **Next step / Próximo paso:**
- **Owner / Responsable:**
LOG

echo "  ✅ Reset bitacora/global/PROJECT_LOG.md"

# Reset specs/INDEX.md
cat > "$ROOT/specs/INDEX.md" <<'INDEX'
# Specification Index / Índice de especificaciones

| Number / Número | Name / Nombre | Status / Estado | Priority / Prioridad | Owner / Responsable | Updated / Actualización |
|---|---|---|---|---|---|
INDEX

echo "  ✅ Reset specs/INDEX.md"

# Remove numbered spec directories
for spec_dir in "$ROOT"/specs/[0-9][0-9][0-9]-*/; do
  if [ -d "$spec_dir" ]; then
    rm -rf "$spec_dir"
    echo "  🗑️  Removed $(basename "$spec_dir")"
  fi
done

# Clear analysis outputs
if [ -d "$ROOT/analysis/legacy-discovery" ]; then
  rm -rf "$ROOT/analysis/legacy-discovery"/*
  echo "  ✅ Cleared analysis/legacy-discovery/"
fi

# Reset STATUS.md
cat > "$ROOT/STATUS.md" <<'STATUS'
# Status Dashboard / Tablero de estado

> Run `./scripts/generate-status.sh` to populate this dashboard.

## Active specs / Specs activas

| Number | Name | Status | Priority | Owner | Updated |
|---|---|---|---|---|---|

## Task progress / Progreso de tareas

- Pending / Pendientes: 0
- Completed / Completadas: 0
STATUS

echo "  ✅ Reset STATUS.md"

echo ""
echo "🎉 Template reset complete! / ¡Template reiniciado!"
echo ""
echo "Next steps / Próximos pasos:"
echo "  1) Fill idea/IDEA_GENERAL.md with your project vision"
echo "  2) Create your first spec: ./scripts/new-spec.sh \"feature\" \"Owner\""
echo "  3) Log your first session in bitacora/global/PROJECT_LOG.md"
echo "  4) Validate: ./scripts/validate-sdd.sh . --strict"
