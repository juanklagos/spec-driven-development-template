# Tareas 026 - tema de la documentación

> Aprobada y consentida el 2026-07-23 (pregunta de decisión: «verde primario» + «crear spec 026 y construir»).

- [x] T1 (R1): iA Writer Quattro auto-hospedada (Regular/Bold/Italic/BoldItalic woff2, ~172 KB) en `site/src/fonts/` + licencia OFL (`LICENSE-iA-Writer-Quattro.md`); `@font-face` en `theme.css`. Verificado: se sirve desde `/_astro/...woff2` (200), cero peticiones externas.
- [x] T2 (R2): `site/src/styles/theme.css` — tokens SDD (oklch del builder) mapeados a variables de Starlight (`--sl-color-*`, `--sl-font`), claro y oscuro; `border-radius: 0` global.
- [x] T3 (R3): `customCss: ['./src/styles/theme.css']` registrado en `site/astro.config.mjs`.
- [x] T4 (R4): acento verde primario (logo-texto, nav activo con barra verde, enlaces, foco); logo (símbolo) monocromo preservado; amber/azul disponibles.
- [x] T5 (R6): asides con borde izq. 4px + fondo card, 4 tipos → colores SDD. Verificado en `/en/download/` (aside caution = amber, borde 4px, radius 0).
- [~] T6 (R5): **ticker diferido a propósito.** Añadirlo a la home exige ejectar/override de un componente de Starlight (Hero/Head), lo que la spec permite dejar como mejora aparte para no inflar esta entrega. El patrón vive en el mockup (`scratchpad/docs-theme-mockup.html`) listo para cuando se quiera. No bloquea la spec.
- [x] T7 (R7): `npm run build` en `site/` en verde (109 páginas). Capturas claro y oscuro. Network: fuentes locales, sin CDN externo.
- [x] T8 (R8): decisión del verde primario registrada (`bitacora/decisiones/2026-07-23-verde-primario-en-la-docs.md`); origen de los tokens documentado en la cabecera de `theme.css`.
