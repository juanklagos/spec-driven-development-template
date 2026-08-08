# Plan 028 - superficie completa MCP + builder

## Resumen

Añadir 7 herramientas MCP (política, descubrimiento legado, escritura de
documentos, 3 de gestión de tareas, estado de spec) y llevar al Builder las
capacidades que hoy exigen terminal (puntaje, añadir tarea, bitácora,
STATUS/roadmap). Core primero (funciones probadas), transportes delgados
después (MCP y REST delegando en las mismas funciones), UI al final.

## Contexto técnico

- El patrón de registro MCP está establecido en
  `packages/sdd-mcp/src/server.ts` (`registerTool` + zod +
  `structuredContent`); las 7 herramientas nuevas siguen ese molde, igual que
  las 7 de la spec 027.
- El patrón REST del Builder está en `packages/sdd-mcp/src/api.ts`: cada ruta
  delega en `sdd-core`, sin lógica en el transporte (comentario de cabecera
  del archivo). Los endpoints nuevos no rompen esa regla.
- Ya existen y se reutilizan sin tocar: `checkPolicy` (policy.ts),
  `writeSpecDocument`/`mutateSpecDocument` (board.ts), `addSpecTask`,
  `setSpecTaskDone`, `listBitacoraFiles`/`readBitacoraFile` (bitacora.ts,
  027), `scoreSpec` (score.ts, 027), `writeDecision`/`writeDailyLog`/
  `writeHandoff`, `generateStatus`, `generateRoadmap` (index.ts).
- Trabajo nuevo real en core: `legacy.ts` (port del script, sin `rg`), las 3
  operaciones de tareas (rename/remove/move sobre `mutateSpecDocument`) y
  `updateSpecIndexRow` (primera escritura no-append sobre INDEX.md).
- El guard «no contra la raíz del template» se hereda usando
  `resolveSddRoot` como todas las herramientas existentes.

## Fases de implementación

1. **Core: legado.** `legacy.ts` con las mismas señales que
   `legacy-discovery.sh` (rutas, flujos, specs sugeridas, reporte markdown en
   `analysis/legacy-discovery/`) usando búsqueda TS sobre los archivos del
   proyecto. Tests con fixtures mínimos.
2. **Core: tareas.** `renameSpecTask`, `removeSpecTask`, `moveSpecTask` en
   `board.ts` junto a `addSpecTask`, todas vía `mutateSpecDocument` (atómico).
   Tests: preservación byte a byte del resto, líneas inválidas, lista vacía.
3. **Core: índice.** `updateSpecIndexRow` (estado/prioridad/owner de UNA fila;
   error si la spec no existe). Tests con tabla adversaria (misma filosofía
   que `approval-cases.fixture.ts`).
4. **MCP.** Registrar las 7 herramientas en `server.ts` + shapes en
   `schemas.ts` + exports en core. Superficie 28 → 35.
5. **REST.** Endpoints de R6 en `api.ts`, todos delegando en core.
6. **Builder UI.** Drawer (score + lint EARS resumen + añadir tarea), modal de
   bitácora, botones STATUS/roadmap en TopBar; `builder/src/api.ts` con las
   llamadas nuevas.
7. **Verificación.** `vitest run` core; `typecheck`/`build` ambos paquetes;
   `smoke-test-mcp.mjs` (contrato a 35) + HTTP; `test-mcp-integration.mjs`;
   build del Builder; `validate-sdd.sh`.
8. **Docs.** Referencia MCP ES/EN (7 herramientas) y guía visual del Builder
   ES/EN.

## Dependencias

- Spec 027 (lecturas, score, add task, bitácora core): se reutiliza tal cual,
  no se toca.
- Spec 024 (núcleo con pruebas): las funciones nuevas siguen su convención de
  tests junto al código.
- Decisión `2026-07-23-mcp-score-port-y-sidecar-execfile.md`: los scripts que
  dependen de `rg` se portan a TS — por eso `legacy.ts` es port y no execFile.
- Spec 008 (lint EARS local del Builder): se reutiliza `ears.ts` para el
  resumen del drawer; unificarlo con core queda fuera de alcance.

## Hitos

- H1: core nuevo probado en verde (fases 1-3).
- H2: 35 herramientas visibles y funcionales por stdio y HTTP (fase 4).
- H3: REST + canvas funcionales contra un workspace externo (fases 5-6).
- H4: verificación completa y docs en verde (fases 7-8).

## Riesgos

- **`updateSpecIndexRow` es la primera escritura no-append sobre INDEX.md:**
  una regex frágil podría reescribir filas ajenas; mitigación: coincidencia
  por número de spec anclado al inicio de fila, diff de una sola línea como
  propiedad de la spec, tests con tabla adversaria.
- **`sdd_write_spec_document` puede pisar ediciones manuales:** es la
  herramienta de bajo nivel; mitigación: misma escritura atómica que
  `mutateSpecDocument` y documentación de que `sdd_update_spec_sections` sigue
  siendo la vía estructurada preferida.
- **Paridad del descubrimiento legado con el bash:** el bash usa `rg` con
  matices de expresiones; mitigación: mismas clases de señales y mismas specs
  sugeridas declaradas en la spec (paridad de heurísticas, no de bytes), tests
  con fixtures que cubren los 4 caminos de sugerencia.
- **Crecimiento de superficie (28 → 35) y de la REST:** más superficie de
  permisos en clientes; mitigación: descripciones precisas, sin herramientas
  redundantes (todo lo nuevo era inalcanzable antes), y el smoke test pinea el
  contrato.
