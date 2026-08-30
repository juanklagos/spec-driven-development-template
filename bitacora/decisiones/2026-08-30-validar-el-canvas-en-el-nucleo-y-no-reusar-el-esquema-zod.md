# Decisión importante - La validación del canvas vive en el núcleo, y el esquema zod se mantiene en paridad

## Date / Fecha

2026-08-30 — tomada durante la implementación de la fase 3 de la spec 042
(`specs/042-no-perder-trabajo/history.md`, fila del 2026-08-30
«Implementación / Implementation»). El plan aprobado decía otra cosa, y la
revisión previa a la aprobación ya lo había señalado como error.

## Context / Contexto

La spec 041 dejó escrito en su decisión 8 que la ausencia de validación en el
cuerpo de `PUT /api/board` era «un defecto real y separable… va en su propia
spec». Esa spec es la 042, y su requisito R7 pide validar nodo a nodo antes de
escribir.

El borrador del plan proponía «reusar `canvasSchema` de `packages/sdd-mcp/src/schemas.ts`».
Comprobado el mismo día antes de implementar:

- `writeBoard` vive en `packages/sdd-core/src/board.ts`.
- `packages/sdd-core/package.json` declara `dependencies: {}` — ni siquiera `zod`.
- Es `sdd-mcp` quien depende de `@juanklagos/sdd-core`, nunca al revés.

Es decir, el plan proponía una inversión de dependencia entre paquetes, y además
se contradecía con su propia línea «ninguna dependencia de ejecución».

Al ir a corregirlo apareció un segundo hecho, medido contra zod 3.25.76: un
`z.object()` **descarta** las claves que no enumera. Y `canvasSchema` es la
entrada de `sdd_board_write` y la salida de `sdd_board_read`
(`packages/sdd-mcp/src/server.ts:415` y `:436`). O sea que la ruta del agente
estaba borrando del archivo del usuario exactamente lo mismo que la fase 2 de
esta spec acababa de enseñar al builder a conservar.

## Decision / Decisión

**La validación se escribe a mano en `sdd-core`, y `canvasSchema` se mantiene en
paridad en vez de importarse.** Aterrizó en `validateCanvas`
(`packages/sdd-core/src/board.ts`), invocada por `writeBoard` antes de tocar el
archivo, y comprobada por cuatro pruebas en `packages/sdd-core/src/board.test.ts`.

Como parte de la misma decisión, `canvasNodeSchema` y `canvasEdgeSchema` pasan a
`.passthrough()` (`packages/sdd-mcp/src/schemas.ts`), porque una validación que
preserva claves desconocidas en un paquete y las descarta en el otro no es
paridad: es el mismo defecto por otra puerta.

Las dos declaraciones llevan un comentario que las señala mutuamente, igual que
ya hacían las tres declaraciones del tipo de nodo desde la spec 041.

## Alternatives considered / Alternativas consideradas

1. **Importar `canvasSchema` desde `sdd-core`** — lo que decía el plan
   aprobado. Imposible sin invertir la dependencia entre paquetes.
2. **Meter `zod` en `sdd-core`.** Técnicamente viable y descartado: `sdd-core`
   no tiene ninguna dependencia de ejecución hoy, y ésa es una propiedad que se
   pierde una vez y no se recupera. Validar cuatro tipos de nodo y dos extremos
   de arista no justifica el precio.
3. **Mover `canvasSchema` a `sdd-core` y que `sdd-mcp` lo importe.** Es la
   alternativa más limpia en abstracto, y arrastra el mismo problema del punto 2:
   el esquema es zod, así que mover el esquema es mover la dependencia.
4. **No validar y confiar en el cliente.** Es el estado que esta spec viene a
   corregir.

## Consequences / Consecuencias

- **Mejora:** ninguna escritura del tablero pasa sin comprobarse, por las dos
  rutas —REST y MCP—, y el error nombra el nodo o la arista culpable. Una
  escritura rechazada deja el archivo anterior intacto, con prueba que lo fija.
- **Mejora:** con `.passthrough()`, un agente que lea y reescriba el tablero por
  MCP ya no borra `url`, `subpath` ni ningún campo futuro del formato.
- **Trade-off aceptado:** dos implementaciones de la misma regla, en dos
  lenguajes de validación distintos, que hay que cambiar a la vez. Es deuda de
  sincronización deliberada, del mismo tipo que el repo ya acepta para el tipo de
  nodo (`board.ts` ↔ `builder/src/types.ts` ↔ `schemas.ts`) y para las etiquetas
  de arista (`convert.ts` ↔ `classifyEdgeLabel`).
- **Se vuelve más difícil:** añadir un campo nuevo al formato exige tocar cuatro
  sitios en vez de tres.
- Archivos afectados: `packages/sdd-core/src/board.ts`,
  `packages/sdd-mcp/src/schemas.ts`, y sus pruebas.

## When to revisit / Cuándo revisar esta decisión

- **Si `sdd-core` adquiere alguna dependencia de ejecución por otro motivo.**
  Desaparecido el argumento principal, mover el esquema al núcleo y que
  `sdd-mcp` lo importe pasa a ser la mejor opción, y esta decisión debería
  revertirse.
- **Si las dos declaraciones se desincronizan una sola vez en la práctica.**
  Sería la señal de que el coste de mantener la paridad supera al de la
  dependencia. Hoy no hay ningún caso registrado.
- **Al añadir el quinto campo al formato**, si para entonces la lista de sitios
  que tocar ha vuelto a crecer.
- Revisión sugerida junto a la spec siguiente del paquete (la de concurrencia
  del tablero), que vuelve a tocar `writeBoard`.
