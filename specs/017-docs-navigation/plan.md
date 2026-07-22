# Plan 017 - El menú de la documentación

## Resumen

Dos cambios que se apoyan uno en otro. Primero el sincronizador escribe las guías españolas con el
nombre inglés, que es lo único que hace que Starlight las reconozca como traducciones. Con el menú
ya limpio de duplicados, se sustituye el autogenerado por siete grupos curados con etiqueta
traducida. Ni el contenido de `docs/` ni las guías en sí se tocan.

## Contexto técnico

**Por qué el nombre y no el número.** Starlight resuelve la traducción de una entrada quitando el
prefijo de idioma de su ruta y buscando la ruta idéntica en el resto de locales. `es/guides/
00-introduccion` y `en/guides/00-introduction` reducen a rutas distintas, así que son dos páginas
distintas para él, y las dos entran en el menú del idioma actual. No hay opción de configuración
que empareje por otro criterio: el nombre tiene que coincidir.

**Dónde se decide el nombre.** En `site/scripts/sync-docs.mjs:83`, que hoy copia el nombre de origen
en minúsculas. El repositorio (`docs/es/*.md`) conserva sus nombres españoles; lo que cambia es el
nombre con el que la guía **se publica**. El mapa número → nombre inglés se construye leyendo
`docs/en/`, no se escribe a mano.

**Los enlaces.** El sincronizador ya reescribe enlaces entre guías
(`sync-docs.mjs:53-57`). Los dos patrones —mismo idioma y cruzado— pasan por la misma función de
resolución de nombre, así que con normalizar ahí queda cubierto.

**Los grupos.** Un `sidebar` explícito con `label` + `translations.es` por grupo, y las guías
referenciadas por `slug` relativo (`guides/00-introduction`), que Starlight resuelve al idioma de la
página. Cada guía en un grupo y solo uno; el reparto sale del número, que ya es estable.

## Agrupación propuesta (52 guías, ninguna suelta)

| Grupo (EN / ES) | Guías |
|---|---|
| **Start here / Empieza aquí** *(desplegado)* | 00, 13, 23, 02, 04, 05 |
| **Learn SDD / Aprende SDD** | 18, 14, 15, 25, 12, 11, 21, 20 |
| **Work with AI agents / Trabaja con agentes de IA** | 03, 10, 19, 26, 30, 49, 16, 17 |
| **Visual builder & MCP / Builder visual y MCP** | 51, 33, 43, 41, 44, 45, 47, 48, 36 |
| **Real projects / Proyectos reales** | 01, 42, 27, 22, 28, 29, 07, 08 |
| **Reference / Referencia** | 06, 40, 24, 37, 09, 31 |
| **Project & releases / Proyecto y lanzamientos** | 35, 34, 38, 39, 46, 32, 50 |

6 + 8 + 8 + 9 + 8 + 6 + 7 = 52.

## Fases de implementación

1. El sincronizador empareja por número y publica ambos idiomas con el nombre inglés; los enlaces
   reescritos usan ese mismo nombre. Aviso en voz alta si un número no tiene par.
2. El menú explícito con los siete grupos y las etiquetas traducidas, en lugar del autogenerado.
3. Redirecciones de las 52 URLs españolas anteriores, generadas por el sincronizador —no escritas a
   mano— y leídas por `astro.config.mjs`.
4. Verificación sobre el HTML construido: conteo de entradas por idioma y ausencia de enlaces rotos.

## Dependencias

- La fase 2 depende de la 1: agrupar por `slug` no sirve mientras existan dos rutas por guía.
- La fase 3 depende de la 1: solo entonces se sabe cuál es el nombre viejo y cuál el nuevo.

## Hitos

- **H1** — un menú por idioma, sin mezcla (fases 1 y 3).
- **H2** — el menú se entiende: siete grupos en el idioma de la página (fase 2).
- **H3** — verificado sobre el sitio construido, no sobre la intención (fase 4).

## Riesgos

- **Las URLs españolas cambian.** Mitigación: redirecciones generadas junto a los archivos, así que
  no pueden quedar desfasadas.
- **Una guía nueva podría quedar fuera del menú curado y desaparecer.** Mitigación: comprobación en
  el sincronizador que falla si algún número no está en exactamente un grupo.
- **`docs/` y el menú viven en sitios distintos.** Mitigación: el reparto se declara una sola vez, en
  un módulo que importan el sincronizador y `astro.config.mjs`.
