# History 009-builder-v4-teams

## 2026-07-20

- Spec creada y aprobada ("hazlo todos"); consentimiento registrado. Ejecución secuencial 007→008→009.

## 2026-07-21

- Implementación completa (R1-R5) con el patrón de capas de specs 006-008 (lógica en sdd-core, transportes finos, frontend bilingüe):
  - R1 Kanban: toggle Lienzo↔Tablero en TopBar; columnas Borrador·Pendiente / Aprobada / Hecha derivadas del estado real de los .md (misma regla que SpecNode); drag entre columnas NO cambia aprobación — toast con CTA al drawer (botón Aprobar de 007). `builder/src/components/KanbanBoard.tsx`, sin dependencias nuevas.
  - R2 Edges tipados: selector relacionada/depende de/bloquea (+ etiqueta libre) en `LabeledEdge`; persistencia en `board.canvas` vía `label` canónico + `color` JSON Canvas ("3" ámbar / "1" rojo). Core: `classifyEdgeLabel`, `canvasEdgeColorForLabel`, `isApprovedStatus`, `getDependencyWarnings` en `sdd-core/src/board.ts`; `dependencyWarnings` en `getGateSummary` → `GET /api/gate` + tool `sdd_gate_summary`; chip ámbar en el semáforo y badge `⚠ dep` en la tarjeta dependiente (canvas y kanban).
  - R3 Tasks→issues: `POST /api/spec/:id/issues` → `packages/sdd-mcp/src/github.ts` (transporte, gh CLI vía execFile); título trazable `[specId] tarea`, body con enlace al bundle, idempotencia por título; errores bilingües por precondición (sin repo git, sin remote, gh ausente, gh sin auth, remote no resoluble). Panel visual en el drawer con resumen created/skipped/failed.
  - R4 Presencia: broadcast `presence {count}` en el hub SSE (`events.ts`) al conectar/desconectar; chip 👥 N en TopBar cuando count>1.
- Verificación real: builds+typecheck raíz y builder en verde; `mcp:test` extendido (edge tipado con color, warning aprobada→no aprobada, edges a notas no avisan, builders de título/body de issues) en verde; sandbox fresco (scratchpad/v4-test, :3399) con navegador — kanban consistente con canvas, toast+CTA, warning `⚠ 1 dep` y badge ámbar, cambio a "bloquea" invierte la dirección y retira el warning, presencia 👥 2→3→2 con conexiones concurrentes, error bilingüe de issues mostrado en el drawer. Camino gh verificado sin tocar repos reales (sin scope delete_repo no se creó repo desechable): errores reproducidos con curl/PATH restringido y `gh repo view` de solo lectura contra remote inexistente. 3 scripts SDD en 0 errores.
