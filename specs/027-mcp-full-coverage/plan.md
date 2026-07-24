# Plan 027 - cobertura completa de comandos MCP

## Resumen

Añadir 7 herramientas al servidor MCP reutilizando lógica que ya existe:
lecturas (spec, bitácora), deriva por spec, alta de tareas, lint EARS, puntaje
de spec y sidecar para proyectos externos. Core primero (funciones probadas),
MCP después (registro delgado), docs al final.

## Contexto técnico

- El patrón de registro está establecido en `packages/sdd-mcp/src/server.ts`:
  `registerTool` + zod inputSchema/outputSchema + `structuredContent`. Las 7
  herramientas nuevas siguen ese molde sin excepción.
- `readSpecDocument`, `computeSpecDrift`, `validateEarsCriterion`,
  `mutateSpecDocument`, `extractApprovalDate`, `isApprovedStatus` y
  `resolveSddRoot` ya existen y están probados; el grueso del trabajo nuevo en
  core es bitácora (list/read con guard), `addSpecTask`, `scoreSpec` (port del
  bash) e `installSidecar` (execFile del script, patrón `createWorkspace`).
- El guard «no contra la raíz del template» ya existe para las herramientas
  actuales; las nuevas lo heredan usando las mismas primitivas de resolución.
- El payload de framework empaquetado (`build-framework-payload.mjs`) ya incluye
  `scripts/`, por eso `createWorkspace` funciona desde npm; `installSidecar`
  depende de lo mismo.

## Fases de implementación

1. **Core: bitácora.** `listBitacoraFiles` / `readBitacoraFile` en un módulo
   nuevo `bitacora.ts` (kinds fijos, guard anti-traversal, orden lexicográfico
   = cronológico por la convención YYYY-MM-DD). Tests.
2. **Core: tareas y drift.** `addSpecTask` en `board.ts` (junto a `setTaskDone`);
   `getSpecDrift(projectRoot, specId?)` que factoriza lo que hoy hace
   `getBoardView` inline. Tests.
3. **Core: score.** `scoreSpec` en módulo `score.ts`: mismas heurísticas que el
   bash (5 archivos ×4 pts, secciones spec ×6, plan 9, tareas 5/10/15,
   research ×5, history 6/12, tope 100) con regex JS en lugar de `rg`. Tests
   con fixtures mínimos.
4. **Core: sidecar.** `installSidecar` en `index.ts` (execFile bash del script,
   validación de target: existente, no raíz del template, no dentro del
   framework salvo `www/`).
5. **MCP.** Registrar las 7 herramientas en `server.ts`; shapes nuevos en
   `schemas.ts` (drift ya existe como `specDriftSchema`). Exportar lo nuevo en
   el índice de core.
6. **Verificación.** `vitest run` en core; `typecheck` + `build` en ambos;
   `scripts/smoke-test-mcp.mjs` (+ HTTP); `validate-sdd.sh`.
7. **Docs.** Añadir las 7 herramientas a la referencia MCP ES/EN.

## Dependencias

- Spec 025 (deriva): se reutiliza tal cual, no se toca.
- Spec 024 (núcleo con pruebas): las funciones nuevas de core siguen su
  convención de tests junto al código.

## Hitos

- H1: core nuevo probado en verde (fases 1-4).
- H2: las 7 herramientas visibles y funcionales por stdio y HTTP (fase 5-6).
- H3: docs actualizadas y validación SDD en verde (fase 7).

## Riesgos

- **Paridad del score con el bash:** el bash usa `rg` con matices de locale;
  mitigación: paridad de heurísticas declarada en la spec (no de bytes), tests
  con casos límite (0 tareas, 3, 5).
- **`installSidecar` desde npm:** si el payload no incluyera algún asset del
  script, fallaría solo en la instalación empaquetada; mitigación: smoke test
  del paquete npm ya existe (`smoke-test-npm-package.mjs`) y el script es el
  mismo que ya se distribuye.
- **Superficie de herramientas crece a 28:** más superficie de permisos en
  clientes; mitigación: descripciones precisas y sin herramientas redundantes
  (dependencias quedó fuera por ya existir en `gate_summary`).
