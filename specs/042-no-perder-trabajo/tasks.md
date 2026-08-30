# Tareas 042 - El lienzo deja de destruir lo que no entendió

> Orden TDD: dentro de cada fase, las tareas de prueba van antes que las de
> implementación. La fase 1 es enteramente pruebas y bloquea a las demás.

## Fase 1 — La red (R3)

> Esta fase fija el comportamiento **actual**, defectos incluidos. Las pruebas
> marcadas «defecto que invierte la fase N» se reescriben en esa fase.

- [ ] ~~Añadir `@testing-library/react` y `@testing-library/user-event` a las `devDependencies` de `builder/`~~ — **descartado al implementar**: las seis pruebas de esta fase son de estado, no de componentes; el store se ejerce con `useBuilderStore.getState()` bajo `jsdom`, que ya estaba. Añadir dos dependencias que ninguna prueba usa habría sido deuda gratuita. Se reevaluará en la fase 5, donde la prueba de la guarda de atajos sí toca el DOM.
- [x] Crear `builder/src/store.test.ts` con la capa `./api` simulada y un helper que reinicie el store entre casos
- [x] Prueba: un borrado pasa por `toAbsoluteNodes` antes de `applyNodeChanges`, y el fin de un arrastre lo aplica después (`store.ts:340-346`)
- [x] Prueba: varias mutaciones seguidas producen un solo `putBoard` (debounce de 500 ms)
- [x] Prueba: la guarda de eco descarta el cambio inmediatamente posterior a un PUT propio
- [x] Prueba: en `dirty` y `saving` un cambio externo no recarga el lienzo; en `error` **sí** recarga y vacía `past`/`future` — defecto que invierte la fase 5
- [x] Prueba: deshacer tras un arrastre restaura la posición anterior; rehacer la vuelve a aplicar
- [x] Prueba: borrar un marco libera a sus hijos, que conservan su posición absoluta
- [x] Verificar que `npm run test:unit` sigue en verde
- [x] Comprobar que la red muerde: invertir el orden de `toAbsoluteNodes` en `store.ts` pone la prueba en rojo con el valor exacto del defecto (`{x:100,y:100}` en vez de `{x:150,y:150}`)

## Fase 2 — El modelo completo y la ida y vuelta sin pérdida (R4)

- [x] Prueba: un canvas con los cuatro tipos de nodo de JSON Canvas 1.0 entra y sale idéntico
- [x] Prueba: un nodo `link` con `url` sobrevive al ida y vuelta y no se convierte en `text`
- [x] Prueba: un nodo `file` con `subpath` conserva el `subpath`
- [x] Prueba: conserva claves desconocidas en cualquier nodo (añadida: es la propiedad general que las tres anteriores instancian)
- [x] Prueba: una arista con `fromSide: "bottom"`, `toSide: "top"` y color propio conserva los tres valores
- [x] Prueba: una arista cuya etiqueta no ha cambiado conserva el color del archivo; si la etiqueta cambia, el color se recalcula
- [x] Añadir `"link"` y los campos `url`/`subpath` a `packages/sdd-core/src/board.ts` (aviso KEEP IN SYNC)
- [x] Espejar el tipo en `builder/src/types.ts` y en `packages/sdd-mcp/src/schemas.ts`
- [x] **Añadida al implementar:** `.passthrough()` en `canvasNodeSchema` y `canvasEdgeSchema`. Zod descarta por defecto las claves que no enumera, y ese esquema es la ENTRADA de `sdd_board_write` y la SALIDA de `sdd_board_read`: sin esto, la ruta del agente seguía borrando del archivo lo que la del builder acababa de aprender a conservar. Comprobado contra zod 3.25.76
- [x] Rama de lectura del nodo `link` en `boardToFlow`
- [x] Generalizar el mecanismo `extra` a los demás nodos y a las aristas
- [x] Dejar de escribir `fromSide`/`toSide` a mano en `flowToBoard` y conservar el color de origen
- [x] Verificación end-to-end contra el servidor real: un `board.canvas` con `link`, `subpath`, clave desconocida, grupo y arista con lados sobrevive a un arrastre real en el navegador

## Fase 3 — La escritura validada (R7) · depende de la fase 2

