# Tareas 018 - Un logo propio

## H1 — El proyecto tiene símbolo

- [x] **T1a** Símbolo adaptativo en `site/public/favicon.svg`, sustituyendo el de Astro.
- [x] **T1b** El mismo símbolo en `docs/assets/logo.svg`, para README y materiales.
- [x] **T1c** Revisado a 16 px: la letra no se cierra.

## H2 — La cabecera lo muestra en los dos temas

- [x] **T2a** `logo-light.svg` y `logo-dark.svg` de color fijo en `site/src/assets/`.
- [x] **T2b** `astro.config.mjs` declara `logo.light`, `logo.dark` y su texto alternativo.
- [x] **T2c** `npm run build` en `site/` sin errores.
- [x] **T2d** Comprobado en navegador con el **interruptor del sitio**, claro y oscuro.

## H3 — El builder lleva la marca *(ampliación aprobada el mismo día)*

- [x] **T3a** `Logo.tsx`: SVG en línea con `currentColor`, un solo dibujo para los dos temas.
- [x] **T3b** La cabecera del builder muestra el símbolo en lugar del 🌱.
- [x] **T3c** `builder/public/favicon.svg`, sustituyendo el emoji embebido como URI de datos.
- [x] **T3d** Comprobado que Vite reescribe el icono con la base `/builder/`.
- [x] **T3e** `npm run build` del builder (con `tsc --noEmit`) y `npm run mcp:test` en verde.
- [x] **T3f** Comprobado en navegador en claro y en oscuro: el símbolo se invierte solo.
- [x] **T3g** Verificado que nada dependía del texto `🌱 SDD Builder`, y que la copia del builder
      dentro del paquete MCP no está versionada: `prepack` la regenera.

## Verificación de cierre

- [x] Los cuatro scripts SDD en 0 errores.
- [x] Bitácora diaria y entrada de historial de la spec.
- [x] `specs/INDEX.md` actualizado.
