# Especificación 027 - cobertura completa de comandos MCP

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-23`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-23 — el propietario pidió «evalua que pueden añadirse» sobre la cobertura MCP y respondió **«cubre todo»** a la propuesta P1+P2+P3 (7 herramientas nuevas). Consentimiento en `.sdd/user-consent.log`.

## Objetivo / Objective

Cerrar las asimetrías del servidor MCP: hoy es fuerte escribiendo (4 herramientas
de bitácora, aprobación, secciones, board) pero débil leyendo, y hay lógica ya
implementada en `sdd-core` o en scripts bash que un agente conectado por MCP —
sobre todo por HTTP (SDD Desk, `npx`), donde no tiene filesystem — no puede usar.
/ Close the MCP server's asymmetries: strong at writing, weak at reading, with
core/script logic that HTTP-connected agents cannot reach.

## Historia de usuario principal

Como agente de IA conectado al proyecto solo por el MCP (Desk o `npx`, sin acceso
al filesystem), quiero poder leer specs y bitácora, detectar deriva, añadir tareas,
lintear criterios EARS, puntuar specs e instalar el sidecar en un proyecto externo,
para acompañar el ciclo SDD completo sin pedirle al humano que copie archivos a mano.

## Contexto (verificado en el código)

- `readSpecDocument()` existe en `sdd-core` (`board.ts:115`) y la API REST del
  Builder ya expone `GET /api/spec/:id`; el MCP no tiene herramienta equivalente.
- La bitácora tiene 4 herramientas de escritura y **cero** de lectura. El resource
  `sdd://project/{name}/latest-handoff` existe pero solo para workspaces gestionados
  bajo `./www`, no para `projectRoot` arbitrario.
- `computeSpecDrift()` (spec 025) solo se expone dentro de `sdd_board_read` /
  dashboard; no hay herramienta directa para preguntar por la deriva de una spec.
- `sdd_read_tasks` / `sdd_set_task_done` existen, pero no hay forma de **añadir**
  una tarea.
- `validateEarsCriterion()` existe en core y en la ruta `/api/spec/:id/issues`;
  sin herramienta MCP.
- `scripts/score-spec.sh` y `scripts/install-spec-sidecar.sh` solo funcionan
  para agentes locales con bash.
- Los `dependencyWarnings` YA van dentro de `sdd_gate_summary`; los resources y
  prompts YA existen (fuera de alcance ampliarlos aquí).

## Escenarios de aceptación

1. Dado un proyecto con specs, cuando el agente llama `sdd_read_spec_document`
   con `specId` y `document` (spec/plan/tasks/research/history), entonces recibe
   el contenido markdown exacto del archivo.
2. Dado un proyecto con handoffs y decisiones, cuando el agente llama
   `sdd_read_bitacora` sin `fileName`, entonces recibe la lista ordenada de
   archivos de esa carpeta; y con `fileName`, el contenido de ese archivo.
3. Dado un `fileName` con `../` o separadores de ruta, cuando se llama
   `sdd_read_bitacora`, entonces la herramienta falla con error claro y no lee
   fuera de la carpeta de bitácora.
4. Dada una spec aprobada con File scope cuyo código cambió después de la
   aprobación, cuando el agente llama `sdd_check_drift`, entonces recibe
   `state: "drifted"` con los commits ofensores; y los estados `clean`,
   `unscoped`, `unknown` se comportan igual que en el board (spec 025).
5. Dada una spec con tasks.md, cuando el agente llama `sdd_add_task` con un
   texto, entonces la tarea aparece como `- [ ] texto` al final de la lista y la
   respuesta devuelve las tareas actualizadas con sus líneas.
6. Dados criterios EARS (válidos e inválidos), cuando el agente llama
   `sdd_lint_ears`, entonces recibe por cada criterio el veredicto del mismo
   lint que usa el Builder.
7. Dada una spec, cuando el agente llama `sdd_score_spec`, entonces recibe un
   puntaje 0-100 y notas con las mismas heurísticas que `scripts/score-spec.sh`.
8. Dado un proyecto externo sin SDD, cuando el agente llama
   `sdd_install_sidecar`, entonces el proyecto queda con el sidecar `spec/`
   instalado (igual que `scripts/install-spec-sidecar.sh`) y las demás
   herramientas MCP funcionan contra ese `projectRoot`.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se solicite un documento de spec, EL SISTEMA DEBERÁ devolver solo los
  cinco documentos permitidos (spec.md, plan.md, tasks.md, research.md,
  history.md) y DEBERÁ rechazar cualquier otro nombre.
- CUANDO se lea bitácora, EL SISTEMA DEBERÁ restringir la lectura a
  `bitacora/{handoffs,decisiones,diaria,global}` dentro del SDD root resuelto.
