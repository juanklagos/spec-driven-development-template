# 🧾 Specification rules / Reglas para especificaciones

Each specification must use a numbered folder.

Cada especificación debe usar una carpeta numerada.

Examples / Ejemplos:

- `001-authentication`
- `002-dashboard`

## ✅ Required files / Archivos obligatorios

- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `history.md` ⭐
- `contracts/` when needed / cuando sea necesario

## 🔁 Refinement rule / Regla de refinamiento

Any relevant change to scope, priorities, or requirements must update:

- `history.md`
- `specs/INDEX.md` (if status/priority changes)
- `bitacora/` logs

## 🎓 Included example / Ejemplo incluido

- This template keeps full examples under `examples/`.
- Este template conserva los ejemplos completos en `examples/`.
- Example / Ejemplo: `examples/001-ejemplo-inicial/`

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