- [x] Prueba: `writeBoard` rechaza un nodo sin `id`, uno con `type` desconocido y uno con `x` no numérico, nombrando el nodo en el error
- [x] Prueba: `writeBoard` rechaza una arista sin `id` y una cuyo `fromNode` o `toNode` no exista entre los nodos, nombrando la arista
- [x] Prueba: una escritura rechazada deja el archivo anterior byte a byte intacto
- [x] Prueba: un nodo con claves que el builder no conoce pasa la validación y conserva esas claves
- [x] Implementar la validación por nodo y por arista en `packages/sdd-core/src/board.ts`, a mano y sin dependencias nuevas
- [x] Poner `canvasSchema` (`packages/sdd-mcp/src/schemas.ts`) en paridad con la validación, con un comentario que lo declare

## Fase 4 — Nada se abre a ciegas (R1, R2)

- [x] Prueba: leer un tablero ausente devuelve el tablero por defecto
- [x] Prueba: leer un archivo con JSON inválido devuelve un error tipado y **no** el tablero por defecto
- [x] Prueba: leer un archivo con marcadores `<<<<<<<` devuelve el mismo error tipado
- [x] Prueba: `GET /api/board` traduce ese error a una respuesta con código propio, distinta de un 500 genérico
- [x] Prueba: con el tablero marcado como no confiable, ninguna mutación del store llega a `putBoard`
- [x] Prueba: el primer guardado de una sesión deja el contenido anterior en `specs/board.canvas.bak`
- [x] Prueba: escribir `specs/board.canvas.bak` no emite un evento `change` del watcher
- [x] Exportar `readBoardAt` desde `packages/sdd-core/src/board.ts` para poder probarlo directamente
- [x] Implementar el error tipado en la lectura y su propagación por `GET /api/board`
- [x] Implementar el aviso en el builder con la ruta y las dos salidas del escenario 1
- [x] Bloquear el guardado mientras el tablero no sea de confianza
- [x] Implementar el respaldo previo al primer guardado de cada sesión de servidor
- [x] Verificar en el navegador con un `board.canvas` con marcadores de conflicto reales

## Fase 5 — El error deja de perder trabajo, y ningún nodo por accidente (R5, R6)

- [x] Prueba: en estado `error`, `beforeunload` pide confirmación
- [x] Prueba: en estado `error`, un cambio externo no recarga el lienzo y conserva `past`, `future` y el aviso — invierte la prueba de la fase 1
- [x] Prueba: un guardado que falla por red se reintenta a 250 ms, 1 s y 4 s, y al cuarto fallo pasa a estado `error`
- [x] Prueba: con un `[role="dialog"]` en el documento, los atajos `i`, `e`, `g` y `s` no añaden nodos
- [x] Prueba: el caso concreto del tour (`Tour.tsx:93`, sin gestión de foco, foco en `document.body`) queda cubierto por esa guarda — y se le añadió `aria-modal="true"`, que es lo que es
- [x] Incluir `error` en `beforeunload` (`builder/src/App.tsx:234-241`)
- [x] Incluir `error` en la guarda de cambios externos (`builder/src/store.ts:723-724`)
- [x] Implementar el reintento con los tres valores fijos en `flushSave`
- [x] Sustituir la lista blanca de banderas por la comprobación de diálogo abierto, extraída a `builder/src/shortcuts.ts` con sus 7 pruebas

## Fase 6 — Cierre

- [x] Cadenas ES/EN de todos los avisos nuevos en `builder/src/i18n.ts`, con paridad de claves
- [x] Actualizar `docs/es/54-referencia-del-builder.md` y `docs/en/54-builder-reference.md`
- [x] Entrada en `CHANGELOG.md`
- [x] Actualizar `history.md` de esta spec con lo que cambió respecto a lo aprobado
- [x] Registrar en `bitacora/decisiones/` dónde vive la validación del canvas y por qué no reusa `canvasSchema`, con su sección de cuándo revisar
- [x] Ejecutar `./scripts/validate-sdd.sh . --strict` y `./scripts/check-sdd-gate.sh .`
- [x] Actualizar `specs/INDEX.md`
- [x] Regenerar `STATUS.md` — hecho, con un rodeo: `generateStatus()` rechaza la raíz del template, así que se ejecutó **el generador real** sobre un espejo fiel de `specs/` y `bitacora/` en un directorio temporal y se copió el resultado. No es contenido escrito a mano: son 43 filas producidas por el generador a partir de las entradas reales (33 antes, sin las specs 034-042). El rodeo en sí es el defecto que recoge la spec 043.
