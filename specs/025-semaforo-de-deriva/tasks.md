# Tareas 025 - semáforo de deriva spec↔código

> Aprobada y consentida el 2026-07-23 («continue»). Implementada la misma sesión.
> Depende de la spec 024 (runner de pruebas) — hecha.

- [x] T1 (R1): parser del ámbito de archivos. Ya existía `extractFileScope` en `sdd-core` (`fileScope` en `SpecSummary`); se reusa. La deriva lo consume tal cual.
- [x] T2 (R2): fecha base. Nuevo `extractApprovalDate` en `packages/sdd-core/src/workspace.ts`; una fecha no-ISO (placeholder/vacía) → estado `unknown` (no compara contra fecha falsa). No se añade a `SpecSummary` (esa forma está asertada en 5 campos por `sdd_list_specs`): `getBoardView` la lee donde la necesita.
- [x] T3 (R3): consulta git acotada. `packages/sdd-core/src/drift.ts` — `git log --since='<fecha> 23:59:59' --max-count=20` vía `execFile` (sin shell) con timeout 5 s; `git rev-parse --is-inside-work-tree` para degradar limpio si no es repo git. Nunca lanza: cualquier fallo → `unknown`.
- [x] T4 (R4): campo `drift` en `BoardSpecCard`, calculado una vez en `getBoardView` (como `tone`); añadido `specDriftSchema` + `drift` a `packages/sdd-mcp/src/schemas.ts` (el guardrail de integración lo exige). Verificado por `scripts/test-mcp-integration.mjs`.
- [x] T5 (R5): chip ámbar `🔀 N` en `SpecNode.tsx` (solo estado `drifted`) y panel «Deriva spec ↔ código» con la lista de commits en `SpecDrawer.tsx`. Sin recalcular en cliente; i18n ES/EN. Verificado en vivo sobre un workspace git de demo.
- [x] T6 (R6): pruebas. `packages/sdd-core/src/drift.test.ts` (8: short-circuits + repo git real con fechas controladas) y `board.test.ts` extendido con `getBoardView` drifted/clean end-to-end sobre repo git. **68 pruebas verdes** en total.
- [~] T7 (R7): la **tool MCP** del board ya expone `drift` (schema + integración en verde) → un agente lo ve. El indicador en el **dashboard HTML** (`dashboard.ts`) queda como mejora aparte, análoga al ticker de la 026: la señal ya viaja por el canal que un agente consume; el HTML humano es secundario. Anotado, no escondido.
- [x] T8 (R8): documentación EN/ES en la guía 51 (sección «The drift semaphore / El semáforo de deriva»): significado, «señal no veredicto», sin LLM ni red.
- [x] T9: verificación end-to-end en repo real. Demo git (`001-pagos` con commit posterior al ámbito → `drifted` con el commit exacto; `002-perfil` → `clean`); el drawer mostró el commit `d38b3c6`. Además cubierto por prueba en `board.test.ts`.
