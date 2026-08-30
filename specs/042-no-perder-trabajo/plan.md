# Plan 042 - El lienzo deja de destruir lo que no entendió

## Resumen

Cinco fases y un cierre. El orden lo manda una sola regla: **primero la red,
después ampliar el modelo, y solo entonces empezar a rechazar cosas.**

La fase 1 no arregla ningún defecto — pone pruebas sobre `builder/src/store.ts`,
el módulo de 742 líneas que escribe `specs/board.canvas` y que hoy no tiene
ninguna. Fija el comportamiento actual, defectos incluidos, para que cada fase
posterior tenga que invertir una prueba concreta en vez de confiar en la lectura.

La fase 2 amplía el tipo de nodo antes de que la fase 3 empiece a rechazar tipos
desconocidos. Invertirlas rompería el propio objetivo: la validación rechazaría
los nodos `link` que la fase 2 acaba de enseñar a leer.

## Contexto técnico

**Dónde se decide hoy si se escribe.** Tres puntos, y ninguno pregunta si debe:

| Punto | Archivo | Qué hace hoy |
|---|---|---|
| Lectura | `packages/sdd-core/src/board.ts:327-334` | Un `catch` para dos causas distintas |
| Escritura | `packages/sdd-core/src/board.ts` (`writeBoard`) | Comprueba que `nodes` y `edges` sean arrays |
| Transporte | `packages/sdd-mcp/src/api.ts:66` | Reemplazo ciego del archivo |

**Dónde vive la validación, y por qué no puede reusar el esquema existente.**
`writeBoard` está en `sdd-core`, cuyo `package.json` declara `dependencies: {}`;
es `sdd-mcp` quien depende de `@juanklagos/sdd-core`, no al revés. Importar
`canvasSchema` (`packages/sdd-mcp/src/schemas.ts`) desde el núcleo invertiría la
dependencia entre paquetes y metería `zod` en un paquete que hoy no tiene
ninguna. La validación se escribe a mano en `sdd-core`, campo a campo, y
`canvasSchema` se mantiene **en paridad** con ella — igual que las tres
declaraciones del tipo de nodo ya se mantienen en sync hoy.

**Las tres declaraciones del tipo de nodo.** `packages/sdd-core/src/board.ts:52`
lleva el aviso «KEEP IN SYNC», y sus dos espejos son `builder/src/types.ts` y
`packages/sdd-mcp/src/schemas.ts`. Añadir `link` obliga a tocar las tres; la spec
041 ya pagó ese precio al añadir `group` y dejó el camino hecho.

**Conservación de campos desconocidos.** El mecanismo existe y está probado
desde la 041: `GROUP_OWN_FIELDS` + `extra` en `convert.ts:196-241`. La fase 2 lo
generaliza a los demás nodos y a las aristas en vez de inventar otro.

**La guarda de los atajos y el tour.** `builder/src/components/Tour.tsx:93` es un
`<div role="dialog">` plano, sin Radix y sin gestión de foco: el foco se queda en
`document.body`, así que preguntar por el ancestro del elemento enfocado no lo
detecta. La guarda tiene que mirar si existe **algún** `[role="dialog"]` en el
documento, no solo si el foco está dentro de uno.

**Pruebas de componente.** `builder/src/ui-refs.test.tsx` ya monta componentes
con `createRoot` bajo jsdom, así que el entorno base existe.
`@testing-library/react` se añade por conveniencia —consultas y eventos— no
porque hoy sea imposible montar nada.

## Fases de implementación

1. **La red.** Pruebas de `builder/src/store.ts` con la capa `./api` simulada:
   orden `toAbsoluteNodes`/`applyNodeChanges` en borrado y en fin de arrastre,
   debounce del guardado, guarda de eco, política ante cambio externo en cada
   estado de guardado —incluido el defecto de `error`—, deshacer/rehacer tras
   arrastre, y borrado de marco que libera a sus hijos. Añadir
   `@testing-library/react` y `@testing-library/user-event`. **Ninguna corrección
   de comportamiento en esta fase.** Cubre R3.

2. **El modelo completo, y la ida y vuelta sin pérdida.** Añadir `link` y
   `subpath` a las tres declaraciones del tipo de nodo; rama de lectura del nodo
   `link` en `boardToFlow`; generalizar el mecanismo `extra` a todos los nodos y a
   las aristas; dejar de escribir `fromSide`/`toSide` a mano y conservar el color
   de origen de la arista salvo que su etiqueta haya cambiado. Cubre R4.

