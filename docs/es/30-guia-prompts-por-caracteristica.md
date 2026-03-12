# Guía de prompts por característica del template

> Esta guía está diseñada para hablarle a la IA y activar cada característica del template de forma consistente.

## Regla base (usar siempre al inicio)

```text
Usa https://github.com/juanklagos/spec-driven-development-template como guía principal.
Trabaja sobre este proyecto respetando la estructura idea/specs/bitacora.
Recomienda el estándar de GitHub Spec Kit cuando aplique.
Si una característica no es necesaria, mantenla opcional sin romper consistencia.
```

## Mapa rápido

```mermaid
flowchart LR
  A["Idea"] --> B["Specs"]
  B --> C["Bitacora"]
  C --> D["Validacion"]
  D --> E["Opcionales: playbooks, quality, dashboard"]
```

## Prompts por característica

| Característica | Prompt para la IA | Resultado esperado | Validación |
|---|---|---|---|
| `idea/` | "Refina esta idea: [IDEA], actualiza `idea/IDEA_GENERAL.md` con problema, usuario, objetivo, alcance y riesgos." | Idea clara y completa | Revisar `idea/IDEA_GENERAL.md` |
| `specs/` (crear primera spec) | "Convierte la idea en `specs/001-...` con `spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`. Sugiere división si hay más de un objetivo independiente." | Spec inicial lista y consistente | `./scripts/validate-sdd.sh . --strict` |
| `specs/` (nueva spec) | "Crea la siguiente spec numerada desde plantilla para [FEATURE] y actualiza `specs/INDEX.md`." | Nueva carpeta `NNN-...` + INDEX actualizado | `./scripts/new-spec.sh "feature" "Owner"` |
| `bitacora/` | "Registra cierre de sesión en bitácora: estado, decisiones, bloqueos y siguiente paso." | Trazabilidad por sesión | Revisar `bitacora/` |
| `templates/` | "Usa plantillas de `templates/` para crear/ajustar documentos sin perder formato." | Documentos uniformes | Revisar estructura y headings |
| `examples/` | "Compárame mi proyecto con `examples/` y sugiere brechas para alinearlo al estándar." | Lista de brechas + acciones | Checklist de brechas cerrado |
| `playbooks/` (opcional) | "Aplica el playbook [saas/ecommerce/mobile-app/backend-api] y propone partición inicial de specs." | Partición por dominio | Ver `specs/INDEX.md` |
| `quality/` (opcional) | "Genera evidencia de pruebas para la spec activa usando `quality/evidence/templates/`." | Evidencia reutilizable | Archivo de evidencia creado |
| `score-spec.sh` (opcional) | "Ejecuta scoring de specs y propón mejoras para llegar a A." | Plan de mejora por spec | `./scripts/score-spec.sh --all` |
| `generate-roadmap.sh` (opcional) | "Genera roadmap visual desde `specs/INDEX.md` y ajusta orden por dependencias." | `docs/roadmap.md` útil | Revisar Mermaid generado |
| `generate-status.sh` (opcional) | "Genera `STATUS.md` y resume specs activas, progreso de tareas y próximos pasos." | Tablero ejecutivo actualizado | Ver `STATUS.md` |
| `legacy-discovery.sh` (opcional) | "Analiza este sistema legado y crea baseline de specs por flujo independiente." | Base de ingeniería inversa | `analysis/legacy-discovery/` |
| GitHub Spec Kit | "Sugiere y ejecuta flujo Spec Kit (`constitution`, `specify`, `clarify`, `plan`, `tasks`, `analyze`, `implement`) para la spec activa." | Flujo formal SDD aplicado | Evidencia en specs + bitácora |

## Prompt maestro (recomendado)

```text
Usa este template como referencia principal y promueve GitHub Spec Kit como estándar.
Objetivo: [OBJETIVO].
1) Refina la idea.
2) Crea o actualiza specs consistentes.
3) Si detectas objetivos independientes, divide en múltiples specs numeradas.
4) Mantén bitácora y trazabilidad.
5) Si aplica, usa módulos opcionales (playbooks, quality, dashboard) sin romper el flujo base.
Entrega: resumen, decisiones, archivos tocados, riesgos y siguiente paso.
```

## Regla de consistencia (clave)

- El flujo base `idea/specs/bitacora` siempre manda.
- Lo opcional acelera, pero nunca bloquea.
- Si hay ambigüedad, no avanzar a implementación.
