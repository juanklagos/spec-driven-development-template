# Historial 033 - Documentación por tipos

- 2026-08-12 — Creación. Origen: la revisión a fondo de documentación pedida
  por el propietario dejó un hallazgo estructural sin resolver — las guías
  mezclan enseñar, hacer, consultar y explicar en el mismo archivo — y el
  propietario pidió resolverlo ("por eso, ayúdame a resolverlo"). Alcance
  deliberadamente acotado: tipar las 54 guías, agrupar el menú por necesidad
  y partir solo la 51, que es la única que mezcla los cuatro tipos. Fuera de
  alcance: renumerar (los números son identificadores públicos) y reescribir
  la prosa de las demás guías.

- 2026-08-13 — Aprobada e implementada, T1-T9. `GUIDE_TYPES` en
  `site/src/guides.mjs` es ahora la fuente única: de ahí salen la cabecera de
  cada guía y el menú del sitio, así que no pueden discrepar.
  `scripts/sync-doc-types.mjs` escribió la cabecera en las 110 guías (55 × 2
  idiomas) entre marcadores; la segunda ejecución escribió 0, que es la
  prueba de idempotencia de T3. La guía 51 dejó de mezclar los cuatro tipos:
  sus tablas de referencia —acciones de ⌘K, atajos, filtros y los siete
  clientes— viven ahora en la guía 54, con enlace desde donde estaban.
  Corrección durante la implementación: la primera versión del comprobador de
  enlaces daba 216 falsos positivos en el sitio, porque trataba como rutas de
  archivo lo que son URLs generadas por `sync-docs.mjs`. Se reescribió para
  verificar el sitio ya construido: cada `href` interno debe tener una página
  detrás. Las tres superficies —repositorio, paquete npm y sitio— en cero.
  Verificado: `npm run docs:links` en verde, sitio con 115 páginas, 55 guías
  emparejadas y cubiertas por el menú.
