# Una sola lista de release: la 09, y las otras dos como registro histórico

**Fecha:** 2026-08-17
**Estado:** aceptada

## Contexto

Había tres listas de publicación en la documentación y ninguna decía cuál
seguir:

- La **09**, escrita para publicar la plantilla *por primera vez* — `git init`,
  primer commit, `git tag v1.0.0` — cuando el repositorio lleva publicado desde
  hace mucho y va por 2.5.0. Además, la versión en inglés tenía cuatro
  secciones menos que la española.
- La **39** y la **46**, barras mínimas de `v1.2.0` y `v1.3.0`, escritas en
  futuro: «si algo de esto no está, la release no sale». Las dos versiones
  salieron hace mucho.

`docs/README.md` ya las marcaba «(histórico)», pero los documentos mismos no lo
decían, y quien llegaba por el menú o por búsqueda no veía esa etiqueta.

## Alternativas

1. **Borrar la 39 y la 46.** Descartada: el CHANGELOG las referencia, y el
   criterio con el que se publicó cada versión es parte del registro.
2. **Actualizar las tres.** Descartada: son la misma lista congelada en tres
   momentos. Mantener tres copias garantiza que se separen otra vez.
3. **Una viva y dos cerradas.** Elegida.

## Qué cambió

- La **09** pasa a ser la lista de cada release, con los comandos que el
  proyecto ejecuta de verdad: compuerta, `typecheck`/`build`/`test`, las tres
  pruebas de humo MCP —incluida `mcp:pack:smoke`, la que detectó el pin interno
  roto—, `docs:types`/`docs:links`/`docs:contrast`, y la alineación de versiones
  que vigila `release-integrity.test.ts`. Lo de la publicación inicial queda en
  una sección «Solo la primera vez», porque sirve a quien parte de la plantilla.
- Inglés y español quedan a la par.
- La **39** y la **46** abren declarando que son registro histórico y apuntan a
  la 09.
- La **35** (roadmap) se reescribe desde el estado real: anunciaba «v1.7.0».
  Ya no enumera versiones —esa lista se pudre con cada release— sino que apunta
  a donde los números se generan solos, y lo que falta sale de `specs/INDEX.md`.

## Cuándo revisarla

- Si el proceso de publicación se automatiza, la 09 deja de ser una lista para
  humanos y pasa a documentar el flujo que corre solo.
- Si alguien necesita la 39 o la 46 para algo más que consultar el pasado, es
  señal de que a la 09 le falta ese criterio.
