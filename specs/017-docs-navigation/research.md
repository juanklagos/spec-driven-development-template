# Investigación 017 - El menú de la documentación

Todo lo de aquí se midió sobre el HTML ya construido en `site/dist`, no sobre el código fuente.

## Hallazgos

1. **El menú español tiene 103 entradas, no 52.** Extraídas del `<nav>` de
   `site/dist/es/guides/51-guia-visual-sdd-builder/index.html`: 103 enlaces a `/guides/`, **los 103
   bajo `/es/`**. Aparecen en pares consecutivos: `00-introduccion`, `00-introduction`,
   `01-estructura`, `01-structure`… El orden alfabético de los nombres es lo que los intercala, y por
   eso el menú se ve «revuelto».

2. **La mitad son las guías inglesas servidas en español.**
   `/es/guides/00-introduction/` existe y es la guía inglesa. Es el respaldo de Starlight cuando una
   página no tiene traducción en el idioma pedido: como no reconoce que `00-introduccion` **es** su
   traducción, la considera sin traducir.

3. **La regla es el nombre de archivo.** `09-release-checklist.md` es la única guía con nombre
   idéntico en `docs/en/` y `docs/es/`, y es la única que aparece **una** vez en el menú.
   52 + 52 - 1 = 103, que es exactamente el conteo medido. El emparejamiento por nombre queda
   confirmado por el propio sitio.

4. **Los 52 números tienen par.** Recorridos `docs/en/` y `docs/es/`: todos los números de `00` a
   `51` existen en los dos idiomas. El mapa por número es completo, no hace falta caso especial.

5. **El menú es plano por configuración.** `site/astro.config.mjs:31-34` declara un único grupo
   «Guides / Guías» con `autogenerate: { directory: 'guides' }`. La etiqueta del grupo ya viene
   duplicada en los dos idiomas dentro de la misma cadena, que es el mismo síntoma en pequeño.

## Decisiones descartadas, y por qué

- **Conservar los nombres españoles con `slug` en el frontmatter.** Cambiaría la URL pero no la ruta
  del archivo, que es lo que Starlight empareja: el menú seguiría duplicado. No resuelve nada.
- **Suponer que el nombre del archivo es la URL.** Falso para dos guías: Astro pasa el nombre por
  `github-slugger`, que borra los puntos, así que `39-v1.2.0-preparation.md` se sirve en
  `39-v120-preparation/`. La referencia es `node_modules/astro/dist/content/utils.js:5`, que importa
  esa misma función; el menú y las redirecciones la reutilizan en vez de codificar el caso a mano.
- **Dos menús, uno por idioma, con enlaces absolutos.** Starlight antepone el idioma a un `slug`
  compartido; dos menús con rutas distintas duplican el mantenimiento y vuelven a permitir que se
  desincronicen, que es de dónde venimos.
