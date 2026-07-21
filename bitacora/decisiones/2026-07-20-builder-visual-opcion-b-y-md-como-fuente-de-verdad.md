# Decisión clave - Builder visual (Opción B) con los .md como fuente de verdad / Key decision - Build the visual SDD Builder, markdown as source of truth

## Date / Fecha

2026-07-20

## Context / Contexto

El autor pidió construir el flujo SDD **arrastrando tarjetas con uniones**, y añadió la condición: *"si no existe, que lo creemos"* (evidencia de aprobación en `specs/006-visual-spec-builder/spec.md:9`).

Antes de escribir código se hizo investigación doble (existencia + stack), registrada en `idea/PROPUESTA_BUILDER_2026-07-20.md` (commit `e058949`, 2026-07-20 07:58). Veredicto textual (línea 7): **"NO existe** (julio 2026) un constructor visual drag-and-drop que componga el flujo SDD… Se verificaron ~15 UIs del ecosistema SDD: todas son visores, dashboards de aprobación o kanbans de ejecución". El hueco quedó nombrado en la línea 16: **"el Relume de las specs"**.

## Decision / Decisión

Tres piezas de la misma jugada:

1. **Construir el builder visual**, confirmado el hueco.
2. **Opción B (ambiciosa, 6-9 semanas)** sobre la Opción A (MVP con sync al guardar, 2-4 semanas): lienzo + sync bidireccional en vivo + MCP App (SEP-1865) + modo demo (`idea/PROPUESTA_BUILDER_2026-07-20.md:27-29`). Elección del autor registrada en `specs/006-visual-spec-builder/history.md:5` y en `.sdd/user-consent.log:6` — *"[2026-07-20 08:01:38 -0500] Usuario eligió Opción B (ambiciosa)… (AskUserQuestion)"*.
3. **Arquitectura**: los `.md` de las specs son la fuente de verdad y se editan **quirúrgicamente**; solo el layout visual (posiciones y uniones) se persiste aparte en `specs/board.canvas`, formato abierto **JSON Canvas**; los IDs estables son las carpetas `NNN-slug` que el template ya usaba; stack React Flow (`@xyflow/react`) + `@dnd-kit` + `zustand`, servido por el transporte HTTP existente de `sdd-mcp` en `/builder`, junto a `/dashboard`.

La regla quedó fijada como criterio EARS, no como intención: `specs/006-visual-spec-builder/spec.md:26` — *"CUANDO el builder escriba en disco, EL SISTEMA DEBERÁ tratar los .md como fuente de verdad y editar quirúrgicamente (sin destruir contenido no gestionado)"* — y como escenario 4 (`spec.md:20`): la unión *"se persiste en `specs/board.canvas`… sin tocar los .md"*.

Verificado en código: `packages/sdd-core/src/board.ts:3` (JSON Canvas, jsoncanvas.org) y `:192` (ruta `board.canvas`); rutas `/builder` y `/dashboard` en `packages/sdd-mcp/src/http.ts:51,56`; dependencias en `builder/package.json:14,16,28`.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Opción A (MVP, 2-4 semanas)** | Ofrecida y no tomada: el autor eligió B en la pregunta de alcance (`.sdd/user-consent.log:6`) |
| **File System Access API** como vía principal de distribución | *"descartada como vía principal: solo Chrome/Edge"* (`idea/PROPUESTA_BUILDER_2026-07-20.md:23`); por eso el builder lo sirve el transporte HTTP existente |
| **Construir sobre UIs del ecosistema** | Traycer es SaaS cerrado y compone por chat, no canvas; `spec-workflow-mcp` solo opera sobre specs ya escritas; OpenSpecification usa formularios sin lienzo (`PROPUESTA_BUILDER_2026-07-20.md:10-12`) |
| **Base de datos o estado propio del builder como fuente de verdad** | Nunca se consideró: contradice el modelo local-first del template (cada tarjeta es un bundle real en disco) |

## Consequences / Consecuencias

**A favor**
- Los artefactos siguen siendo markdown portable: compatible con Spec Kit / Claude / Cursor / Kiro sin lock-in, y el layout vive en un formato abierto.
- Cero superficie nueva de distribución: reutiliza el servidor HTTP y `listSpecs`/`checkGate` de `sdd-core`.

**Costos aceptados**
- **Fuera de alcance en v1**: la edición rica de `spec.md` en el lienzo — *"v1 edita título+tareas; el contenido largo se abre en el editor del usuario"* (`spec.md:43`). Limitación **levantada después** por `specs/010-builder-v5-pro-ux/spec.md:26` (R2: un formulario por sección).
- **Limitación conocida de la Fase 1**: el PUT del board completo es *"el último escritor gana"* en el canvas — los `.md` nunca se pisan (`006/history.md:17`). Resuelta parcialmente en la Fase 2 (SSE + watcher + reconciliación, commit `a457375`, 09:12); el canvas mantiene la política de último escritor, ahora con guard anti-eco (`006/history.md:22`).

**Hallazgo del camino**
- Bug real de **atomicidad de `createSpec`** encontrado y corregido durante la Fase 1 (commit `5d5a39d`, `006/history.md:16`): sin bundle parcial ante fallo.

**Vigencia**
- **Vigente**, no superada. Commits: `e058949` (investigación, 07:58) → `ceb9c19` (`board.ts` + REST, 08:04) → `5d5a39d` (frontend, 08:30) → `a457375` (sync vivo, 09:12) → release **v1.6.0** (`2ba804b`, 09:14; `CHANGELOG.md:99,106`).

**Cuándo revisar esta decisión**
- Si editar `.md` quirúrgicamente por AST deja de ser fiable al crecer las secciones editables (la spec 010 ya amplió mucho `updateSpecSections`): si aparecen pérdidas de contenido no gestionado, el criterio EARS de `spec.md:26` es el que se rompe primero.
- Si dos personas necesitan mover el mismo board a la vez: "último escritor gana" en `board.canvas` deja de ser aceptable y haría falta merge real o CRDT.
- Si JSON Canvas queda abandonado como formato, o React Flow cambia de licencia/mantenimiento.
- Si el builder deja de servirse por el transporte HTTP de `sdd-mcp` (ver `2026-07-21-no-app-escritorio.md`: el lanzador y el `.mcpb` cambian el empaquetado, no la fuente de verdad).

**No reconstruible desde evidencia**
- Por qué se eligió `zustand` para el estado del frontend: aparece en `builder/package.json:28` pero **no** está justificado en la propuesta de investigación ni en `006/history.md`. No se inventa una razón aquí.
