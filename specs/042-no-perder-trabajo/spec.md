# Especificación 042 - El lienzo deja de destruir lo que no entendió

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-30`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobada en sesión del 2026-08-30 contra este `spec.md` de esa misma fecha, tras la revisión que partió el paquete original en dos: las cinco rutas por las que el builder escribe sobre trabajo que no entendió —archivo ilegible, guardado fallido, ida y vuelta con pérdida, atajo con diálogo abierto y escritura sin validar—, con los siete requisitos R1-R7 y las seis fases del plan. Origen: bloque A de `idea/IDEAS_BUILDER_V4_2026-08-30.md`. Quedan fuera por decisión explícita: toda la concurrencia (serialización canónica, identificador de versión y 409, eco por identidad, presencia y líder entre pestañas), la copia de conflicto fechada, el merge driver de `.canvas` y la reparación de tableros ya dañados.

## Objetivo

Cerrar las cinco rutas por las que el builder escribe hoy sobre trabajo del
usuario sin haber entendido lo que leyó: un archivo ilegible que se sustituye
por una cuadrícula, un guardado fallido que se olvida, una ida y vuelta que
descarta campos, un atajo que crea nodos detrás de un diálogo, y una escritura
que nadie valida.

Todas comparten la misma causa: el builder guarda el documento entero a los 500
ms de cualquier gesto, y ninguna de esas rutas comprueba antes si debe.

**Esta spec no toca la concurrencia** —dos pestañas, dos escritores, control de
versión del archivo—. Eso es un problema distinto, con su propio protocolo, y
va en la spec siguiente.

## Historia de usuario principal

Como persona que mantiene su tablero en git y a veces lo abre también en
Obsidian, quiero que el builder nunca escriba encima de un archivo que no
entendió, y que si algo va mal me lo diga **antes** de guardar, para poder
dejarlo abierto sin vigilarlo.

## Contexto (medido, no supuesto)

Medido el 2026-08-30 sobre `main` en `a934896` (v2.8.0). Reproducciones en
`research.md`.

- **Un `board.canvas` ilegible se convierte en una cuadrícula por defecto, y el
  primer gesto la escribe en disco.** `packages/sdd-core/src/board.ts:327-334`
  usa el mismo `catch` para «no existe» y «no se pudo parsear», y devuelve
  `defaultBoard(projectRoot)` (`board.ts:308-320`: un nodo por spec en
  cuadrícula, cero notas, cero grupos, cero aristas). `builder/src/store.ts:280-292`
  lo toma como el lienzo real, sin campo de error. Un borrado o el final de un
  arrastre llaman a `scheduleSave` (`store.ts:345-346`), que a los 500 ms hace
  `putBoard` con el documento entero (`store.ts:622-645`), y
  `packages/sdd-mcp/src/api.ts:66` lo escribe con reemplazo ciego.

  Recorrido completo, sin ningún paso improbable: un merge de git deja
  marcadores `<<<<<<<` → el usuario abre el builder → ve un tablero que no
  reconoce → **mueve una tarjeta para investigar** → el layout original ya no
  existe.

- **Un guardado fallido no avisa al cerrar, y un cambio externo lo borra junto
  con su aviso.** `builder/src/App.tsx:234-241` cubre `dirty` y `saving` en
  `beforeunload`, pero **no `error`** — el único estado en el que consta que el
  trabajo no está en disco. Y la guarda de `store.ts:723-724` solo corta en
  `dirty`, `saving` y arrastre activo: estando en `error` el cambio externo pasa,
  y `store.ts:726-737` recarga desde disco con `saveState: "saved"`, `past: []` y
  `future: []`. Desaparecen a la vez el trabajo, el historial de deshacer y el
  banner rojo que lo denunciaba.

- **La ida y vuelta de JSON Canvas destruye lo que el builder no pinta.**
  `builder/src/convert.ts:396-407` escribe `fromSide: "right"` y `toSide: "left"`
  literalmente, y recalcula el color de la arista desde su etiqueta en cada
  guardado. El nodo `link` de la especificación 1.0 no existe en el modelo: el
  tipo declarado es `"file" | "text" | "group"` en `packages/sdd-core/src/board.ts:52`,
  con el aviso «KEEP IN SYNC» que obliga a `builder/src/types.ts` y
  `packages/sdd-mcp/src/schemas.ts` a acompañarlo. Un `link` entra y sale como
  `text` vacío; el `subpath` de un `file` desaparece.

  El mecanismo que lo arregla ya existe y está probado, pero solo para el nodo
  grupo: `convert.ts:196-241` (`GROUP_OWN_FIELDS` + `extra`), spec 041.

- **Los atajos de un carácter siguen vivos con diálogos abiertos.**
  `builder/src/App.tsx:290-307` se inhibe con una lista blanca —`paletteOpen ||
  tourOpen || galleryOpen || assistantOpen`— que no incluye `connectOpen` ni el
  modal de implementar. Ninguno de los dos tiene un `<input>`
  (`ConnectAgentModal.tsx:43-119`, `ImplementModal.tsx:73-81`), así que Radix deja
  el foco en un botón y la tecla llega al handler global. Pulsar `g` crea un
  marco de 560×360 (`convert.ts:27`, `GROUP_FRAME`, usado por `store.ts:415-430`)
  **detrás del diálogo**, que además adopta como hijas las tarjetas que quedan
  debajo —la pertenencia es geométrica, spec 041— y 500 ms después está en disco.

  Ojo al implementarlo: `builder/src/components/Tour.tsx:93` es un
  `<div role="dialog">` plano, sin ninguna gestión de foco, así que una guarda
  basada solo en el ancestro del elemento enfocado no lo cubriría.

- **El módulo que escribe el archivo no tiene ni una prueba.** Ningún fichero de
  `builder/src/*.test.ts` importa `./store`. Quedan sin cobertura el orden
  `toAbsoluteNodes` antes de `applyNodeChanges` (`store.ts:340-346`), la guarda de
  eco, la política ante cambios externos, el debounce y el undo/redo. La spec 024
  ya señaló el módulo —«`builder/src/store.ts` (599 líneas) orquesta el estado y
  las llamadas al API», `024/spec.md:24`— y dejó fuera de alcance «los componentes
  de presentación» (`024/spec.md:72`), sin llegar a cubrir el store. Desde
  entonces ha crecido a 742 líneas.

- **`writeBoard` acepta cualquier cosa con forma de sobre.**
  `packages/sdd-core/src/board.ts` solo comprueba que `nodes` y `edges` sean
  arrays. La spec 041 dejó esto escrito como deuda en su decisión 8 —«defecto
  real y separable… va en su propia spec»—, y esa spec nunca se creó.

## Decisiones que esta spec fija

1. **El archivo del usuario se presume suyo.** Ante la duda, el builder no
   escribe: avisa y espera una elección explícita.
2. **«No existe» y «no se pudo leer» son dos cosas distintas.** La primera
   justifica un tablero por defecto; la segunda es un error que el usuario tiene
   que ver antes de que se guarde nada.
3. **Lo que entra vuelve a salir igual**, para todos los nodos y aristas — el
   mismo principio que la 041 fijó y aplicó solo al grupo.
4. **La validación de escritura vive en `sdd-core` y no añade dependencias.**
   `sdd-core` tiene hoy `dependencies: {}` y es `sdd-mcp` quien depende de él, no
   al revés: el esquema `canvasSchema` de `sdd-mcp` se mantiene en paridad, no se
   importa.
5. **La guardia de los atajos es estructural.** Se pregunta si hay un diálogo
   abierto en el documento, no si está abierto uno de los cuatro que alguien
   recordó enumerar.
6. **Las pruebas van primero, y fijan lo que hoy ocurre.** La fase 1 documenta
   el comportamiento actual —defectos incluidos— y cada fase posterior invierte
   la prueba que corresponde.

## Escenarios de aceptación

1. Dado un `board.canvas` con marcadores de conflicto de git, cuando abro el
   builder, entonces veo un aviso que nombra la ruta del archivo, el lienzo no
   me presenta una cuadrícula por defecto como si fuera mi tablero, y el aviso
   ofrece exactamente dos salidas: **arreglar el archivo a mano y volver a
   leerlo**, o **descartarlo y empezar con el tablero por defecto**. Hasta que
   elija una, nada se escribe en disco.
2. Dado un `board.canvas` que todavía no existe, cuando abro el builder,
   entonces obtengo el tablero por defecto y trabajo con normalidad — este caso
   no cambia.
3. Dado un `board.canvas` con contenido, cuando muevo la primera tarjeta de la
   sesión, entonces existe `specs/board.canvas.bak` con el contenido que tenía
   antes de esa escritura.
4. Dado que muevo una tarjeta y el guardado falla, cuando intento cerrar la
   pestaña, entonces el navegador me pide confirmación.
5. Dado que muevo una tarjeta y el guardado falla, cuando llega un cambio
   externo del archivo, entonces mi trabajo y el aviso de error siguen en
   pantalla y no se recarga nada por encima.
6. Dado un `board.canvas` con un nodo `link` con su `url`, un `file` con
   `subpath` y una arista con `fromSide: "bottom"`, `toSide: "top"` y color
   propio, cuando abro el builder, muevo otra tarjeta y guardo, entonces esos
   cinco valores siguen intactos en el archivo.
7. Dado que tengo abierto el modal de conectar agente, o el de implementar, o el
   tour, cuando pulso `g`, `i`, `e` o `s`, entonces no aparece ningún nodo nuevo
   en el lienzo ni se guarda nada.
8. Dado un tablero cuyo archivo contiene una arista que apunta a un nodo
   inexistente, cuando el builder intenta guardar, entonces la escritura se
   rechaza entera con un error que nombra esa arista, y el archivo anterior
   sigue intacto.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria

- CUANDO el tablero no se pueda leer por estar mal formado, EL SISTEMA DEBERÁ
  distinguirlo de «el tablero no existe» y NO DEBERÁ presentar el tablero por
  defecto como si fuera el del usuario.
- CUANDO el tablero no se haya podido leer, EL SISTEMA DEBERÁ mostrar un aviso
  que incluya la ruta del archivo y las dos salidas del escenario 1, y NO DEBERÁ
  escribir en disco hasta que el usuario elija una.
- CUANDO el builder vaya a guardar por primera vez en una sesión de servidor, EL
  SISTEMA DEBERÁ haber copiado antes el contenido anterior a
  `specs/board.canvas.bak`, sobrescribiendo el de la sesión previa.
- CUANDO el guardado haya fallado, EL SISTEMA DEBERÁ pedir confirmación al
  cerrar la pestaña y DEBERÁ conservar el trabajo y su aviso aunque llegue un
  cambio externo del archivo.
- SI un guardado falla por red, ENTONCES EL SISTEMA DEBERÁ reintentarlo a los
  250 ms, 1 s y 4 s, y declarar el error tras el tercer fallo.
- CUANDO un nodo o una arista traiga campos que el builder no pinta, EL SISTEMA
  DEBERÁ devolverlos intactos al guardar, incluidos el `url` de un nodo `link`,
  el `subpath` de un `file`, y el `fromSide`, el `toSide` y el color de una
  arista.
- CUANDO el usuario no haya cambiado la etiqueta de una arista, EL SISTEMA
  DEBERÁ conservar el color que traía el archivo en vez de recalcularlo.
- CUANDO haya un diálogo abierto en la pantalla, EL SISTEMA NO DEBERÁ crear
  ningún nodo al pulsar un atajo de un solo carácter, incluido el caso del tour.
- SI el tablero que se va a escribir contiene un nodo sin identificador, con un
  tipo que no es `text`, `file`, `link` ni `group`, o con coordenadas no
  numéricas, ENTONCES EL SISTEMA DEBERÁ rechazar la escritura completa con un
  error que nombre ese nodo.
- SI el tablero que se va a escribir contiene una arista sin identificador o
  cuyo origen o destino no exista entre los nodos, ENTONCES EL SISTEMA DEBERÁ
  rechazar la escritura completa con un error que nombre esa arista.
- CUANDO se ejecute la suite de pruebas, EL SISTEMA DEBERÁ cubrir las rutas de
  guardado, deshacer y reconciliación con el disco de `builder/src/store.ts`,
  con las seis pruebas enumeradas en la fase 1 de `tasks.md`.

## Requisitos

- R1. Distinguir «archivo ausente» de «archivo ilegible» en la lectura del
  tablero, y propagar esa distinción hasta la interfaz.
- R2. No escribir mientras el tablero leído no sea de confianza, y respaldar el
  archivo antes de la primera escritura de cada sesión de servidor.
- R3. Cobertura de las rutas de guardado, deshacer y reconciliación de
  `builder/src/store.ts`.
- R4. Conservación íntegra de campos desconocidos en nodos y aristas, y soporte
  del nodo `link` y del `subpath` en las tres declaraciones del tipo de nodo.
- R5. El estado de error se trata como estado con trabajo en riesgo: aviso al
  cerrar, inmunidad al cambio externo y reintento con valores fijos.
- R6. Guardia de los atajos de teclado frente a cualquier diálogo abierto,
  incluido el tour.
- R7. Validación por nodo y por arista antes de escribir, implementada en
  `sdd-core` sin dependencias nuevas.

## Propiedades de la spec (puente a specs ejecutables) / Spec properties

- Para todo tablero, `flowToBoard(boardToFlow(c))` conserva todos los campos de
  `c` que el builder no pinta.
- Para toda escritura aceptada, el archivo resultante vuelve a leerse sin error.
- Para todo tablero rechazado por la validación, el archivo en disco queda
  exactamente como estaba.

## Ámbito de archivos / File scope

- `builder/src/store.ts` — guardado, deshacer y reconciliación con el disco
- `builder/src/store.test.ts` — nuevo; la red de la fase 1
- `builder/src/convert.ts` — ida y vuelta board↔canvas
- `builder/src/convert.test.ts` — casos de los cuatro tipos de nodo
- `builder/src/types.ts` — declaración del tipo de nodo en el cliente
- `builder/src/App.tsx` — `beforeunload` y atajos de teclado
- `builder/src/i18n.ts` — cadenas ES/EN de los avisos nuevos
- `builder/package.json` — dependencias de prueba
- `packages/sdd-core/src/board.ts` — lectura, validación y escritura del canvas
- `packages/sdd-mcp/src/schemas.ts` — esquema en paridad con la validación
- `packages/sdd-mcp/src/api.ts` — `GET`/`PUT /api/board`

## Fuera de alcance

- **Toda la concurrencia:** serialización canónica del `.canvas`, identificador
  de versión, 409 al escribir sobre una versión vieja, guarda de eco por
  identidad, presencia visible y un solo autoguardador entre pestañas. Es el
  paquete siguiente y va en su propia spec; el bloque A de
  `idea/IDEAS_BUILDER_V4_2026-08-30.md` lo recoge.
- **Edición colaborativa en tiempo real.** Ni CRDT ni motor de sincronización;
  descartado con motivo en `research.md`.
- **Copia de conflicto con nombre fechado** al estilo Obsidian: depende del
  control de versión, que no está aquí. `specs/board.canvas.bak` de R2 es otra
  cosa —un respaldo por sesión, no una copia de conflicto—.
- **Merge driver de git para `.canvas`.**
- **Reparar tableros ya dañados** por versiones anteriores.
- **El resto de la superficie HTTP** (cabecera `Host`, token, confinamiento de
  `/mcp`): paquete v11, spec aparte.

## Criterios de éxito

- Las cinco rutas de pérdida documentadas en `research.md` dejan de perder
  datos, cada una con su prueba automática.
- `builder/src/store.ts` pasa de 0 pruebas a las seis de la fase 1 de
  `tasks.md`: orden `toAbsoluteNodes`/`applyNodeChanges`, debounce, guarda de
  eco, cambio externo en cada estado de guardado, deshacer/rehacer tras
  arrastre, y borrado de marco que libera a sus hijos.
- Abrir y guardar un `board.canvas` escrito por otro editor de JSON Canvas no
  cambia ningún campo que el builder no pinte, incluidos los cuatro tipos de
  nodo de la especificación 1.0.
- Ninguna regresión en las pruebas existentes de `convert.ts`, `board.ts` ni en
  la integración MCP.
