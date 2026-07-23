# Tareas 024 - núcleo con pruebas

> Aprobada y consentida el 2026-07-23 («arranca»). Implementación en la misma sesión.

- [x] T1 (R1): Vitest instalado en la raíz (workspace, `vitest@^3`) y en `builder/`; `npm run test:unit` en la raíz corre los 57 en una pasada; `npm test` = `test:unit` + `mcp:test` (smoke conservado).
- [x] T2 (R2): pruebas de `sdd-core/board.ts` — `isApprovedStatus` (tabla de verdad de 17 casos incl. negaciones), `specTone` (anti-patrón «marcadas sin aprobar» → nunca `done`, spec sin tareas → `ok`), y `getBoardView` sobre un workspace SDD temporal (paridad de `tone` en el camino real de lectura). `packages/sdd-core/src/board.test.ts`, 23 pruebas.
- [x] T3 (R3): pruebas de `builder/convert.ts` — round-trip board↔canvas (nota con color/posición/tamaño, referencia a spec, file-node no-spec preservado), edges tipados con color re-derivado, `edgeKind`, y specs ausentes anexadas. `builder/src/convert.test.ts`, 8 pruebas.
- [x] T4 (R4): pruebas de `builder/ears.ts` — esqueleto EARS (CUANDO/WHEN/SI/IF/MIENTRAS/WHILE … DEBERÁ/SHALL), viñeta/plural/sin acento, palabra vaga sin número, ES y EN. `builder/src/ears.test.ts`, 9 pruebas.
- [x] T5 (R5): espejo mecánico. `packages/sdd-core/src/approval-cases.fixture.ts` es la tabla de verdad compartida; `board.test.ts` verifica el original y `builder/src/sections.test.ts` (17 pruebas) verifica `isApprovedStatusText` contra la MISMA tabla. Si divergen, una suite se pone roja.
- [x] T6 (R6): `npm test` en la raíz agrega unitarias + smoke. Nota de alcance (ver history): el gate bash (`check-sdd-gate.sh`) se mantiene offline/estructural a propósito; la exigencia de pruebas verdes vive en `npm test` y en CI, que es «su equivalente» en los términos de R6.
- [x] T7 (R7): paso «Unit tests (Vitest — sdd-core + builder)» añadido a `.github/workflows/mcp.yml`, tras la instalación de deps del builder (que las pruebas del builder necesitan). Corre por push/PR a `main`; los smoke siguen intactos.
- [x] T8 (R8): sección «Pruebas / Tests» EN/ES en `builder/README.md` y `packages/sdd-core/README.md` — cómo correr, cómo añadir, y la exclusión de tests/fixtures del `dist`.
- [x] T9: la prueba de la prueba. Regresión deliberada en `specTone` (devolver `done` sin comprobar aprobación) → 2 pruebas rojas exactamente en el anti-patrón `001-pendiente` → `done`; revertida; 57 verdes de nuevo. Registrado en history.
