# Especificación 028 - superficie completa MCP + builder

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-08`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-08 — el propietario pidió «que se amplien las herramientas que se pueden usar desde el mcp y el builder», seleccionó las 5 herramientas MCP y las 4 capacidades de Builder propuestas, y respondió **«Aprobar e implementar»** al borrador de la spec 028. Consentimiento en `.sdd/user-consent.log`.

## Objetivo / Objective

Cerrar los huecos que quedan entre lo que el núcleo (`sdd-core`) y los scripts
bash ya saben hacer y lo que un agente conectado solo por MCP — o un usuario
solo con el canvas del Builder — puede alcanzar. La spec 027 cerró las
asimetrías de lectura; esta cierra las de política, descubrimiento legado,
escritura directa de documentos, gestión completa de tareas y estado de specs,
y lleva al Builder las capacidades que hoy exigen terminal.
/ Close the remaining gaps between what sdd-core and the bash scripts already
do and what an MCP-only agent or a canvas-only Builder user can reach.

## Historia de usuario principal

Como agente de IA conectado al proyecto solo por MCP (Desk o `npx`, sin
filesystem), quiero verificar la política SDD, descubrir specs en un proyecto
legado, escribir documentos de spec completos, gestionar tareas (renombrar,
eliminar, reordenar) y actualizar el estado de una spec en el índice, sin
pedirle al humano que abra una terminal. Como usuario del Builder, quiero ver
el puntaje de mi spec, añadir tareas, registrar decisiones y regenerar el
estado del proyecto desde el canvas.

## Contexto (verificado en el código)

- `checkPolicy` existe en `sdd-core` (`policy.ts`) y como
  `scripts/check-sdd-policy.sh`, pero el MCP solo la ejecuta **dentro** de
  `sdd_check_gate` / `sdd_gate_summary`; no hay herramienta independiente
  (verificado: no está entre las 28 registradas en `server.ts`).
- `scripts/legacy-discovery.sh` depende de `rg` (ripgrep) — la misma restricción
  que llevó a portar `score-spec.sh` a TS en la spec 027 (decisión registrada
  en `bitacora/decisiones/2026-07-23-mcp-score-port-y-sidecar-execfile.md`:
  los scripts que dependen de `rg` se portan, no se ejecutan por execFile).
- `writeSpecDocument` existe en core (`board.ts:182`) con escritura atómica,
  pero el MCP solo expone lectura (`sdd_read_spec_document`) y edición
  estructurada por secciones (`sdd_update_spec_sections`); no hay escritura
  directa de documento.
- Tareas: core tiene `addSpecTask` (spec 027) y `setSpecTaskDone`; no existe
  renombrar, eliminar ni reordenar.
- `specs/INDEX.md`: solo existe append de filas (`appendIndexRow`, privada);
  cambiar estado/prioridad de una spec exige editar el archivo a mano — ni
  bash, ni MCP, ni Builder pueden hacerlo.
- La REST del Builder (`packages/sdd-mcp/src/api.ts`) no tiene endpoints para:
  añadir tarea, puntaje de spec, bitácora (leer/escribir), ni regenerar
  STATUS/roadmap. El lint EARS del Builder vive solo en el editor guiado
  (`builder/src/ears.ts`, spec 008); el drawer no muestra puntaje ni lint.
- Las funciones de bitácora de la spec 027 (`listBitacoraFiles`,
  `readBitacoraFile`) y las de escritura (`writeDecision`, `writeDailyLog`,
  `writeHandoff`) ya están en core: la REST solo debe cablearlas.

## Escenarios de aceptación

1. Dado un workspace SDD, cuando el agente llama `sdd_check_policy`, entonces
   recibe los mismos mensajes (códigos y niveles) que
   `scripts/check-sdd-policy.sh`, sin ejecutar el gate completo.
2. Dado un proyecto con código existente, cuando el agente llama
   `sdd_legacy_discovery`, entonces se genera el reporte en
   `analysis/legacy-discovery/` con las mismas señales (rutas, flujos) y las
   mismas specs sugeridas que el script bash, sin depender de `rg`.
3. Dada una spec, cuando el agente llama `sdd_write_spec_document` con
   `document` = plan.md y contenido nuevo, entonces el archivo queda escrito
   de forma atómica; y con `document` = "notas.txt" la herramienta falla sin
   tocar el filesystem.
4. Dada una spec con 5 tareas, cuando el agente renombra la tarea de la línea
   3, elimina la de la línea 5 y mueve la de la línea 1 al final, entonces las
   demás tareas quedan intactas y en el orden esperado.
5. Dada una spec `Draft / Borrador`, cuando el agente llama
   `sdd_update_spec_status` con estado `In Progress / En progreso`, entonces
   solo cambia la fila de esa spec en `specs/INDEX.md`.
6. Dado el Builder abierto, cuando el usuario abre el drawer de una spec,
   entonces ve el puntaje (0-100) con sus notas; cuando escribe una tarea
   nueva y confirma, la tarea aparece en `tasks.md`; y desde el canvas puede
   registrar una decisión en bitácora y regenerar `STATUS.md` sin terminal.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se ejecute `sdd_check_policy`, EL SISTEMA DEBERÁ delegar en
  `checkPolicy` de `sdd-core` y NO DEBERÁ reimplementar reglas de política.
- CUANDO se ejecute `sdd_legacy_discovery`, EL SISTEMA DEBERÁ producir las
  mismas señales y sugerencias que `scripts/legacy-discovery.sh` usando
  búsqueda en TS (sin `rg`) y DEBERÁ escribir solo dentro de
  `<projectRoot>/analysis/legacy-discovery/`.
- CUANDO se escriba un documento, EL SISTEMA DEBERÁ aceptar solo los cinco
  nombres permitidos (spec.md, plan.md, tasks.md, research.md, history.md),
  DEBERÁ escribir de forma atómica (mismo mecanismo que `mutateSpecDocument`)
  y DEBERÁ rechazar cualquier otro nombre sin tocar el filesystem.
- CUANDO se renombre, elimine o reordene una tarea, EL SISTEMA DEBERÁ
  preservar el resto del `tasks.md` byte a byte y DEBERÁ devolver la lista
  actualizada con números de línea.
- CUANDO se actualice el estado de una spec, EL SISTEMA DEBERÁ modificar solo
  la fila de esa spec en `specs/INDEX.md` y DEBERÁ fallar con error claro si
  la spec no existe.
- CUANDO el Builder pida puntaje, añada tarea, escriba bitácora o regenere
  STATUS/roadmap, EL SISTEMA DEBERÁ hacerlo vía endpoints REST que delegan en
  las MISMAS funciones de core que usan las herramientas MCP.
- EL SISTEMA NO DEBERÁ permitir ninguna de estas herramientas contra la raíz
  del template (misma regla que las herramientas existentes).

## Requisitos

- R1. **`sdd_check_policy`**: herramienta MCP que expone `checkPolicy` de core
  tal cual (mensajes, códigos, niveles), con `projectRoot` arbitrario.
- R2. **`sdd_legacy_discovery`**: port TS en core (`legacy.ts`) de
  `legacy-discovery.sh` — señales de rutas y flujos, specs sugeridas
  (001-authentication-baseline, 002-commerce-flow-baseline,
  003-account-management-baseline, fallback 001-core-system-baseline) y
  reporte markdown en `analysis/legacy-discovery/`; herramienta MCP.
- R3. **`sdd_write_spec_document`**: herramienta MCP sobre `writeSpecDocument`
  de core con la lista blanca de 5 documentos y escritura atómica.
- R4. **Gestión completa de tareas**: funciones core `renameSpecTask`,
  `removeSpecTask`, `moveSpecTask` (junto a `addSpecTask`/`setSpecTaskDone` en
  `board.ts`) y herramientas MCP `sdd_rename_task`, `sdd_remove_task`,
  `sdd_move_task`.
- R5. **`sdd_update_spec_status`**: función core `updateSpecIndexRow`
  (estado/prioridad/owner de la fila de una spec en `specs/INDEX.md`) y su
  herramienta MCP.
- R6. **REST del Builder**: endpoints nuevos en `api.ts` —
  `POST /api/spec/:id/tasks` (añadir, vía `addSpecTask`),
  `GET /api/spec/:id/score` (vía `scoreSpec`),
  `GET /api/bitacora/:kind` y `POST /api/bitacora/:kind` (leer/escribir vía
  funciones de 027 y writers existentes),
  `POST /api/status` y `POST /api/roadmap` (vía `generateStatus` /
  `generateRoadmap`).
- R7. **UI del Builder**: drawer con puntaje + notas y resumen de lint EARS de
  los criterios (reutilizando `ears.ts` existente); campo para añadir tarea en
  el drawer; modal de bitácora (decisión / daily / handoff); botones de
  STATUS y roadmap en la TopBar.
- R8. **Pruebas**: unit tests vitest en core para `legacy.ts`, las 3
  operaciones de tareas, `updateSpecIndexRow` y el guard de
  `sdd_write_spec_document`; contrato de superficie del smoke test MCP
  actualizado (28 → 35 herramientas).
- R9. **Docs**: referencia MCP ES/EN (`docs/*/41-*`) con las 7 herramientas
  nuevas y guía visual del Builder (`docs/*/51-*`) con las capacidades nuevas.

## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)

- Para todo `document` fuera de la lista blanca de 5, `sdd_write_spec_document`
  DEBERÁ fallar sin crear ni modificar archivo alguno.
- Para toda lista de N tareas, tras `removeSpecTask` el número de tareas es
  exactamente N-1 y las restantes conservan texto y orden relativo.
- Para toda fila de `INDEX.md`, `updateSpecIndexRow` no altera ninguna otra
  fila (diff de una sola línea).

## Ámbito de archivos / File scope

- `packages/sdd-core/src/` — `legacy.ts` nuevo; `board.ts` (operaciones de
  tareas); actualización de fila de INDEX; exports en `index.ts`; tests
- `packages/sdd-mcp/src/server.ts` — registro de las 7 herramientas nuevas
- `packages/sdd-mcp/src/schemas.ts` — shapes compartidos nuevos
- `packages/sdd-mcp/src/api.ts` — endpoints REST nuevos del Builder
- `builder/src/` — `api.ts`, `SpecDrawer.tsx`, `TopBar.tsx`, modal de bitácora
- `scripts/smoke-test-mcp.mjs` — contrato de superficie (28 → 35)
- `docs/es/41-referencia-completa-mcp.md`, `docs/en/41-complete-mcp-reference.md`
- `docs/es/51-guia-visual-sdd-builder.md`, `docs/en/51-sdd-builder-visual-guide.md`

## Criterios de éxito

- Las 28 herramientas actuales siguen intactas (sin renombres ni cambios de
  shape) — mismo invariante que la spec 027.
- Un agente conectado SOLO por HTTP puede: verificar política, descubrir specs
  en legado, escribir un documento, gestionar tareas completo y actualizar el
  índice — sin filesystem.
- Un usuario SOLO con el canvas puede: ver el puntaje de una spec, añadirle
  una tarea, registrar una decisión y regenerar STATUS/roadmap — sin terminal.
- `npm run typecheck`, `vitest run`, `mcp:test`, smokes stdio+HTTP y build del
  Builder en verde; `bash scripts/validate-sdd.sh` en verde.

## Fuera de alcance / Out of scope

- Ampliar resources/prompts MCP (misma frontera que la spec 027).
- Unificar el lint EARS duplicado del Builder (`builder/src/ears.ts`) con el
  de core — la nota KEEP IN SYNC se mantiene; esa unificación sería otra spec.
- Eliminar o reemplazar los scripts bash (siguen siendo la referencia local).
- Flujos de GitHub issues (ya cubiertos por spec 009).
- Edición visual del grafo de dependencias del board (ya existe vía
  `sdd_board_connect` / drag en canvas).
