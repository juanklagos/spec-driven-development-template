# Plan 026 - tema de la documentación

## Resumen

Aplicar a Astro Starlight el lenguaje visual de delphitools (mono iA Writer
Quattro, esquinas rectas, borde 1px, asides marcados, ticker) con los tokens de
color propios del builder y el verde 🌱 como acento primario, sin tocar el
contenido de las guías. Registrar el ajuste de alcance de la spec 018.

## Contexto técnico

- Starlight 0.41 expone su tema por variables CSS (`--sl-color-*`, `--sl-font`)
  y admite `customCss` en la config. No hace falta ejectar componentes para el
  grueso del tema.
- iA Writer Quattro (SIL OFL) se distribuye en `iaolo/iA-Fonts` (GitHub) en
  woff2 — auto-hospedable en `site/src/fonts/`.
- Los tokens ya existen y están probados de facto en `builder/src/styles.css`
  (claro y oscuro, oklch). El trabajo es mapearlos, no inventarlos.

## Fases de implementación

1. **Fuente.** Descargar Regular/Bold/Italic woff2 a `site/src/fonts/` + OFL. `@font-face` en el tema.
2. **Tema base.** `theme.css`: mapear tokens SDD → variables Starlight (bg, text, gray-1..7, accent-low/-/high, white/black), `--sl-font`, `border-radius:0`. Claro y oscuro.
3. **Registrar** `customCss` en `astro.config.mjs`.
4. **Detalles.** Asides (borde izq. 4px + fondo card, 4 tipos → colores SDD), cards/badges, foco verde. Logo monocromo intacto.
5. **Ticker.** Añadir si encaja con un override ligero de la home; si exige tocar componentes internos de Starlight, se documenta como mejora aparte (no bloquea la spec).
6. **Verificar.** `npm run build` en `site/`; dev server; capturas claro/oscuro; Network sin fuentes externas.
7. **Registrar decisión** del verde primario (ajuste de 018) y documentar el origen de los tokens.

## Dependencias

- Ninguna spec previa la bloquea. Relación con 018 (marca/estado): esta spec ajusta su alcance para el sitio, con decisión registrada.

## Hitos

- H1: la home de docs renderiza con iA Writer Quattro y el acento verde.
- H2: claro y oscuro correctos, contraste verificado.
- H3: `npm run build` verde, sin red externa para fuentes.

## Riesgos

- **Contraste del verde sobre fondo claro** para texto pequeño (enlaces): verificar AA. Mitigación: usar el verde para peso/acento y bordes, no para párrafos largos.
- **Choque marca/estado** (lo que 018 advirtió): el verde ahora es acento y estado a la vez. Mitigación: el significado de estado se ancla en etiquetas ("Aprobado/Hecho") y badges, no solo en el color; el logo sigue monocromo.
- **Overrides de Starlight** para el ticker: si requiere reemplazar un componente, sube el costo. Mitigación: dejar el ticker como opcional/aparte.
- **Actualizaciones de Starlight** que renombren variables: el tema depende de `--sl-color-*`; anotar la versión (0.41) en el CSS.
