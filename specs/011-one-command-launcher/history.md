# History 011 - one-command-launcher

## 2026-07-21

- Spec creada tras la evaluación de la app de escritorio. El hallazgo que la motiva: el builder no viaja en el paquete npm (`files: ["dist"]`, `static.ts` "checkout-only by design"), así que hoy hay que clonar el repo — 752 KB de estáticos separan el estado actual de "un comando".
- Aprobada por el autor ("has lo mejor a corto y largo plazo"); consentimiento registrado. Implementación en espera de que aterricen los arreglos críticos (comparten archivos).
| 2026-07-21 | Implementation / Implementación | T1 (R1) completo. `builder/dist` viaja en `@juanklagos/sdd-mcp` como `dist/builder-ui`, dentro del `files: ["dist"]` que ya existía — la ruta que R1 nombra, y que además esquiva `EXCLUDED_NAMES` de `build-framework-payload.mjs`, donde `"dist"` filtrado por `basename` habría copiado cero archivos sin lanzar error. `static.ts` resuelve checkout primero y paquete después. Verificado sirviendo `/builder` desde una instalación limpia de npm: HTML 200 y bundle de 711 KB 200. Tarball de 72K a 304K. | `scripts/build-builder-ui.mjs`, `packages/sdd-mcp/{package.json,src/static.ts}`, `scripts/smoke-test-npm-package.mjs` | Claude |
