# Decisión clave - Separar el producto en `sdd-core` (lógica tipada) y `sdd-mcp` (transporte), con la raíz del repo como framework canónico / Key decision - Split into sdd-core and sdd-mcp

## Date / Fecha

2026-03-18

## Context / Contexto

El framework existía solo como documentación + `scripts/*.sh`. Al querer exponerlo a asistentes IA vía MCP aparecía la tentación obvia: convertir la raíz del repositorio en el servidor.

El diagnóstico está en `specs/001-sdd-mcp-foundation/research.md`: el repo ya tenía las operaciones que serían tools (`new-spec`, `validate-sdd`, `check-sdd-gate`, `confirm-user-consent`…) y los recursos que serían resources (política, templates, quickstart), pero todos accesibles **solo como texto de shell**. El escenario de aceptación 5 (`spec.md:24`) nombra el problema: mover la lógica reusable a `packages/sdd-core` *"para evitar contratos basados solo en texto de shell"*.

## Decision / Decisión

Profesionalizar el producto como **framework root + `packages/sdd-core` + `packages/sdd-mcp`**:

- **`sdd-core`** concentra la lógica tipada: resolución de workspace, ciclo de vida de specs, validación, gate, consentimiento, status y bitácora.
- **`sdd-mcp`** es **solo** superficie MCP: tools, resources y prompts.
- **La raíz NO se convierte en servidor.** Requisito literal en `specs/001-sdd-mcp-foundation/spec.md:29`: *"Mantener este repositorio como fuente canónica del framework y no convertir la raíz en un servidor MCP monolítico"*.
- **MVP sobre `stdio`**, con Streamable HTTP pospuesto a propósito (`spec.md:34`). El HTTP llegó el mismo día, en `56e087b` (2026-03-18 09:10).

Registrado como tres decisiones en `bitacora/global/PROJECT_LOG.md`, Sesión 2 (2026-03-18 10:30): *"Repository root remains the canonical SDD framework"*, *"Productized path is framework root + sdd-core + sdd-mcp"*, *"MVP MCP is stdio-first and keeps compatibility with current shell scripts"*. También en `specs/001-sdd-mcp-foundation/history.md`: *"Se define como dirección base la separación `packages/sdd-core` + `packages/sdd-mcp`… para soportar la evolución futura"*.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Raíz como servidor MCP monolítico** | Rechazada explícitamente en `spec.md:29`: el repo debe seguir siendo la fuente canónica del framework, no un ejecutable |
| **Dejar los contratos solo como scripts de shell** | Rechazada en `spec.md:24`: contratos basados en texto no son verificables ni tipables por un cliente MCP |
| **Empezar por Streamable HTTP** | Pospuesta, no rechazada (`spec.md:34`): `stdio` primero por ser el transporte que los clientes ya soportaban |

No hay más arquitecturas evaluadas en la evidencia. El commit de arquitectura `9a314e8` (2026-03-18 08:57:49 -0500) es documentación pura — 13 archivos `.md`, 204 líneas añadidas, cero código. No existe un documento de investigación en `idea/` para esta decisión (los que hay son de julio); `research.md` cita solo la especificación MCP, el SDK oficial y `sdd.policy.yaml`. La comparación con alternativas fue, hasta donde consta, breve.

## Consequences / Consecuencias

**A favor**
- La regla *"el transporte no tiene reglas"* quedó escrita en el propio código, no solo en la spec: `packages/sdd-mcp/src/github.ts:2` (*"This is a TRANSPORT module by design: it shells out to the local `gh` CLI… so it lives in sdd-mcp, not in sdd-core"*) y `packages/sdd-mcp/src/security.ts:5` (*"transport-level protection, not SDD business logic: nothing here duplicates @juanklagos/sdd-core"*).
- Para 2026-07-20 la misma capa alimenta la API REST, las tools MCP, `/builder`, `/dashboard` y la MCP App con *"cero lógica duplicada entre transportes"* (`specs/006-*/history.md:30`).
- Implementación sin rehacer arquitectura: `04d133a` (core tipado + stdio), `56e087b` (HTTP), `5437a5d` (API de proyecto y specs) — los tres el 2026-03-18.

**Costos aceptados**
- **Compatibilidad**: el MCP debía seguir funcionando con los scripts existentes, no reemplazarlos. `research.md:26` lo llamó *"mantener `scripts/` como compatibilidad temporal"*; a 2026-07-21 siguen ahí 15 scripts `.sh` junto a `sdd-core`. Lo "temporal" no terminó, y obliga a sincronizar pares TS↔bash a mano.
- Duplicar una regla en varias superficies se paga caro. El caso documentado es TS↔TS, no TS↔bash: `specs/010-builder-v5-pro-ux/history.md:15-20` describe la regla de estado de una spec duplicada en **cuatro** sitios y divergiendo (dos regex distintas; una spec "Aprobada" salía pendiente en el lienzo y aprobada en el kanban). Se corrigió centralizándola en `sdd-core` (`specTone`). Es la misma clase de deuda que la frontera core/transporte existe para evitar.

**Vigencia**
- **Vigente.** Ninguna decisión posterior la supersede; es la apuesta que más rindió.

**Cuándo revisar esta decisión**
- Si `sdd-core` empieza a importar detalles de transporte (rutas HTTP, esquemas MCP, `gh`): la frontera se rompió y hay que rediseñarla, no parchearla.
- Si aparece un tercer transporte cuya lógica no encaja en `sdd-core` sin deformarlo — señal de que el core está modelando MCP, no SDD.
- Si se decide por fin retirar `scripts/`: hay que reescribir aquí el costo aceptado de compatibilidad, porque desaparece.
- Si `sdd-mcp` deja de poder consumirse como paquete independiente de este repo (p. ej. si el builder o los estáticos obligan a acoplarlo a la raíz), la premisa "la raíz no es un servidor" queda en entredicho.
