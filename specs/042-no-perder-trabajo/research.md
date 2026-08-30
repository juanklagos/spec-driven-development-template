# Investigación 042 - El lienzo deja de destruir lo que no entendió

Medido el 2026-08-30 sobre `main` en `a934896` (v2.8.0). Origen del hallazgo:
auditoría del builder recogida en `idea/IDEAS_BUILDER_V4_2026-08-30.md`, bloque A.

## Las cinco rutas de pérdida, con su reproducción

| # | Ruta | Reproducción | Consecuencia |
|---|---|---|---|
| 1 | Archivo ilegible → cuadrícula por defecto | Introducir marcadores `<<<<<<<` en `specs/board.canvas`, abrir el builder, mover una tarjeta | El layout original se sustituye en disco a los 500 ms |
| 2 | Guardado fallido sin aviso al cerrar | Detener el servidor, mover una tarjeta, cerrar la pestaña | La pestaña se cierra sin preguntar; el trabajo no está en disco |
| 3 | Cambio externo en estado `error` | Con el guardado en error, tocar `board.canvas` desde fuera | Se recargan disco, `past` y `future`; desaparecen trabajo y banner |
| 4 | Ida y vuelta con pérdida | Canvas con nodo `link`, `file` con `subpath`, arista con `fromSide` y color | Los cuatro valores se pierden al guardar |
| 5 | Atajo con diálogo abierto | Abrir «Conectar un agente» y pulsar `g` | Aparece un marco de 560×360 detrás del diálogo, adopta tarjetas y se guarda |

Las rutas de concurrencia —ventana de eco ciega y dos pestañas que se pisan—
están medidas en el mismo bloque A del documento de ideas y **no forman parte de
esta spec**: van en el paquete siguiente.

## Medición del ida y vuelta (ruta 4)

Ejecutado el ida y vuelta real (`boardToFlow` → `flowToBoard`) sobre un canvas
con los cuatro tipos de nodo de la especificación JSON Canvas 1.0:

```
ENTRADA : {"type":"link","url":"https://jsoncanvas.org", …}
SALIDA  : {"type":"text","text":"", …}

ENTRADA : {"type":"file","file":"specs/001/spec.md","subpath":"#objetivo", …}
SALIDA  : {"type":"file","file":"specs/001/spec.md", …}

ENTRADA : {"fromSide":"bottom","toSide":"top","color":"5", …}
SALIDA  : {"fromSide":"right","toSide":"left", …}
```

Causas: `builder/src/convert.ts:396-407` escribe `fromSide` y `toSide`
literalmente y recalcula el color desde la etiqueta en cada guardado; y el tipo
de nodo declarado en `packages/sdd-core/src/board.ts:52` es
`"file" | "text" | "group"`, sin `link`, con el aviso «KEEP IN SYNC» que obliga a
mantener en paridad `builder/src/types.ts` y `packages/sdd-mcp/src/schemas.ts`.

## Cobertura de pruebas actual

`builder/src/` tiene 12 ficheros `*.test.ts` más `ui-refs.test.tsx`. Ninguno
importa `./store`, que es el único módulo que llama a `api.putBoard` y mide 742
líneas.

Lo que sí existe de entorno: `builder/src/ui-refs.test.tsx` monta componentes con
`createRoot` de `react-dom/client` bajo jsdom. Es decir, montar no es imposible
hoy; `@testing-library/react` se añade por conveniencia de consultas y eventos,
no para desbloquear algo que no se podía hacer.

**Qué dijo la spec 024 sobre esto.** Nombró el módulo en su contexto —
«`builder/src/store.ts` (599 líneas) orquesta el estado y las llamadas al API»,
`024/spec.md:24`— y su «Fuera de alcance» (`024/spec.md:70-74`) excluyó la
cobertura del 100 %, «los componentes de presentación» y las pruebas E2E de
navegador con Playwright. No mencionó `@testing-library` en ningún punto
(comprobado: `grep -rn -i testing-library specs/024-nucleo-con-pruebas/` no
devuelve nada). El resultado es que el store quedó señalado pero sin cubrir, y
desde entonces ha crecido de 599 a 742 líneas.

## Dónde puede vivir la validación de escritura

`writeBoard` está en `packages/sdd-core/src/board.ts`. El `package.json` de
`sdd-core` declara `dependencies: {}` — ni siquiera `zod` — y es `sdd-mcp` quien
depende de `@juanklagos/sdd-core`. Por tanto `canvasSchema`
(`packages/sdd-mcp/src/schemas.ts`) **no se puede importar** desde el núcleo sin
invertir la dependencia entre paquetes y sin meter una dependencia de ejecución
en un paquete que hoy no tiene ninguna.

La salida es la que el repo ya usa para el tipo de nodo: validación escrita a
mano en `sdd-core` y un esquema en paridad en `sdd-mcp`, con el comentario que lo
declare. Es el mismo trato que reciben hoy las tres declaraciones del tipo de
nodo.

## Alternativas consideradas para la concurrencia

Aunque la concurrencia queda fuera de esta spec, la decisión de dejarla fuera se
tomó habiendo mirado las opciones, y conviene que quede escrito para la spec
siguiente:

- **CRDT en el lienzo (Yjs, Automerge, Loro).** Descartado. Los tres persisten
  estado binario, así que convivir con un archivo legible y versionable en git
  obliga a dos fuentes de verdad. El caso real de este producto es «una persona
  con dos pestañas» o «una persona y su agente», no edición concurrente carácter
  a carácter. Precedente: tldraw, el lienzo comercial de referencia, tampoco usa
  CRDT — resuelve con un servidor autoritativo por sala (`TLSocketRoom`) y separa
  el snapshot del documento del estado de sesión. Verificado en
  <https://tldraw.dev/docs/sync> el 2026-08-30.
- **Motor de sincronización (Electric SQL, Zero, Liveblocks, PartyKit).**
  Descartado. Exigen servidor propio o servicio de terceros, y varios no
  permiten alojamiento propio: rompen la promesa «todo se queda en tu máquina»
  que ya sostiene `bitacora/decisiones/2026-07-20-builder-sin-llamadas-a-llm.md`.
- **Concurrencia optimista con identificador de versión (ETag / If-Match).**
  Candidata para la spec siguiente. Es el mecanismo más pequeño que resuelve el
  caso real, no bloquea mientras el usuario piensa y no añade dependencias — pero
  exige una serialización estable del archivo, que es trabajo propio y suficiente
  para justificar su propia spec.

## Deuda que esta spec recoge

La decisión 8 de la spec 041 dejó escrito que la ausencia de validación en el
cuerpo de `PUT /api/board` era un «defecto real y separable… va en su propia
spec». Esa spec nunca se creó. Se recoge aquí como R7, en la fase 3, después de
que la fase 2 amplíe el tipo de nodo — porque validar tipos antes de conocer
`link` rechazaría precisamente los nodos que la fase 2 enseña a leer.
