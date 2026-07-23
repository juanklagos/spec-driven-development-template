# Especificación 026 - tema de la documentación (estilo delphitools, colores SDD)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-23`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-23 — el propietario compartió `tools.rmv.fyi` («me gusta ese tipo de diseño, quisiera replicarlo para la documentación»), pidió «pero utiliza nuestros colores», y en la pregunta de decisión eligió **«verde primario (como el mockup)»** + **«crear spec 026 y construir»**. Mockup revisado en `scratchpad/docs-theme-mockup.html`. Consentimiento en `.sdd/user-consent.log`.

## Objetivo / Objective

Dar a la documentación (Astro Starlight) el lenguaje visual de delphitools —tipografía monoespaciada iA Writer Quattro, esquinas rectas, borde 1px, ticker, asides marcados— usando los colores propios del template (los tokens `oklch` del builder), con el verde 🌱 como acento primario. / Give the Starlight docs delphitools' visual language — iA Writer Quattro mono type, square corners, 1px borders, a ticker, marked asides — using the template's own colors, with green as the primary accent.

## Historia de usuario principal

Como dueño del template, quiero que la documentación se sienta como una herramienta indie con carácter (el estilo de `tools.rmv.fyi`) pero con la identidad de color de SDD, para que la docs deje de verse como un tema por defecto y sea reconociblemente nuestra.

## Contexto y decisiones previas (verificado)

- La docs es **Astro Starlight 0.41** sin CSS propio (`site/`, `customCss` ausente en `astro.config.mjs`). Terreno limpio.
- delphitools (`tools.rmv.fyi`) es **shadcn/ui con paleta custom** sobre Next.js. Lo replicable es el sistema (fuente + tokens + tratamiento), no las ilustraciones a mano.
- Fuente: **iA Writer Quattro**, licencia **SIL OFL** → auto-hospedable, coherente con MIT y con «sin peticiones externas».
- **Tensión con la spec 018:** 018 reservó el verde `#16a34a` para **estado** («esto pasó»), no para marca, y dejó el logo monocromo, *para que marca y estado no compitan por el mismo color*. Usar verde como acento primario en la docs reintroduce esa competencia. **El propietario lo eligió con esa advertencia a la vista** (pregunta de decisión, 2026-07-23). Se registra la decisión que ajusta el alcance de 018 **para el sitio de docs**: ver `bitacora/decisiones/2026-07-23-verde-primario-en-la-docs.md`.

## Escenarios de aceptación

1. Dado el sitio construido, cuando se abre cualquier guía, entonces el cuerpo usa iA Writer Quattro (auto-hospedada, sin llamada a CDN externo) con fallback a `ui-monospace`.
2. Dado el tema claro y el oscuro, cuando el usuario alterna, entonces los colores son los tokens SDD (fondo/ texto/ borde slate, acento verde 🌱) en ambos, sin texto ilegible ni contraste roto.
3. Dado que 018 reserva el verde para estado, cuando se aplica el verde primario, entonces el **logo permanece monocromo** (018 RF2 intacto) y el significado de estado se preserva por contexto (asides etiquetados «Aprobado/Hecho», badges), no solo por color.
4. Dado un aside de Starlight (note/tip/caution/danger), cuando se renderiza, entonces lleva borde izquierdo de color y fondo `card`, al estilo del mockup.
5. Dado el sitio, cuando se construye (`npm run build` en `site/`), entonces compila sin error y sin peticiones de red a fuentes externas.
6. Dado el idioma, cuando se cambia EN↔ES, entonces el tema se mantiene idéntico (el CSS no depende del idioma).

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se cargue cualquier página de la docs, EL SISTEMA DEBERÁ servir iA Writer Quattro desde `site/` (auto-hospedada) y NO DEBERÁ solicitarla a un dominio externo.
- CUANDO se apliquen los colores, EL SISTEMA DEBERÁ usar los tokens `oklch` del builder (`builder/src/styles.css`) mapeados a las variables de Starlight, en claro y oscuro.
- EL SISTEMA DEBERÁ mantener el logo monocromo (spec 018 RF2) aunque el acento sea verde.
- EL SISTEMA DEBERÁ fijar `border-radius: 0` (esquinas rectas) como parte del tratamiento.
- EL SISTEMA NO DEBERÁ modificar el contenido de las guías: el cambio es de tema (CSS + fuente + config), no de texto.
- SI el navegador no puede cargar la fuente, ENTONCES EL SISTEMA DEBERÁ degradar a `ui-monospace, monospace` sin romper el layout.

## Requisitos

- R1. **Auto-hospedar iA Writer Quattro** (Regular, Bold, Italic — woff2) en `site/src/fonts/`, con `@font-face` en el CSS de tema. Incluir la licencia OFL junto a los archivos.
- R2. **`site/src/styles/theme.css`**: mapear los tokens SDD a las variables de Starlight (`--sl-color-accent-*`, `--sl-color-bg`, `--sl-color-text`, `--sl-color-gray-1..7`, `--sl-color-white/black`, `--sl-font`), en claro y oscuro. `border-radius: 0` global.
- R3. **Registrar** el CSS en `astro.config.mjs` (`customCss: ['./src/styles/theme.css']`), sin tocar el resto de la config.
- R4. **Acento verde primario** (delphitools-style) para enlaces, nav activo, y foco; **logo monocromo** preservado; amber/azul del builder disponibles para badges/asides secundarios.
- R5. **Ticker opcional** (marquee) en la cabecera de la home de docs, reusando el patrón del mockup — si encaja sin componente extra; si exige un override de componente Starlight, queda como mejora aparte y se documenta.
- R6. **Asides con tratamiento**: borde izquierdo 4px + fondo `card`, mapeando los cuatro tipos de Starlight a los colores SDD (note=azul, tip/success=verde, caution=amber, danger=rojo).
- R7. **Verificación**: `npm run build` en `site/` en verde; captura clara y oscura desde el dev server; confirmación de que no hay peticiones a fuentes externas (Network).
- R8. **Documentar** la decisión de color (ajuste de 018) y anotar en la guía/README del sitio de dónde salen los tokens.

## Ámbito de archivos / File scope

- `site/src/styles/theme.css` — el tema (nuevo)
- `site/src/fonts/` — iA Writer Quattro auto-hospedada + OFL (nuevo)
- `site/astro.config.mjs` — registrar `customCss`
- `bitacora/decisiones/2026-07-23-verde-primario-en-la-docs.md` — el ajuste de la 018

## Fuera de alcance / Out of scope

- Reproducir las ilustraciones a mano de delphitools (logo/hero dibujados): son arte bespoke, no CSS.
- Cambiar el contenido de las guías o su estructura de navegación.
- Rediseñar el builder o el dashboard: esta spec es solo la documentación (`site/`).
- Migrar Starlight a otro framework.

## Criterios de éxito

- La docs abierta se ve como el mockup aprobado: mono, esquinas rectas, verde 🌱 de acento, en claro y oscuro.
- `npm run build` en `site/` en verde; cero peticiones a fuentes externas.
- El logo sigue monocromo; el verde de estado sigue legible como estado en los asides/badges.
