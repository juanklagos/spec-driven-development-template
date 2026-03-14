# Fast Entry Flows / Flujos de entrada rápida

## Flow A: New project from this template

1. Confirm goal.
2. Create or select project folder.
3. Initialize `idea/`, `specs/`, `bitacora/` using this template.
4. Complete `idea/IDEA_GENERAL.md`.
5. Create `specs/001-.../` and update `specs/INDEX.md`.
6. Register first entry in `bitacora/global/PROJECT_LOG.md`.
7. Validate with `./scripts/validate-sdd.sh . --strict`.

## Flow B: Adapt existing project using this template

1. Confirm project path.
2. Keep existing code behavior unchanged.
3. Add `idea/`, `specs/`, `bitacora/` structure.
4. Write first spec based on current behavior.
5. Register migration decisions in `bitacora/`.
6. Validate structure and consistency.

## Minimum expected outcome / Resultado mínimo esperado

- Standard structure ready in target project.
- First specification created.
- Initial logbook entry recorded.
- Clear next step.

## 🌐 Bilingual support / Soporte bilingüe

- EN: This repository is designed to be used in English and Spanish.
- ES: Este repositorio está diseñado para usarse en inglés y español.
- EN: Keep instructions simple, direct, and copy/paste-ready.
- ES: Mantén instrucciones simples, directas y listas para copiar/pegar.

## 🗣️ Prompt base / Base prompt

```text
EN: Using https://github.com/juanklagos/spec-driven-development-template, guide me step by step with SDD for my project.
My project is: [describe project in plain language].
Do not skip idea, spec, plan, tasks, logbook, and validation.

ES: Usando https://github.com/juanklagos/spec-driven-development-template, guíame paso a paso con SDD para mi proyecto.
Mi proyecto es: [explica el proyecto en lenguaje simple].
No omitas idea, spec, plan, tasks, bitácora y validación.
```

## 💡 Tips / Consejos

- EN: Ask the AI to confirm the active spec before coding.
- ES: Pide a la IA confirmar la spec activa antes de programar.
- EN: Keep one clear next step at the end of each session.
- ES: Deja un próximo paso claro al final de cada sesión.
- EN: Prefer simple language and concrete deliverables.
- ES: Prefiere lenguaje simple y entregables concretos.

## 📊 Visual flow / Flujo visual

```mermaid
flowchart LR
  A["EN: Idea / ES: Idea"] --> B["EN: Approved spec / ES: Spec aprobada"]
  B --> C["EN: Aligned plan / ES: Plan alineado"]
  C --> D["EN: Prioritized tasks / ES: Tareas priorizadas"]
  D --> E["EN: Implementation / ES: Implementación"]
  E --> F["EN: Validation + logbook / ES: Validación + bitácora"]
```