- SI el `fileName` contiene separadores de ruta o no termina en `.md`, ENTONCES
  EL SISTEMA DEBERÁ fallar con mensaje claro, sin tocar el filesystem.
- CUANDO se consulte la deriva, EL SISTEMA DEBERÁ reutilizar `computeSpecDrift`
  (la MISMA regla que el board) y NO DEBERÁ duplicar la lógica.
- CUANDO se añada una tarea, EL SISTEMA DEBERÁ escribir de forma atómica (mismo
  `mutateSpecDocument` que el toggle) y DEBERÁ preservar el resto del archivo.
- CUANDO se lintee un criterio EARS, EL SISTEMA DEBERÁ usar
  `validateEarsCriterion` de `sdd-core` sin reimplementarlo.
- CUANDO se puntúe una spec, EL SISTEMA DEBERÁ producir el mismo orden de
  magnitud de puntaje que `score-spec.sh` para los mismos insumos (paridad de
  heurísticas, no de bytes).
- CUANDO se instale el sidecar, EL SISTEMA DEBERÁ delegar en
  `scripts/install-spec-sidecar.sh` (patrón ya usado por `createWorkspace`) y
  DEBERÁ funcionar desde el paquete npm (payload de framework).
- EL SISTEMA NO DEBERÁ permitir ninguna de estas herramientas contra la raíz
  del template (misma regla que las herramientas existentes).

## Requisitos

- R1. **`sdd_read_spec_document`**: leer spec.md/plan.md/tasks.md/research.md/history.md
  de una spec vía `readSpecDocument` de core, con `projectRoot` arbitrario.
- R2. **`sdd_read_bitacora`**: listar (`kind` = handoffs|decisiones|diaria|global,
  sin `fileName`) y leer (con `fileName`) entradas de bitácora, con guard
  anti-traversal en core (`listBitacoraFiles` / `readBitacoraFile`).
- R3. **`sdd_check_drift`**: deriva de una spec (`specId`) o de todas (sin
  `specId`), reutilizando `computeSpecDrift` + `extractApprovalDate` +
  `isApprovedStatus`; nueva función core `getSpecDrift`.
- R4. **`sdd_add_task`**: nueva función core `addSpecTask` (append `- [ ] texto`
  vía `mutateSpecDocument`) y su herramienta MCP; devuelve las tareas actualizadas.
- R5. **`sdd_lint_ears`**: herramienta pura (sin filesystem) que aplica
  `validateEarsCriterion` a una lista de criterios.
- R6. **`sdd_score_spec`**: portar las heurísticas de `score-spec.sh` a core
  (`scoreSpec`) — archivos presentes, secciones de spec, plan, conteo de tareas,
  research, history con fechas — y exponerla; una spec o todas.
- R7. **`sdd_install_sidecar`**: función core `installSidecar(frameworkRoot,
  targetPath, profile)` que ejecuta `scripts/install-spec-sidecar.sh` (mismo
  patrón execFile que `createWorkspace`); herramienta MCP con la misma
  prohibición de raíz del template.
- R8. **Pruebas**: unit tests en `sdd-core` (vitest) para `addSpecTask`,
  `scoreSpec`, guard de bitácora y `getSpecDrift` (estados sin git);
  smoke test MCP actualizado si enumera herramientas.
- R9. **Docs**: actualizar la referencia MCP (`docs/es/41-referencia-completa-mcp.md`
  y su gemela EN) con las 7 herramientas nuevas.

## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)

- Para todo `fileName` que contenga `/`, `\` o `..`, `readBitacoraFile` DEBERÁ
  lanzar error sin leer nada.
- Para todo texto de tarea no vacío, tras `addSpecTask` el número de tareas es
  exactamente el anterior + 1 y las tareas previas quedan intactas.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/` — funciones nuevas de core (bitácora, drift por spec, add task, score, sidecar)
- `packages/sdd-mcp/src/server.ts` — registro de las 7 herramientas
- `packages/sdd-mcp/src/schemas.ts` — shapes compartidos nuevos
- `docs/es/41-referencia-completa-mcp.md` — referencia ES
- `docs/en/41-full-mcp-reference.md` — referencia EN

## Criterios de éxito

- Las 21 herramientas actuales siguen intactas (sin renombres ni cambios de shape).
- Un agente conectado SOLO por HTTP puede: leer una spec, leer el último handoff,
  saber si hay deriva, añadir una tarea y puntuar la spec — sin filesystem.
- `npm run typecheck` y `vitest run` en verde en ambos paquetes; smoke tests MCP en verde.
- `bash scripts/validate-sdd.sh` en verde.

## Fuera de alcance / Out of scope

- Ampliar resources/prompts MCP (ya existen; extenderlos a `projectRoot`
  arbitrario sería otra spec).
- Herramienta de dependencias (ya cubierta por `sdd_gate_summary.dependencyWarnings`).
- Cambios en el Builder UI o en la API REST.
