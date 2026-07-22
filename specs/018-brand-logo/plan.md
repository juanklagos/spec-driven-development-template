# Plan 018 - Un logo propio

## Resumen

Cuatro archivos SVG y dos líneas de configuración. El símbolo es una sola geometría reutilizada; lo
único que cambia entre archivos es cómo se resuelve el color.

## Contexto técnico

**Por qué la letra es una máscara y no un relleno.** La `s` está **recortada**: es el hueco del
cuadrado, no una forma encima. Así el logo tiene una silueta propia y el fondo que se ve por dentro
es el del sitio que lo aloja, sea cual sea. Se implementa con `<mask>`: rectángulo blanco de fondo y
las cinco piezas de la letra en negro.

**Por qué dos archivos para la cabecera y uno para el favicon.** El navegador sí evalúa
`prefers-color-scheme` dentro de un SVG usado como favicon, y por eso ahí basta un archivo adaptativo
—es lo que ya hace el favicon de Astro que se sustituye—. Pero un SVG embebido como `<img>` está en
otro documento: no ve el `data-theme` que el interruptor de Starlight escribe en la raíz, así que
seguiría al sistema operativo. Con el sistema en claro y el sitio en oscuro, el logo saldría negro
sobre negro. Starlight resuelve esto con `logo.light` y `logo.dark`, dos archivos de color fijo.

**Geometría.** Lienzo 96×96. Cuadrado en 6,6 de 84×84 con `rx` 20. Letra entre x 24-72 e y 18-78:
tres barras de 13 de alto y dos conectores de 13 de ancho, todos con `rx` 6.5. Los huecos entre
barras miden 10.5, que es lo que decide si la letra se cierra a 16 px.

## Fases de implementación

1. El símbolo adaptativo, en `site/public/favicon.svg` y `docs/assets/logo.svg`.
2. Las dos variantes fijas en `site/src/assets/`, para la cabecera.
3. `astro.config.mjs` declara el logo de Starlight.
4. Verificación en el sitio construido y en el navegador, en los dos temas.

## Dependencias

- Ninguna. No toca la spec 017 ni el sincronizador de guías.

## Hitos

- **H1** — el proyecto tiene símbolo, y la pestaña deja de anunciar Astro.
- **H2** — la cabecera lo muestra bien en los dos temas del sitio.

## Riesgos

- **El logo desaparece en un tema.** Es el fallo probable de este cambio, y el motivo de RF4.
  Mitigación: dos archivos fijos, y comprobación en navegador con el interruptor del sitio, no con
  el del sistema.
- **La letra se cierra a tamaño pequeño.** Mitigación: huecos de 10.5 sobre barras de 13, revisado a
  16 px antes de fijar la geometría.
