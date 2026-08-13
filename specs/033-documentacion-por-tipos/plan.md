# Plan técnico 033 - Documentación por tipos

## Idea central

Tipar sin mover. Los números de guía son identificadores públicos (sidebar,
`llms.txt`, enlaces cruzados, redirecciones heredadas), así que el cambio es
de **metadatos y agrupación**, no de nombres de archivo. Una sola fuente
decide el tipo de cada guía; de ahí salen la cabecera de los documentos y el
menú del sitio, y por eso no pueden discrepar (R2).

## Los cinco tipos

Cuatro de Diátaxis más uno propio para el material que no es documentación de
producto:

| Tipo | Necesidad del lector | Qué NO lleva dentro |
| :--- | :--- | :--- |
| Tutorial | «enséñame haciendo» | referencia exhaustiva, discusión de alternativas |
| Cómo-hacer | «ayúdame a lograr X» | explicación de conceptos desde cero |
| Referencia | «dime cómo es» | pasos guiados, opiniones |
| Explicación | «ayúdame a entender por qué» | instrucciones |
| Proyecto | material del repositorio, no del producto | — |

## Fases

1. **Clasificación (fuente única).** `GUIDE_TYPES` en `site/src/guides.mjs`:
   tipo por número de guía, y el orden de lectura dentro de cada tipo. Se
   valida contra los archivos reales: si aparece una guía nueva sin tipo, o
   un tipo apunta a una guía que no existe, falla.
2. **Cabeceras generadas.** `scripts/sync-doc-types.mjs` inserta (o
   actualiza) un bloque delimitado por marcadores HTML al principio de cada
   guía, en ambos idiomas. Delimitado porque tiene que poder reescribirse sin
   tocar el cuerpo: sin marcadores, la segunda ejecución duplicaría.
3. **Menú por tipo.** `buildSidebar()` pasa a agrupar por `GUIDE_TYPES` en
   vez de por los siete grupos temáticos actuales.
4. **La 51 deja de ser cuatro documentos.** Su contenido de referencia
   —acciones de ⌘K, dos tablas de atajos, tabla de siete clientes— se mueve a
   una guía nueva de referencia. La 51 conserva el recorrido y enlaza a ella
   desde donde estaba cada tabla.
5. **Estilo.** La guía 53 explica los cuatro tipos y cómo elegir.
6. **Verificación.** Comprobador de enlaces sobre `docs/`, el paquete y el
   sitio construido, más los smoke tests de siempre.

## Decisiones y alternativas

- **Tipar en vez de renumerar.** Renumerar por tipo (todos los tutoriales en
  1xx, referencias en 4xx…) sería más limpio en abstracto y rompería cada
  enlace publicado, el sidebar, `llms.txt` y las redirecciones heredadas.
  Rechazado: el coste cae entero sobre el lector que ya tenía un enlace.
- **Cabecera generada, no escrita a mano.** 108 archivos. A mano se
  desincroniza en la primera semana; con marcadores se regenera.
- **Un quinto tipo «proyecto».** Diátaxis tiene cuatro. Meter el kit de
  prensa o el roadmap dentro de «explicación» sería mentirle al lector.
  Rechazado forzarlos; se agrupan aparte y se dice qué son.
- **La 51 se parte, el resto no.** Es la única que mezcla los cuatro tipos y
  es la guía insignia. Partir las 54 en esta spec sería un diff irrevisable.

## Riesgos

- **Duplicar cabeceras al reejecutar.** Mitigado con marcadores y una prueba
  que ejecuta el generador dos veces y compara.
- **Un tipo mal asignado.** No rompe nada: se corrige en un sitio y se
  regenera.
- **Enlaces a secciones movidas de la 51.** Mitigado dejando en su sitio un
  enlace a la guía nueva.

## Cobertura requisito → componente

| Requisito | Componente |
|---|---|
| R1 | `sync-doc-types.mjs` + bloque con marcadores |
| R2 | `GUIDE_TYPES` como fuente única |
| R3 | `buildSidebar()` agrupando por tipo |
| R4 | ningún renombrado: solo cabeceras y menú |
| R5 | extracción de la 51 + registro en índice, menú y `llms.txt` |
| R6 | comprobador de enlaces en las tres superficies |
| R7 | guía 53 ampliada |
| R8 | tipo `project` en la clasificación |
