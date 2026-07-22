# Especificación 017 - El menú de la documentación: un idioma, y guías agrupadas

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-22`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-22 — sobre la decisión abierta el autor eligió *«Cambiar + redirecciones»*, y sobre la agrupación de siete grupos *«Sí, adelante»*.

## Contexto

El sitio publicado en `juanklagos.github.io/spec-driven-development-template` muestra un menú
lateral inservible. Verificado sobre el HTML ya construido en `site/dist`: la página
`/es/guides/51-guia-visual-sdd-builder/` tiene **103 enlaces** en el sidebar, no 52. Aparecen en
pares — «Introducción / Introduction», «Estructura detallada / Detailed structure» — y **los 103
apuntan a `/es/`**, así que la mitad inglesa se sirve traducida a medias bajo la URL española.

La causa es una regla de Starlight: **empareja las traducciones por ruta de archivo, no por número
de guía.** `docs/es/00-introduccion.md` y `docs/en/00-introduction.md` comparten el número pero no
el nombre, así que Starlight no las reconoce como la misma página: mete las dos en el menú y sirve
la inglesa bajo `/es/` como respaldo. Lo mismo con las 52 guías (`09-release-checklist.md` es la
única con nombre idéntico en los dos idiomas, y es la única que no se duplica: 52 + 52 - 1 = 103).

Encima de eso, el menú es **una sola lista plana** (`autogenerate: { directory: 'guides' }` en
`site/astro.config.mjs:31-34`). Aunque se arreglara el idioma, 52 entradas seguidas ordenadas por
número de archivo no le dicen a nadie por dónde empezar: la guía de bienvenida y el «Kit de medios»
pesan lo mismo, y las insignias de nivel (`Básico`, `Referencia`) son lo único que orienta.

## Objetivo

Que el menú lateral de la documentación esté en un solo idioma —el de la página— y que sus 52 guías
estén agrupadas por lo que alguien quiere hacer, en vez de por número de archivo.

## Historia de usuario principal

Como alguien que abre la documentación por primera vez, quiero un menú en **mi** idioma y agrupado
por lo que quiero hacer, para saber por dónde empezar sin leer 103 títulos.

## Escenarios de aceptación

1. Dado el sitio construido, cuando abro cualquier página en español, entonces el menú lateral tiene
   52 entradas y **ninguna** en inglés.
2. Dado el sitio construido, cuando abro cualquier página en inglés, entonces el menú lateral tiene
   52 entradas y ninguna en español.
3. Dado el menú, cuando lo miro sin saber nada del proyecto, entonces las guías están en grupos con
   nombre en mi idioma, y el primero es el de empezar.
4. Dado un grupo, cuando entro por primera vez, entonces solo el grupo de inicio está desplegado; el
   resto está plegado y el que contiene la página actual se abre solo.
5. Dada una URL española anterior (`/es/guides/00-introduccion/`), cuando la abro, entonces llego a
   la misma guía y no a un 404.
6. Dado el sitio construido, cuando reviso los enlaces internos entre guías, entonces ninguno apunta
   a una ruta que ya no existe.

## Requisitos funcionales

- **RF1** — Las guías sincronizadas se escriben con **el mismo nombre de archivo en los dos
  idiomas**, emparejadas por el número de dos dígitos que ya comparten.
- **RF2** — El menú deja de autogenerarse: pasa a ser una lista curada de grupos, con etiquetas
  traducidas ES/EN, y cada guía en exactamente un grupo.
- **RF3** — Las 52 guías siguen apareciendo. Ninguna se queda fuera del menú.
- **RF4** — Las URLs españolas anteriores redirigen a la nueva ruta.
- **RF5** — Los enlaces entre guías que reescribe el sincronizador apuntan al nombre unificado.

## Requisitos no funcionales

- El emparejamiento se hace por número, sin tabla escrita a mano que se desincronice.
- Si aparece una guía nueva sin par en el otro idioma, el sincronizador lo dice en voz alta.
- Si una guía queda fuera de los grupos del menú, la construcción falla en vez de esconderla.

## Fuera de alcance

- Traducir o reescribir el contenido de las guías.
- Cambiar las insignias de nivel (`Básico`/`Beginner`…), que se mantienen.
- El menú del builder y el del panel MCP, que son otra superficie.

## Decisión resuelta en la aprobación

Unificar los nombres cambia las URLs españolas: `/es/guides/00-introduccion/` pasa a
`/es/guides/00-introduction/`. Es el precio de la regla de Starlight — el emparejamiento es por ruta
y no hay forma de conservar dos nombres distintos sin volver a duplicar el menú. El autor eligió
cambiarlas **con** redirecciones (RF4), de modo que ningún enlace publicado se rompe, y aprobó el
reparto de siete grupos del plan.
