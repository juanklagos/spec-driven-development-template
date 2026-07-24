# Tareas 027 - cobertura completa de comandos MCP

> Aprobada y consentida el 2026-07-23 («cubre todo» a la propuesta de cobertura MCP).

- [x] T1 (R2): `packages/sdd-core/src/bitacora.ts` — `listBitacoraFiles` + `readBitacoraFile` (kinds handoffs|decisiones|diaria|global, guard anti-traversal) + tests (5).
- [x] T2 (R4): `addSpecTask` en `board.ts` (append `- [ ] texto` vía `mutateSpecDocument`, devuelve tareas actualizadas) + tests (4).
- [x] T3 (R3): `getSpecDriftReport(projectRoot, specId?)` en core, factorizando el cálculo inline de `getBoardView` en `driftForSummary` + tests (2, estados unscoped/unknown sin git).
- [x] T4 (R6): `scoreSpec` en `packages/sdd-core/src/score.ts` (paridad de heurísticas con `score-spec.sh`, pineada por tests de buckets 0/1/3/5 tareas) + tests (4).
- [x] T5 (R7): `installSidecar` en core (execFile de `scripts/install-spec-sidecar.sh`, patrón `createWorkspace`, guard de target). Decisión port-vs-execFile registrada en `bitacora/decisiones/2026-07-23-mcp-score-port-y-sidecar-execfile.md`.
- [x] T6 (R1-R7): las 7 herramientas registradas en `packages/sdd-mcp/src/server.ts` + shapes en `schemas.ts` + exports en core. Superficie: 21 → 28 herramientas.
- [x] T7 (R8): verificación — `vitest run` core 49/49 (15 nuevos), `typecheck`/`build` ambos paquetes, `smoke-test-mcp.mjs` (contrato de superficie actualizado a 28), `smoke-test-mcp-http.mjs`, `test-mcp-integration.mjs`, y E2E de las 7 herramientas contra proyecto externo temporal (sidecar → spec → add task → bitácora list/read/traversal-bloqueado → drift → lint → score → raíz del template rechazada): 11/11.
- [x] T8 (R9): referencia MCP actualizada — `docs/es/41-referencia-completa-mcp.md` y `docs/en/41-complete-mcp-reference.md` con las 7 herramientas.
