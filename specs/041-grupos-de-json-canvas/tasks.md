# Tareas 041 - El lienzo entiende los grupos de JSON Canvas

## Fase 1 — El grupo sobrevive

- [x] Añadir `"group"` al tipo de nodo en `packages/sdd-core/src/board.ts`
- [x] Añadir `"group"` al enum de `packages/sdd-mcp/src/schemas.ts` y los campos `label`, `background`, `backgroundStyle`
- [x] Añadir `"group"` y sus campos a `builder/src/types.ts`
- [x] `boardToFlow`: mapear el grupo a su propio tipo de nodo, sin pasar por la rama de nota
- [x] `flowToBoard`: emitir el grupo como `type:"group"` conservando todos los campos que trajo
- [x] Prueba de ida y vuelta: un canvas con grupos entra y sale idéntico

## Fase 2 — El grupo se ve

- [x] `builder/src/components/GroupNode.tsx` con `label` en cabecera, `color` y `background`
- [x] Registrar `group` en `nodeTypes` de `builder/src/App.tsx`
- [x] Pintado detrás de las tarjetas y sin capturar el clic de lo que está encima
- [x] Soportar `backgroundStyle` (`cover` | `ratio` | `repeat`) — implementado; sin imagen de fondo real con la que verlo, solo verificado el ida y vuelta

## Fase 3 — El grupo contiene

- [x] Derivar pertenencia por geometría al cargar (rectángulo completo dentro del grupo)
- [x] Regla del contenedor de menor área cuando hay grupos solapados
- [x] Emitir los grupos antes que sus hijos en el array de nodos
- [x] Convertir posiciones de hijos a relativas al cargar y a absolutas al guardar
- [x] ~~`extent: "parent"` para que el hijo no se salga arrastrando~~ — **descartado al implementar**: impide sacar una tarjeta del marco, así que la atraparía dentro para siempre, y contradice la tarea siguiente. La pertenencia se re-deriva al soltar.
- [x] Arrastrar una tarjeta hacia dentro y hacia fuera actualiza la pertenencia
- [x] Comprobar el caso de grupo anidado en grupo
- [x] Prueba: mover el grupo mueve a los hijos y las absolutas guardadas lo reflejan

## Fase 4 — El grupo se autora

- [x] Crear grupo desde la paleta
- [x] Renombrar el `label` en el lienzo
- [x] Redimensionar con asas (`NodeResizer`), que re-deriva la pertenencia
- [ ] ~~Recolorear~~ — **fuera de alcance al implementar**: el builder no tiene selector de color para ningún tipo de nodo, y añadir uno solo para grupos sería incoherente. El color del archivo se conserva y se pinta.
- [x] Borrar el grupo liberando a los hijos, que conservan su posición absoluta
- [x] Cada mutación pasa por `pushHistory` como las demás

## Fase 5 — Cierre

- [x] Cadenas ES/EN en `builder/src/i18n.ts`
- [x] Documentar los grupos en la guía del builder
- [x] Entrada en `CHANGELOG.md`
- [x] Registrar la decisión de la pertenencia derivada (JSON Canvas no tiene padre) en `bitacora/decisiones/`
- [x] Actualizar `history.md` de esta spec con lo implementado y lo verificado

## Fuera de alcance (no hacer en esta spec)

- [ ] ~~Validar el cuerpo de `PUT /api/board`, que hoy hace `as never`~~ — decisión 8, spec aparte
- [ ] ~~Reconvertir a grupos los boards que ya perdieron los suyos~~ — trabajo manual del dueño del board
- [ ] ~~Unificar las tres declaraciones del tipo de nodo en una sola fuente~~ — mejora real, pero es otra spec

## Encontrado al verificar en el navegador (no estaba en el plan)

- [x] El guardado encogía los marcos: React Flow medía el wrapper del nodo (150×342 para un marco de 760×320, porque solo la chapa del título participa del layout) y ese número acababa en el archivo. El tamaño de un grupo sale ahora del dato, y el nodo declara su tamaño para que la medida coincida.
- [x] Borrar un marco borraba también sus tarjetas: React Flow arrastra a los hijos al borrar el padre. Interceptado en `onBeforeDelete`.
