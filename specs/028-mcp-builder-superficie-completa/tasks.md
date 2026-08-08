# Tareas 028 - superficie completa MCP + builder

> Creado el 2026-08-08 tras análisis de huecos MCP/REST/Builder. Spec aprobada el 2026-08-08 (consentimiento en `.sdd/user-consent.log`); T1-T9 cerradas el 2026-08-08.

- [x] T1 (R2): `packages/sdd-core/src/legacy.ts` — port TS de `legacy-discovery.sh` (señales de rutas y flujos, 4 caminos de specs sugeridas, reporte en `analysis/legacy-discovery/`, sin `rg`) + tests.
- [x] T2 (R4): `renameSpecTask`, `removeSpecTask`, `moveSpecTask` en `board.ts` (vía `mutateSpecDocument`, devuelven tareas con líneas) + tests (preservación, líneas inválidas).
- [x] T3 (R5): `updateSpecIndexRow` en core (una sola fila de `specs/INDEX.md`; error si la spec no existe) + tests con tabla adversaria.
- [x] T4 (R1, R3): herramientas `sdd_check_policy` y `sdd_write_spec_document` en `server.ts` (delegan en `checkPolicy` y `writeSpecDocument`; lista blanca de 5 documentos) + shapes en `schemas.ts`.
- [x] T5 (R2, R4, R5): herramientas `sdd_legacy_discovery`, `sdd_rename_task`, `sdd_remove_task`, `sdd_move_task`, `sdd_update_spec_status` en `server.ts` + exports en core. Superficie 28 → 35.
- [x] T6 (R6): endpoints REST en `api.ts` — `POST /api/spec/:id/tasks`, `GET /api/spec/:id/score`, `GET/POST /api/bitacora/:kind`, `POST /api/status`, `POST /api/roadmap`.
- [x] T7 (R7): Builder UI — drawer con puntaje + notas y resumen EARS (`ears.ts`), campo de añadir tarea, modal de bitácora (decisión/daily/handoff), botones STATUS/roadmap en TopBar; llamadas nuevas en `builder/src/api.ts`.
- [x] T8 (R8): verificación — vitest core en verde, `typecheck`/`build` ambos paquetes, `smoke-test-mcp.mjs` (contrato 35), smoke HTTP, `test-mcp-integration.mjs`, E2E de las 7 herramientas + endpoints contra proyecto externo temporal, build del Builder, `validate-sdd.sh`.
- [x] T9 (R9): docs — `docs/es/41` + `docs/en/41` (7 herramientas nuevas) y `docs/es/51` + `docs/en/51` (capacidades nuevas del Builder).
