# Investigación 024 - núcleo con pruebas

## Hallazgos

- **Cero pruebas de lógica.** `find builder/src packages/*/src -name '*.test.*'` → 0 archivos (verificado 2026-07-23). La única verificación ejecutable son los smoke de `scripts/` (`smoke-test-mcp-http.mjs`, `smoke-test-npm-package.mjs`, `probe-mcpb-stdio.mjs`…), que cubren arranque y transporte, no dominio.
- **La regla de estado ya divergió una vez.** `bitacora/decisiones/2026-07-21-una-sola-regla-de-estado-de-spec.md` documenta que `isApprovedStatus`/`specTone` estaba duplicada en cuatro sitios divergentes y *"sobrevivió tres releases de features (specs 007, 008, 009) sin que nadie la notara"*. Se colapsó en `sdd-core`, pero **sin una prueba que fije el resultado**, nada impide que vuelva a divergir. Ese es el caso de negocio más fuerte de esta spec.
- **Espejo declarado sin verificación.** `builder/src/sections.ts` mantiene una copia de `isApprovedStatus` anotada *"Mirror of sdd-core — keep in sync"*. Un comentario no es un test.
- **El mercado lo espera.** Kiro y Tessl venden «specs ejecutables» / property-based tests como diferenciador (búsqueda 2026-07-23). El template ya tiene el hueco de «Propiedades de la spec» en su plantilla; sin runner, ese hueco no puede cumplirse.

## Decisiones derivadas de los hallazgos

- **Vitest, no Jest.** El builder es Vite 6; Vitest reusa la config y el pipeline ESM/TS sin un segundo transpilado. Jest exigiría `ts-jest` o Babel y una config paralela.
- **Apuntar a la lógica, no a la UI.** El valor está en `convert`, `board`, `ears` — donde una regresión corrompe datos del usuario. Los componentes React de presentación quedan para una spec de E2E posterior.
- **El gate debe exigir verde.** De lo contrario las pruebas serían decorativas y volveríamos a confiar en «nadie lo notó».