3. **La escritura validada.** Validación por nodo y por arista en `writeBoard`,
   escrita a mano en `sdd-core`, que **preserva** las claves desconocidas y
   rechaza la escritura completa nombrando el nodo o la arista culpable. Poner
   `canvasSchema` en paridad. Cubre R7. Depende de la fase 2.

4. **Nada se abre a ciegas.** `readBoardAt` distingue ausente de ilegible y
   devuelve un error tipado; `GET /api/board` lo traduce a una respuesta con
   código propio; el builder muestra el aviso con la ruta y las dos salidas del
   escenario 1, y no guarda hasta que el usuario elija; respaldo del contenido
   anterior en `specs/board.canvas.bak` antes del primer guardado de cada sesión
   de servidor. Cubre R1 y R2.

5. **El error deja de perder trabajo, y ningún nodo aparece por accidente.**
   Incluir `error` en `beforeunload` y en la guarda de cambios externos;
   reintento del guardado a 250 ms, 1 s y 4 s; sustituir la lista blanca de
   banderas por la comprobación de que exista un `[role="dialog"]` en el
   documento. Cubre R5 y R6.

6. **Cierre.** Cadenas ES/EN con paridad de claves, guía del builder
   (`docs/*/54-*`), `CHANGELOG.md`, `history.md` de la spec, y registro de
   decisión sobre dónde vive la validación del canvas y por qué no reusa
   `canvasSchema`.

## Dependencias

- **Fase 1 antes que todas.** Es la decisión 6 de la spec.
- **Fase 2 antes que la fase 3.** La validación no puede rechazar tipos
  desconocidos mientras `link` siga sin existir en las tres declaraciones.
- **Fases 4 y 5 son independientes entre sí** y de la 3; pueden solaparse.
- Dependencias externas nuevas: `@testing-library/react` y
  `@testing-library/user-event`, ambas MIT, solo en `devDependencies` de
  `builder/`. **Ninguna dependencia de ejecución, y ninguna nueva en `sdd-core`.**
- `specs/board.canvas.bak` va junto al tablero. `packages/sdd-mcp/src/events.ts`
  vigila `specs/`, así que hay que comprobar que el respaldo no dispare un evento
  `change` — si lo dispara, se mueve a una ruta que el watcher ignore.

## Hitos

- **H1.** `store.ts` tiene sus seis pruebas y la suite pasa en verde sobre el
  comportamiento actual.
- **H2.** Un canvas con los cuatro tipos de nodo de JSON Canvas 1.0, con
  `subpath` y con lados y color de arista, entra y sale idéntico.
- **H3.** Un tablero con una arista rota se rechaza entero, nombrando la arista,
  y el archivo anterior queda intacto.
- **H4.** Un `board.canvas` con marcadores de conflicto abre el builder sin
  ofrecer una cuadrícula por defecto y sin poder guardar encima; existe
  `specs/board.canvas.bak` tras el primer guardado de una sesión normal.
- **H5.** Con el tour abierto, o el modal de conectar agente, ningún atajo de un
  carácter crea nodos.

## Riesgos

- **La fase 1 puede tardar más de lo previsto** por ser la primera prueba de
  comportamiento del store. Mitigación: no refactoriza `store.ts`; si el entorno
  se resiste, se recorta a las funciones puras que el store usa y se anota la
  deuda en `history.md`.
- **Rechazar tipos desconocidos puede romper tableros que hoy se abren.** Un
  `.canvas` escrito por otra herramienta con un tipo que ni JSON Canvas 1.0 ni el
  builder conocen pasaría hoy y sería rechazado después. Mitigación: la
  validación cubre los cuatro tipos de la especificación 1.0, y el error nombra
  el nodo para que se pueda arreglar a mano; la fase 4 garantiza además que un
  archivo rechazado nunca se sobrescribe.
- **El aviso de archivo ilegible puede leerse como «el builder se ha roto».**
  Mitigación: nombra la ruta, dice que no se ha tocado nada y ofrece las dos
  salidas del escenario 1.
- **El respaldo puede realimentar el watcher** y provocar un ciclo de eventos.
  Mitigación: está en las dependencias como comprobación explícita, con su tarea
  de prueba.
- **Riesgo de alcance:** este paquete toca el módulo central del builder. Todo lo
  que aparezca durante la implementación y no esté en el alcance se anota en
  `history.md` y no se implementa sin volver a pasar por aquí. La concurrencia,
  en particular, está fuera por decisión y tiene su propia spec pendiente.
