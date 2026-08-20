# Plan 037 - La evidencia de aprobación deja de transcribir el chat

## Resumen

Dos mitades con orden obligatorio. Primero la plantilla y la norma, porque son
la causa: mientras el formulario pida «cita corta», limpiar los 50 archivos
solo compra tiempo. Después la reescritura del registro existente.

## Contexto técnico

- El gate no parsea el contenido de la evidencia; solo exige que no esté vacía
  (`scripts/check-sdd-gate.sh:148`). Reescribir prosa es seguro.
- `.sdd/user-consent.log` tiene formato fijado en `sdd.policy.yaml:32`:
  `[<timestamp>] [spec:<NNN-slug>] <summary>`. El sello y el marcador son
  estructura y no se tocan; el resumen es texto libre.
- `packages/sdd-core/framework/specs/_template/spec.md` es copia idéntica de
  `specs/_template/spec.md`. Las dos se corrigen a la vez o el paquete
  publicado sigue induciendo el defecto en los proyectos de terceros.

## Restricciones

- No se altera qué se aprobó, quién ni cuándo. Solo cómo se cuenta.
- No se elimina alcance: donde la cita era la única prueba, se reformula.
- No se reescribe el historial de git (R7).
- No se inventa fundamento ni fecha que no esté en una fuente.

## Fases de implementación

1. **Raíz** — plantilla (las dos copias) y norma en `CLAUDE.md` y
   `template-context/`. Sin esto, lo demás se revierte solo con el tiempo.
2. **Specs** — los 25 `spec.md` y los 15 `history.md`.
3. **Bitácora** — 6 decisiones, 3 diarios, `PROJECT_LOG.md`.
4. **Consentimiento** — resúmenes de `.sdd/user-consent.log`.
5. **Decisión** — registro del porqué no se reescribe el historial de git.
6. **Verificación** — compuerta completa y `docs:links`.

## Dependencias

- Ninguna externa. No depende de otra spec ni de publicar versión.

## Hitos

- H1: la plantilla ya no pide cita (fin de fase 1).
- H2: cero transcripciones en `specs/` (fin de fase 2).
- H3: cero transcripciones en el repositorio y compuerta 0/0 (fin de fase 6).

## Riesgos

- **Perder alcance al resumir.** Mitigación: cada reescritura se hace leyendo
  la entrada completa, no sustituyendo por patrón. Donde la cita prueba el
  alcance, el alcance queda escrito.
- **Que parezca maquillaje de un registro de auditoría.** Mitigación: la
  decisión de no tocar el historial de git queda registrada, y ninguna fecha,
  aprobador ni alcance cambia. La corrección es de forma y así se declara.
- **Divergencia entre la plantilla y su copia empaquetada.** Mitigación: las
  dos en la misma fase, y una comprobación de que siguen idénticas.
