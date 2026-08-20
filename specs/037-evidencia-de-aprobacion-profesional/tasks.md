# Tareas 037 - La evidencia de aprobación deja de transcribir el chat

Estado: `- [ ]` pendiente · `- [x]` hecha

## Pruebas

- [x] T1 — Comprobación: `specs/_template/spec.md` y su copia en
  `packages/sdd-core/framework/` son idénticas y ninguna menciona «cita». (R1)
- [x] T2 — Comprobación: ningún `spec.md` ni `history.md` de `specs/` contiene
  las transcripciones catalogadas en `research.md`. (R3, R4)
- [x] T3 — Comprobación: cada línea de `.sdd/user-consent.log` conserva su
  sello de tiempo y su marcador `[spec:<id>]` intactos. (R6)
- [x] T4 — Comprobación: el número de entradas del log antes y después es el
  mismo; ninguna se pierde ni se añade. (R6)
- [x] T5 — Comprobación: `validate-sdd.sh --strict`, `check-sdd-policy.sh` y
  `check-sdd-gate.sh` en 0 errores y 0 avisos.
- [x] T6 — Comprobación: `docs:links` sin regresión respecto del estado previo.

## Implementación

- [x] T7 — Renombrar el campo en las dos copias de la plantilla y escribir su
  texto de ayuda. (R1)
- [x] T8 — Norma en `CLAUDE.md` y `template-context/core-instructions/`. (R2)
- [x] T9 — Reescribir los 25 `spec.md`. (R3)
- [x] T10 — Reescribir los 15 `history.md`. (R4)
- [x] T11 — Reescribir 6 decisiones, 3 diarios y `PROJECT_LOG.md`. (R5)
- [x] T12 — Reescribir los resúmenes del log de consentimiento. (R6)
- [x] T13 — Registro de decisión: por qué no se reescribe el historial de
  git. (R7)

## Cierre

- [x] T14 — Compuerta completa y entrada de bitácora del día.
