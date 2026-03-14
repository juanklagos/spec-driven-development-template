# SDD Execution Gate / Compuerta de ejecución SDD

## Decision gate before coding

Coding is allowed only if all checks are YES:

1. Is there one active specification?
2. Is `spec.md` approved by the user?
3. Is `plan.md` consistent with `spec.md` acceptance criteria?
4. Are tasks in `tasks.md` aligned to plan and scope?
5. Is there no unresolved contradiction between idea/spec/plan?

If any check is NO:

- Do not write implementation code.
- Refine docs first.
- Report exact missing condition.

Consent policy:
- SDD base creation/refinement is allowed without consent.
- Explicit user consent is required only when execution/implementation is about to start.

## Minimal evidence to proceed

- Explicit user approval in session text.
- Traceability from requirement -> plan -> tasks.
- Clear out-of-scope boundaries.

## End-of-session checks

- `history.md` updated when needed.
- `specs/INDEX.md` updated when needed.
- `bitacora/` updated.
- `./scripts/validate-sdd.sh . --strict` executed.

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
