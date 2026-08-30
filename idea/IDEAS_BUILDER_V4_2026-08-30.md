# Ideas Builder v4 — 2026-08-30

> Auditoría del builder por seis lentes (UX, estado y datos, cola de IA, servidor y API,
> accesibilidad/i18n, producto), cada hallazgo pasado por una refutación adversarial contra el
> código —12 de 59 hallazgos murieron ahí—, más un barrido de 97 herramientas del mercado y una
> sesión de verificación **ejecutando el builder** con las 41 specs de este repo cargadas.
> Continúa `IDEAS_BUILDER_V3_2026-07-23.md`, cuyos ítems 1, 2, 4, 5, 6, 12 y 13 siguen sin spec
> 38 días después. Estado del repo al escribir: v2.8.0, specs 001-041, 41 specs en `specs/`.
>
> **Eje que emergió:** el barrido confirma que la apuesta central sigue sola —ninguna de las
> herramientas rastreadas combina lienzo espacial + markdown como fuente de verdad + JSON Canvas
> + servidor local + cero LLM; el competidor más cercano (`spec-board`, Next.js + React Flow +
> MCP) guarda todo en **PostgreSQL con Prisma**—. Lo que le falta al builder frente al estado del
> arte **no es inteligencia: es estructura de ficheros.** Ámbito capturable, plan escribible, IDs
> trazables, contrato de cola versionado. Todo determinista, todo cabe dentro de la restricción
> de no llamar a ningún modelo.
>
> **Segundo eje, incómodo:** de los siete temas de severidad alta, cinco son continuaciones no
> terminadas de specs ya cerradas —024 (pruebas), 025 (deriva), 035 (contraste), 037 (evidencia),
> 041 (round-trip y validación del PUT)— y en tres casos la propia spec dejó escrita la mitad que
> faltaba. No es falta de criterio: es que el «fuera de alcance» de una spec no genera nada que lo
> persiga después. El ítem 4 del backlog v3 (decisiones como nodos con fecha de revisión viva) es
> el arreglo estructural de eso — y su propia revisión de higiene MCP venció el 2026-07-28, hace
> 33 días, sin que nadie la ejecutara.
>
> **Fuentes verificadas una a una (2026-08-30):** StrictDoc user guide
> (`REQUIREMENT_TO_SOURCE_TRACEABILITY` + marcadores `@relation` con roles Implementation/Test) ·
> tldraw sync docs (servidor autoritativo por sala con `TLSocketRoom`, **no** CRDT; documento y
> sesión separados) · `github.com/spec-board/spec-board` (Next.js 16 + React Flow + PostgreSQL +
> Prisma + MCP) · arXiv 2606.27045, «The Spec Growth Engine», 25 jun 2026 (spec graph legible por
> máquina, context assembler, drift gate).
> **Fuentes del barrido, sin verificación individual:** Kiro, GitHub Spec Kit, OpenSpec, Tessl,
> BMAD, Conductor, Traycer, Cursor 3, Zed agent panel, Google Jules, Jama Live Trace Explorer,
> Polarion Auto-Suspect, DOORS Next, Codebeamer Coverage Browser, Cucumber/Reqnroll, JSON Canvas
> 1.0, Obsidian Sync, Excalidraw, n8n Canvas, Kumu, Rete.js, Blender/Houdini, Warp, Storybook,
> Turborepo Telemetry, Linear Triage Intelligence, Agent Client Protocol, Loro/Yjs/Automerge,
> Electric SQL, Zero, Liveblocks.

---

## Ya promovidas a spec (2026-08-30)

- **Spec 042 — El lienzo deja de destruir lo que no entendió.** Las cinco rutas del bloque A que no
  son de concurrencia: A.1 (board ilegible), A.2 (pruebas del store), A.3 (round-trip), A.6 (estado
  error), A.9 (guardia de atajos) y la validación por nodo en `writeBoard` que la 041 dejó abierta
  en su decisión 8. Seis fases, 7 requisitos, 11 criterios EARS. Fundacional: bloquea a v8-v12
  porque toca el único módulo capaz de destruir trabajo del usuario. Pendiente de aprobación. [alta]

- **Siguiente spec propuesta — La concurrencia del tablero.** El resto del bloque A, que es un
  problema distinto con su propio protocolo: A.4 (serialización canónica), A.5 (ETag/If-Match y
  409), A.7 (eco por identidad), A.8 (presencia visible y líder entre pestañas) y A.10 (copia de
  conflicto). Depende en duro de la 042 —las pruebas del store— y de su propia serialización
  canónica antes del identificador de versión. Se separó al revisar la 042: juntas daban 11
  requisitos y 279 líneas, contra el listón «1-3 páginas» del propio repo. [alta]

Los bloques B a H siguen en este documento y se promueven de uno en uno, en el orden de «Paquetes
sugeridos» — una spec activa a la vez, como manda
`template-context/core-instructions/AGENT_OPERATING_SYSTEM.md:57`.

---

## Verificado ejecutando el builder (2026-08-30)

Cinco cosas que solo aparecen al abrirlo. Servidor apuntado a un workspace con las 41 specs de
este repo, Chrome a 1440×900.

1. **La pantalla de error miente y ofrece un comando que reproduce el error.** Cualquier fallo de
   carga —incluido un 500 de un servidor perfectamente vivo— se pinta como «api inalcanzable · El
   builder no encuentra el servidor» (`i18n.ts:630-631`), porque `store.ts:297` mete todo error en
   un único `loadError` sin tipo. El comando que sugiere, `SDD_PROJECT_ROOT=. npm run
   mcp:http:start`, ejecutado desde la raíz del template produce exactamente el error que el
   usuario acaba de ver (`workspace.ts:114` lo rechaza por diseño). El mensaje real del servidor sí
   se muestra: en inglés, dentro de un `<pre>`, bajo un titular que lo contradice. **[alta] [S]**
   → Separar «no hay servidor» de «el servidor dijo que no», y que cada uno lleve su salida.
   *Encaja con E.5 (taxonomía de errores); es su mitad visible.*

2. **41 peticiones HTTP al cargar, una por spec, solo para los puntajes.** Confirmado en el panel
   de red: `loadScores` (`store.ts:262-271`) hace `Promise.allSettled` sobre cada id y no existe
   endpoint en lote (`api.ts:162` solo sirve `/api/spec/:id/score`). Se repite entero en **cada**
   evento `kind=specs`: tocar un solo `tasks.md` relanza las 41. **[alta] [M]** → ver E.7.

3. **«Implementar está bloqueado» sin decir por qué y con el botón equivocado.**
   `SpecDrawer.tsx:78` bloquea con `!isApproved || issues.length > 0`, pero las `issues` **no
   entran** en el texto de razones (`:106-109`), y el único botón es «Ir a aprobación» (`:120`).
   Una spec ya aprobada con errores de validación muestra el candado, ninguna razón accionable y
   un botón que no lleva a ninguna parte. Visto en la 001: aprobada, 8/8 tareas, bloqueada, muda.
   **[alta] [S]** → Listar las `issues` como razones y, si ya está aprobada, que el botón lleve a
   ellas. Se resuelve junto con B.5 y B.6.

4. **El `min-h` del rail no hace lo que su propio comentario dice.** `Rail.tsx:122-124` documenta
   que usa `min-h` en vez de `h` para que «029-actualizacion-sin-sorpresas» envuelva a dos líneas
   sin invadir la fila siguiente. Medido en el navegador: el botón necesita **33.75px** y se queda
   en **26**, porque el contenedor es `flex-col` y el `flex-shrink: 1` por defecto lo recomprime.
   El nombre largo se sale por abajo y pisa la fila de al lado. **[media] [S]** → `shrink-0`.
   Una palabra.

5. **Con 41 tarjetas el `fitView` de arranque deja el zoom al 20%**: un muro de rectángulos
   ilegibles, sin nivel de detalle ni agrupación. Y los 45 nodos del lienzo llevan `tabindex` y
   `role="group"` con **cero `aria-label`**; la página no tiene ningún `h1`. **[alta] [M/L]**
   → ver D y F.

---

## Lo que ya funciona (y no hay que tocar)

- **La arquitectura de fondo aguanta.** Los `.md` son la fuente de verdad, `board.canvas` solo
  lleva layout, la pertenencia a grupos se deriva de la geometría y no se persiste (spec 041), y
  `withFileLock` serializa de verdad los read-modify-write en proceso.
- **La decisión de no llamar a ningún LLM envejeció bien.** El mercado convergió ahí: Figma tuvo
  que abrir MCP para que agentes externos escriban en sus tableros, y la validación determinista
  sin modelo (`openspec validate --strict`) es ya categoría propia. El builder nace con eso
  resuelto, y sin gastar tokens del usuario por existir — frente a competencia que raciona la IA
  por suscripción.
- **El núcleo tiene pruebas reales.** 13 ficheros de prueba en `builder/src/`, `strict: true` con
  `noUnusedLocals`, cero `as any`, un solo `as unknown as` justificado (`convert.ts:213`).
- **El i18n tiene guardián en CI** (`test-mcp-integration.mjs:1618-1687`): paridad de 471 claves y
  existencia de cada `t("literal")`. Más de lo que tiene la mayoría.

---

## A. No perder trabajo — el único camino por el que el producto destruye algo irrecuperable

1. **Un `board.canvas` ilegible se sustituye en silencio por una cuadrícula por defecto, y el
   primer gesto del usuario la escribe en disco.** `board.ts:327-334` usa el mismo `catch` para «no
   existe» y «no se pudo parsear» y devuelve `defaultBoard`. Escenario garantizado: un merge de git
   deja marcadores `<<<<<<<`, el usuario abre el builder, ve su tablero raro, **mueve una tarjeta
   para investigar**, y a los 500 ms `flushSave` sobrescribe el fichero entero. Es la misma clase
   de defecto que la 041 arregló para los grupos, aplicada al documento completo. **[alta] [M]**
   → Separar los dos errores, propagar el error tipado, banner bloqueante que **desactive el
   autoguardado**, y copia `.bak` antes del primer PUT de sesión.

2. **`store.ts` —742 líneas, el módulo que escribe `specs/board.canvas`— no tiene ni una prueba.**
   Ningún `builder/src/*.test.ts` importa `./store`. Sin cobertura: el orden crítico
   `toAbsoluteNodes` antes de `applyNodeChanges`, la guarda de eco, el last-writer-wins, el
   debounce y el undo/redo. Y `builder/package.json` solo trae `jsdom`: hoy no hay forma de
   escribir una prueba de comportamiento. **[alta] [L]** → *Continuación de la spec 024, cuyo
   «fuera de alcance» dejó los componentes y nunca nombró `store.ts`.* **Va antes que cualquier
   otro arreglo de este bloque: sin ella, tocar el único módulo que puede borrar trabajo es una
   apuesta a ciegas.**

3. **El round-trip de JSON Canvas sigue destruyendo lo que no pinta.** `convert.ts:396-407` escribe
   `fromSide: "right"` y `toSide: "left"` **a mano** y recalcula el color de la arista desde la
   etiqueta en cada guardado; el nodo `link` de la especificación 1.0 no tiene rama y sale
   convertido en `text` vacío; `subpath` desaparece. El mecanismo correcto ya existe, pero solo
   para grupos (`convert.ts:196-241`, `GROUP_OWN_FIELDS` + `extra`). Abrir el tablero en Obsidian,
   moverlo y volver al builder cuesta información. **[alta] [M]** → *Continuación de la spec 041,
   cuya decisión 1 fijó el principio «lo que entra vuelve a salir igual» y lo aplicó a un solo
   tipo de nodo.*

4. **Serialización canónica y estable del `.canvas`**: claves ordenadas, nodos por id, coordenadas
   redondeadas, salto final. Un movimiento pasa a ser un diff de pocas líneas, y con eso desaparece
   la mitad de los conflictos de git sin escribir ningún merge driver. **[alta] [S]** → Es
   prerrequisito de A.5 y del ítem 5 del backlog v3 (diff del board entre commits).

5. **ETag / If-Match sobre el PUT completo**, con el hash sobre el contenido canónico: un 409
   devuelve el estado actual y el builder pinta el conflicto en vez de pisarlo. **[alta] [S]**
   → *Continuación de la spec 041, cuya decisión 8 declaró el `as never` del PUT «defecto real y
   separable… va en su propia spec». Esa spec nunca se creó.*

6. **Tres líneas que hoy pierden trabajo:** `beforeunload` cubre `dirty` y `saving` pero **no
   `error`** (`App.tsx:234-241`), que es el único estado donde consta que el trabajo no está en
   disco; `handleLiveChange` deja pasar el evento externo en estado `error` (`store.ts:723-724`) y
   recarga desde disco con `past: []`, borrando el trabajo **y su banner rojo a la vez**; y
   `flushSave` no reintenta. **[alta] [S]**

7. **La guarda de eco es un reloj sin identidad.** `BOARD_ECHO_WINDOW_MS = 1000` frente a un eco
   real de ~300 ms (`events.ts:13`): quedan ~700 ms en los que un cambio ajeno se descarta y **no
   vuelve nunca**, porque no hay reintento y el watcher colapsa la ráfaga. La arista que acaba de
   escribir el agente puede morir ahí. **[media] [M]** → El PUT devuelve el hash de lo escrito, el
   evento `change` lo lleva, la guarda compara identificadores.

8. **Dos pestañas se pisan en silencio, y la señal que lo diría está a medio cablear.** La política
   está declarada por escrito en `store.ts:717-724` («last-writer-wins»). El `presenceCount` viaja
   por SSE hasta el store (`live.ts:73-79`, `store.ts:128`) y **no se pinta en ningún componente**:
   la clave `topbar.presence.title` (`i18n.ts:103`) está huérfana. **[media] [S]** → Elección de
   líder con Web Locks: solo la pestaña líder autoguarda, el resto en modo espejo con botón «tomar
   el control». Y pintar de una vez la presencia que ya llega.

9. **Los atajos `I`/`E`/`G`/`S` siguen vivos con modales sin campo de texto abiertos.**
   `App.tsx:290-307` se inhibe con una lista blanca de banderas que no incluye `connectOpen` ni el
   modal de implementar; ninguno de los dos tiene `<input>`, así que Radix deja el foco en un botón
   y la tecla pasa. Aparece un marco de 760×320 **detrás del diálogo**, adopta como hijas las
   tarjetas de debajo (la pertenencia es geométrica, spec 041) y 500 ms después está en disco.
   **[alta] [S]** → Guardia estructural: salir si `e.target.closest('[role="dialog"]')`, en vez de
   una lista blanca que el próximo modal volverá a olvidar.

10. **Copia de conflicto estilo Obsidian** (`board.conflict-AAAAMMDD-HHMM.canvas`) cuando el merge
    no sea seguro. Obsidian Sync y Syncthing resuelven así el mismo problema en el mismo tipo de
    fichero: cuando no puedes mergear, no elijas — deja las dos y que decida el humano.
    **[baja] [M]** → depende de A.5.

---

## B. Cerrar la regla de oro — el tema de credibilidad

La frase que encabeza ambos README y el sitio («no hay código sin spec aprobada y plan
consistente») se cumple hoy con un plan vacío, y el sitio donde debería escribirse no existe.

1. **No hay ninguna ruta de escritura de `plan.md` en el builder.** Ruteo completo de
   `api.ts:56-300`: board, gate, approve, consent, sections, issues, tasks, score, requests,
   status, roadmap, version, connect, spec. Ninguna escribe el plan. El agente por MCP sí puede
   (`sdd_write_spec_document`, spec 028). **La asimetría es la peor posible para el
   posicionamiento: el agente tiene más poderes sobre los documentos de la spec que la persona
   sentada delante del producto visual.** Es el momento exacto en que se abandona el lienzo.
   **[alta] [M]** → Quinta pestaña «Plan» en el drawer, con las secciones que reconoce el gate,
   sobre `PUT /api/spec/:id/plan`, con su «Ampliar con IA» como el resto.

2. **El gate mide «plan consistente» con un grep de tres títulos que escribe el propio
   andamiador.** `index.ts:379-386` cuenta `Riesgo|Risk`, `Dependenc…`, `Hito|Milestone|Fase|Phase`
   y falla solo con menos de 2. `specs/_template/plan.md` trae los tres con el cuerpo vacío y
   `createSpec` copia la plantilla verbatim. Recorrido real: asistente → aprobar → «Autorizo
   empezar» → «Implementar con agente», **compuerta en verde sobre placeholders**. **[alta] [M]**
   → Contar contenido, no títulos. **Dependencia dura: B.1 antes que B.2** — endurecer el criterio
   sin dar dónde escribir el plan convierte la compuerta en un muro.

3. **El semáforo de deriva —el diferencial que el backlog v3 llama «el foso»— es inalcanzable
   desde el lienzo.** `fileScope` existe en el núcleo (`spec-actions.ts:203-207`) y
   `PUT /api/spec/:id/sections` ya lo acepta, pero el espejo del frontend tiene 7 claves
   (`sections.ts:15-21`) y `grep -rn fileScope builder/src` devuelve **cero líneas** (verificado).
   Sin ámbito, `drift.ts:67` devuelve `unscoped`, y ese estado es mudo: `SpecNode.tsx:60-62`
   comenta «Only 'drifted' earns a tag». Un usuario que solo use el lienzo tiene 0 specs con
   ámbito y un chip «con deriva 0» permanente: **el silencio se lee como "todo limpio"**, que es
   justo el falso negativo que `drift.ts:60-62` dice haber querido evitar. Dogfooding: 26 de tus 41
   specs tienen ámbito, **todas escritas fuera del builder**. **[alta] [S]** → *Continuación de la
   spec 025, que implementó el cálculo y el chip; nadie cubrió la captura del ámbito.* **Bloquea el
   bloque H entero.**

4. **El formulario de aprobación pide exactamente la práctica que la spec 037 erradicó de 25
   `spec.md`.** `i18n.ts:419` etiqueta «Evidencia (enlace o **cita corta**)» y `:614` sugiere «la
   cita del OK». La propia 037 diagnosticó la causa por escrito —«La invitó el formulario.
   Cualquier limpieza que no toque la plantilla se vuelve a llenar»— y sus tareas tocaron
   plantillas, specs, history, decisiones y el log: **ninguna tocó el builder**. Y si el campo
   queda vacío, `spec-actions.ts:39` escribe «Aprobado desde SDD Builder (fecha)», que tampoco dice
   qué se aprobó. **[alta] [S]** → Reescribir las cuatro cadenas a la norma («qué se aprobó, con
   qué alcance y contra qué documento») y rechazar el campo vacío con mensaje claro.

5. **«Ver qué falta» es un callejón sin salida.** `GateStatusBar.tsx:72-81` pinta cada spec con
   problemas como `<p className="font-mono">{specId}</p>`. Ni botón ni `onClick`, con `selectSpec`
   disponible en el mismo módulo. Para arreglar el primero hay que memorizar el identificador,
   cerrar el popover y abrir ⌘K. Por cada uno de los siete. **[media] [S]**

6. **Antes de habilitar «Implementar con agente», enseñar qué falta** con las observaciones que
   `scoreSpec` ya produce y `GET /api/spec/:id/score` ya sirve. Hoy el drawer las pinta **en
   inglés** dentro de una UI en español, porque las notas de `score.ts:50-105` son literales sin
   diccionario. **[media] [S]** *(la mitad de i18n es hallazgo de la sesión en navegador).*

**Qué hacen los demás:** Kiro pone entre corchetes, en cada tarea, los IDs de requisito que
satisface — la referencia inversa como convención de texto, un parser de una línea. Spec Kit trata
`plan.md` como artefacto de primera clase con una «constitución» de principios inmutables por
debajo. Supabase Advisors da cuatro campos por hallazgo: qué pasa, qué consecuencia tiene, por qué
existe la regla y **cómo se arregla** — la salud no es un dashboard, es una lista de lints con
remedio. Jama calcula un Trace Score como porcentaje de relaciones **esperadas** que existen de
verdad: sin denominador declarado no hay hueco posible, solo un grafo bonito.

---

## C. La cola de IA no cierra el bucle

El contrato está bien. Lo que falla es que nada empuja al agente a volver, y que una propuesta ya
redactada se puede quedar sin salida.

1. **No hay espera larga: `sdd_next_request` devuelve `null` al instante** (`server.ts:1125-1147`),
   y `connect.ts:42` instruye «vuelve a consultar cuando el usuario te lo pida». Cada consulta
   vacía cuesta un turno completo del modelo, así que el agente hace dos o tres pasadas y se para.
   Escribes tu petición cinco minutos después, se queda `pending`, y **el tiempo pedir→atender lo
   marca que te acuerdes de ir a la terminal a empujar**. Es el defecto que hace que la función se
   sienta rota aunque cada pieza funcione. **[alta] [M]** → `waitMs` opcional (tope ~120 s)
   apoyado en el watcher que ya existe; un turno del agente cubre dos minutos de guardia.

2. **Aceptar una propuesta de tareas duplica en disco todo lo que ya existía.**
   `SpecDrawer.tsx:271` manda la lista **completa** como `currentText`, `diff.ts:30` pinta las
   comunes como filas `same`, y `acceptTasks` (`:236-246`) hace `addTask` de **todas** las líneas.
   Con 6 tareas y 3 nuevas, aceptas viendo 6 neutras y 3 verdes y en disco quedan 15, con las 6
   originales duplicadas y desmarcadas. **El diff, que es la firma humana de todo el diseño,
   describe una operación que no es la que se ejecuta.** **[alta] [M]** → Es el único ítem de este
   bloque que hoy corrompe datos; se puede adelantar suelto.

3. **La petición `answered` se queda colgada sin forma de cerrarla.** `GateStatusBar.tsx:141`
   oculta el botón de cancelar precisamente para `answered`, y `requests.ts:73-77` la sigue
   contando como activa: un contador encendido para siempre que no puedes ni ver ni cerrar (el
   vínculo petición↔campo es `useState` local en `AiAssistButton.tsx:89`, y el drawer se
   desmonta). **[media] [M]**

4. **`structure-idea` viaja sin ningún contexto del workspace.** `AssistantWizard.tsx:109-112`
   manda solo la descripción —sin `target`, sin `currentText`, sin `context`— mientras
   `SectionEditor.tsx:347` sí manda `buildSpecContext` de la spec 039. En un workspace con 20
   specs el agente propone un nombre sin haber visto el índice. **El asistente es el punto de
   entrada del producto y es donde menos contexto se manda.** **[media] [S]**

5. **La presencia de 5 minutos se cae mientras el agente redacta**, porque solo se toca al polear
   (`requests.ts:209`): el agente que está trabajando es justo el que se marca como ausente.
   **[media] [S]** → refrescar también en `respondAiRequest`.

6. **`.sdd/requests/` nunca se poda y `agent-presence.json` vive dentro del directorio vigilado**,
   así que un poll en vacío dispara `change kind: request` y recarga la cola entera en todas las
   pestañas. **[media] [M]**

7. **Estados nombrados y visibles** (encolada / reclamada / propuesta lista / aceptada /
   rechazada), contador permanente de «esperando tu aprobación» y notificación al llegar
   respuesta. **[media] [S]**

**Qué hacen los demás:** Cursor 3 muestra estado explícito *idle / running / **awaiting
approval***: en un sistema sin LLM propio el estado que importa no es «pensando», es «la pelota
está en tu tejado». Zed notifica en escritorio cuando el agente queda esperando. Los patrones HITL
canónicos formulan la regla como **autonomía en lecturas, humano en las escrituras** — que es
exactamente la decisión de este proyecto, dicha como principio reconocible en vez de como
limitación. Linear Triage Intelligence da el molde visual: la sugerencia usa el lenguaje del
producto pero **nunca se confunde con el dato humano**.

---

## D. Con 40 specs el lienzo deja de orientar

Este repo ya tiene 41.

1. **Un `focusSpec` único** que centre el nodo, lo marque `selected` y **descuente el ancho del
   drawer** al calcular el centro. Hoy hay dos rutas con dos resultados (`Rail.tsx:107-116` hace
   `setCenter`, `CommandPalette.tsx:169-176` no hace nada más que `selectSpec`), y el drawer de
   560px tapa íntegramente la tarjeta que acabas de pedir abrir. **[alta] [M]** → **Va antes que
   D.2 y D.6**: si cada superficie nueva reimplementa «ir a una spec», el bug se reproduce tres
   veces más.

2. **Filtro de texto en el rail**, y que los chips de la ContextStrip reduzcan también su lista
   («12 de 41»). Hoy el rail es `Object.values(specs).sort()` y un `map` directo: la única vista
   siempre presente del proyecto no se puede reducir nunca. **[alta] [M]**

3. **«+ Añadir unión» en la pestaña relaciones**, con selector de spec destino y de tipo. Hoy la
   **única** forma de crear una arista es arrastrar de conector a conector en el lienzo, y con
   `fitView` + `minZoom={0.2}` los conectores quedan en 2-3 px. Es además un gesto exclusivamente
   de ratón: **con teclado no se puede declarar que la 012 depende de la 011** — justo el dato del
   que viven los avisos de dependencia del gate. **[alta] [M]**

4. **Los chips de filtro siguen pintados y activos en kanban, donde no filtran nada.**
   `App.tsx:355` monta `<ContextStrip />` fuera de la rama de `viewMode` y `KanbanBoard.tsx:206-222`
   nunca lee `filters`. La interfaz afirma con `aria-pressed="true"` un estado que no aplica.
   **[media] [S]**

5. **El tour se auto-ofrece en cada recarga** salvo que marcaras la casilla (cerrar con la X no
   deja rastro), **y sus pasos 3 y 4 piden gestos imposibles**: dicen «arrastra desde el punto
   derecho de una tarjeta» mientras el lienzo que resaltan está tapado por el `EmptyOverlay`, que
   solo existe cuando no hay ninguna tarjeta. **[media] [S]**

6. **Quickmarks y prefijos en ⌘K.** `ctrl+1..5` guarda centro+zoom y `1..5` vuelve (el patrón de
   Houdini, cinco viewports en localStorage). Prefijos `spec:` / `task:` / `go:` / `do:` / `ask:`
   al estilo Warp, con `go:` y `do:` separados para que Enter nunca dispare por accidente una
   escritura. **[media] [S]**

7. **Colapsar grupos a un bloque nombrado** con recuento y estado agregado, y **focus por N saltos**
   con el resto atenuado (el patrón de Kumu: un BFS sobre las aristas que ya tienes). n8n puso el
   umbral del colapso en 50 nodos; un repo SDD llega ahí con 40 specs. **[media] [M]**

8. **Chip permanente de versión en la IdentityBar** que vuelva a desplegar la franja, y acción
   «Estado de versión» en ⌘K: hoy, descartado el aviso, **desaparece del producto entero**
   (`VersionNotice.tsx:47-56`) — el fallo que las specs 021 y 029 se propusieron eliminar,
   reintroducido por el botón de cerrar. **[media] [S]**

**Lección ajena que conviene no repetir:** Storybook envió una checklist de onboarding en la
sidebar, generó rechazo público por reaparecer tras descartarla y por sobrar en proyectos maduros,
y acabó necesitando un flag y saliendo del flujo de init. **El estado de arranque debe derivarse
del disco:** si hay specs, no hay guía. Arreglar el tour es lo correcto; añadir una checklist
encima sería repetir el error de otro.

---

## E. Superficie HTTP y coste por evento

1. **Nadie valida la cabecera `Host`, y los GET no pasan ningún control de origen.**
   `security.ts:128` hace `if (!isMutatingMethod(req.method)) return null;` antes de cualquier otra
   comprobación, y `enableDnsRebindingProtection` / `allowedHosts` —que el SDK ofrece— no se usan
   en `transport.ts:108-114`. Con DNS rebinding, una página cualquiera se vuelve same-origin y lee
   `GET /api/board` (todas las specs y el `projectRoot` absoluto), `/api/spec/<id>` (texto completo
   de spec, plan y tasks), **`/api/bitacora/decisiones`** y `/api/connect`. Las escrituras sí
   quedan bloqueadas por la lista de orígenes: **el daño es exfiltración, no escritura.**
   **[alta] [S]** → Comprobar `Host` en **todos** los métodos. Es una tarde y cierra el agujero.

2. **Cualquier página en cualquier puerto de localhost puede aprobar specs.** `security.ts:92`
   acepta cualquier hostname loopback **sin mirar el puerto**, deliberadamente, para que el dev
   server de Vite siga funcionando (`:74-79`). Quedan expuestos `approve`, `consent` e `issues`
   —y al final de esa cadena está `gh issue create` con tu token—. Un `npm run dev` de otro
   proyecto puede abrir la compuerta y firmar la evidencia con el nombre que quiera. **[alta] [S]**
   → Restringir al puerto servido y meter el de Vite tras `NODE_ENV=development`.

3. **Token opcional al arranque**, inyectado en el index.html que sirve `static.ts` y exigido en
   `/api/*` y `/mcp`; **obligatorio cuando el host no es loopback**, en vez del WARNING por stderr
   de `http.ts:51-60` que arranca igual. Avisar también cuando `ALLOWED_ORIGINS` contiene `*`, que
   hoy desactiva la comprobación entera en silencio. **[media] [M]**

4. **El `/mcp` por HTTP no está confinado al workspace del servidor; el REST sí.** `api.ts:52`
   cierra sobre el `projectRoot`, pero `schemas.ts:9-11` es `z.string()` libre y
   `sdd_install_sidecar` acaba en `execFileAsync("bash", …)`. Dos transportes del mismo servidor
   con alcances distintos, y nada lo documenta. **[media] [M]**

5. **Taxonomía mínima de errores**: ENOENT → 404, parseo → 400, regla SDD → 422 con `code`, resto
   → 500. Hoy `api.ts:304-321` devuelve 422 con el `message` verbatim, así que abrir una spec
   renombrada pinta `ENOENT: no such file or directory, open '/Users/…'` en el drawer, y el 404 de
   ruta desconocida se responde en **texto plano**, que `builder/src/api.ts:43` no sabe parsear.
   **[media] [M]** → *Continuación de la spec 010 R1, que se hizo solo para GitHub.* Incluye el
   punto 1 de la sesión en navegador.

6. **Tras reconectar el SSE el indicador dice «en vivo» y los datos siguen viejos**: `live.ts:46-50`
   solo resetea el backoff, sin volver a pedir nada, y el hueco llega a 15 s por backoff o a más de
   60 s por conexión rancia. **[media] [S]** → Reconciliar en `onopen`; cuesta lo mismo que un
   evento `change` normal.

7. **El coste por evento crece con el proyecto.** `GET /api/board` lanza **dos procesos git por
   spec** con ámbito, sin caché (`drift.ts:73-88` un `git log`, `:105-113` un `rev-parse` **dentro**
   del bucle). Medido aquí: 54 `rev-parse` = 146 ms, 27 `git log` = 89 ms. Sumado al N+1 de
   puntuaciones, **abrir este repo dispara ~43 peticiones y ~54 procesos git, por pestaña**, y se
   repite entero cada vez que el agente escribe una spec. **[alta] [S+M]** → Memoizar `isGitRepo`
   (una línea, elimina la mitad de los procesos) · `GET /api/scores` en lote · cachear drift por
   `(specId, HEAD, fecha de aprobación)` · `onlyRenderVisibleElements` en el lienzo.
   **Aviso de dirección: el ítem 6 del backlog v3 (capa de arquitectura, «reusa la consulta git de
   la 025») agravaría justo esto. Arreglar el coste antes de construir encima.**

---

## F. Accesibilidad y contraste

Ni el backlog v3 ni ninguna spec de la 001 a la 041 mencionan accesibilidad, teclado o lectores de
pantalla. Es el hueco más limpio del producto.

1. **`--muted-foreground` no llega a 4.5:1 en modo claro.** `styles.css:24` es
   `oklch(0.58 0.015 258)`: **4.28:1 sobre card, 4.02:1 sobre background, 3.95:1 sobre muted**. La
   clase aparece 128 veces en `builder/src/**/*.tsx`, 51 de ellas a 10-12.5px. En oscuro sí pasa.
   El script que lo detectaría **ya está escrito** (`scripts/check-contrast.mjs`, spec 035) y no
   incluye ni un par del builder, y `npm run docs:contrast` no aparece en ningún workflow.
   **[alta] [S]** → Bajar a L≈0.545, añadir los pares reales y **meter el script en CI**. Un
   script de contraste que nadie corre es documentación, no una compuerta.

2. **El editor guiado —la pantalla donde se escribe la spec— no tiene etiquetas programáticas.**
   `SectionEditor.tsx:95-104` renderiza las listas con `placeholder` y sin `<label>`, sin
   `id`/`htmlFor`, sin `aria-label`; el placeholder es nombre accesible de último recurso y
   **desaparece en cuanto escribes**. Los avisos de resultado (`:520-529`) son `<p>` sin
   `role="alert"`: al pulsar Guardar no se anuncia ni el error ni el «✓ guardado». El patrón
   correcto ya está resuelto en el mismo repo (`ApprovalPanel`, `SpecDrawer.tsx:389-391`).
   **[alta] [S]**

3. **Cuatro gestos del lienzo no tienen gemelo de teclado**: editar una nota (`NoteNode.tsx:42`,
   solo `onDoubleClick`), renombrar un grupo (`GroupNode.tsx:65`), fijar el propósito de una arista
   (`LabeledEdge.tsx:150-157`, un `<div>` sin `tabIndex`, sin `role`, sin `onKeyDown`) y crear una
   conexión. Con teclado se navega y se mueven tarjetas, pero **no se escribe el texto de una
   idea, no se titula un marco y no se declara una dependencia**. Los 45 nodos llevan `tabindex`
   con `role="group"` y **cero `aria-label`** (verificado en navegador), y la página no tiene
   `h1`. **[alta] [L]** → Merece su propia spec. D.3 le resuelve gratis la mitad más difícil.

4. **Tipar `TFunction` con `key: keyof typeof es`** (`i18n.ts:1300`): mueve la comprobación a
   `tsc` y hace innecesario el regex del guardián, que hoy solo ve `t("literal")` y deja fuera 28
   llamadas con clave construida. **[baja] [S]**

---

## G. Posicionamiento y primer minuto

No toca código: es edición de texto y una conexión que ya existe.

1. **El builder vive dentro de un `<details>` rotulado «opcional, avanzado»** (`README.es.md:195`,
   idéntico en inglés), y dentro, en `:210`, la receta que enseña es la de contribuyente:
   «compila una vez con `npm run builder:build`…». La guía real dice lo contrario —«no hay que
   clonar este repositorio y no hay que compilar nada», `docs/es/51:18`— y da
   `npx @juanklagos/sdd-mcp@latest --http`. **`QUICKSTART.md` no menciona builder, lienzo ni canvas
   ni una sola vez** (verificado: 0 coincidencias). Hay 7 capturas reales en `docs/assets/builder/`
   y **ninguna aparece en las portadas**, que enseñan un GIF de terminal. La decisión del
   2026-08-17 («el builder en navegador como ruta recomendada») solo tocó el sitio; los README
   quedaron atrás. **[alta] [S]** → Sacarlo del `<details>`, sección propia con captura y los dos
   comandos reales, y un paso 8 en QUICKSTART: «míralo en el lienzo».

2. **El repo real que ya existe recibe el peor arranque**, siendo el caso que `CLAUDE.md` declara
   recomendado. El asistente ✨ es una heurística de palabras clave sobre una frase
   (`assistant.ts:1-8`, dominios fijos auth/pagos/catálogo) que **nunca mira el código**. La
   herramienta que sí lo hace, `sdd_legacy_discovery`, **no está cableada a ningún botón**:
   `grep -rn "legacy\|discovery" builder/src` solo devuelve dos comentarios sobre el portapapeles.
   **[alta] [L]** → Cuando el workspace tiene código y cero specs, ofrecer «Explorar este
   repositorio» y usar su reporte como semilla del asistente. *Es el paso previo barato al ítem 2
   del backlog v3 (modo delta), cinco semanas sin spec.*

3. **`STATUS.md` lleva 17 días desactualizado y le faltan 8 specs**: dice `2026-08-13 14:44 UTC` y
   tiene 33 filas frente a 41 en `specs/INDEX.md` (verificado). Faltan 034-041, incluidas las dos
   releases del 25 de agosto. El botón que lo regenera está dentro del propio producto.
   **[media] [S]** → Regenerarlo y añadir la regeneración a `RELEASING.md`, que es donde viven los
   pasos que sí se ejecutan siempre. Si va a seguir siendo manual, mejor no versionarlo.

4. **Ejecutar la revisión de higiene MCP vencida el 2026-07-28** (ítem 13 del backlog v3):
   confirmar que nada del server usa Roots/Logging tras SEP-2577 y registrar el resultado.
   **[baja] [S]**

**Grietas explotables del mercado, en una línea cada una:** el competidor más cercano guarda en
PostgreSQL — «sin base de datos, tus specs son ficheros en tu repo, versionados en git y legibles
en Obsidian» es un argumento comparativo verificable, no una preferencia. Conductor vende
local-first y gratis como posicionamiento explícito en un panorama de pago y nube. Y Tessl se
reposicionó de «specs» a «skills para agentes»: **lo que la gente compra no es "gestiona tus
specs", es "esto hace que tu agente no se invente cosas"**.

---

## H. Trazabilidad — el backlog v3, por fin

No es un defecto: es el hueco de producto que el barrido confirma que nadie ha llenado. Va al final
porque **depende en duro de B.3 (`fileScope` capturable) y de E.7 (coste)**.

Camino más corto, en este orden, y todo determinista:

1. **IDs estables `REQ-nnn-mm` en el markdown y un marcador único en comentarios de código**,
   ambos localizables con `grep`. StrictDoc es la referencia verificada: activando
   `REQUIREMENT_TO_SOURCE_TRACEABILITY` reconoce marcadores `@relation` **solo** en comentarios del
   código, con rol (`Implementation`, `Test`), y con eso genera cobertura en los dos sentidos.
   **Restringirse a un marcador único es lo que hace el sistema fiable.** **[M]**
2. **Aristas de color con estado**, incluida la arista fantasma punteada para la relación esperada
   y ausente. **[S]**
3. **Sospecha por timestamp de git, direccional y solo hacia abajo** (el criterio de Polarion:
   elimina el grueso de los falsos positivos que matan estos indicadores). Limpiarla debe ser un
   acto deliberado con dueño, al estilo DOORS Next: el botón no borra un flag, **escribe una línea
   en `history.md` con fecha** — que encaja exactamente con la regla de evidencia de la 037. **[S]**
4. **Tres colores, no dos.** Cucumber no cuenta `undefined` ni `pending` como `failed`: amarillo =
   declarado sin implementar, rojo = roto, gris = fuera de alcance. Confundir «todavía no» con
   «mal» hace que la gente apague el tablero. **[S]**
5. **Dos porcentajes en la cabecera** (% de requisitos con realización, % con verificación) y un
   panel que explique la cuenta al pulsarlos, como el desglose del Trace Score de Jama. **[S]**

**La lección más dura del barrido:** MUSUBI tiene sobre el papel la trazabilidad completa que todos
piden, y adopción nula. **Esto solo se adopta si es casi gratis: debe derivarse de aristas que el
usuario ya dibuja, nunca de un formulario extra.**

---

## Paquetes sugeridos

- **v7 «No perder trabajo»** (bloqueante de todo lo demás): A.2 pruebas del store → A.4
  serialización canónica → A.1 board ilegible → A.3 round-trip completo → A.5 ETag → A.6 estado
  error → A.9 guardia de atajos → A.7 eco por identidad → A.8 líder entre pestañas.
  **Dependencias duras:** A.2 antes de cualquier cosa que toque `store.ts` o `convert.ts`; A.4
  antes de A.5 (o cada autoguardado sin cambios genera un falso 409) y antes de cualquier
  `.gitattributes`. **Por qué primero: es el único tema donde el producto puede destruir algo que
  no se recupera. Todo lo demás es fricción.**
- **v8 «Cerrar la regla de oro»**: B.1 pestaña Plan → B.2 gate por contenido → B.3 fileScope →
  B.4 evidencia según la 037 → B.5 gate clicable → B.6 qué falta. **B.1 antes que B.2. B.3 antes
  de todo el bloque H. v7 antes de v8** en la parte que escribe: B.1 añade un escritor nuevo, y
  quieres el ETag y las pruebas puestos antes de multiplicar escritores.
- **v9 «La cola que se cierra sola»**: C.1 long-poll → C.7 estados nombrados → C.3 cerrar
  `answered` → C.4 contexto en `structure-idea` → C.5 presencia → C.6 poda. **C.2 (duplicado de
  tareas) es independiente y conviene adelantarlo: hoy corrompe datos en disco.**
- **v10 «Orientación con volumen»**: D.1 focusSpec → D.4 chips coherentes → D.5 tour → D.8 chip de
  versión → D.2 filtro del rail → D.3 añadir unión → D.6 quickmarks → D.7 colapsar grupos.
  **D.1 antes que D.2 y D.6. D.3 desbloquea media F.3.**
- **v11 «Superficie y coste»**: E.1 Host check → E.2 puerto de loopback → E.3 token → E.4 confinar
  `/mcp` → E.5 taxonomía de errores → E.6 reconciliar en `onopen` → E.7 coste.
  **E.1 antes que E.3. E.7 antes del ítem 6 del backlog v3.**
- **v12 «Trazabilidad»**: el bloque H completo, más los ítems 4 (decisiones como nodos) y 5 (diff
  del board entre commits, que se vuelve barato en cuanto exista A.4) del backlog v3.
- **Transversal, barato, en cualquier momento**: F.1 contraste + CI · F.2 labels del editor · F.4
  tipar TFunction · G.1 README y QUICKSTART · G.3 STATUS · G.4 revisión MCP vencida · los puntos 1,
  3 y 4 de la sesión en navegador. **F.3 (teclado completo) merece spec propia, en paralelo a v10.**

---

## No hacer (con motivo)

1. **No meter CRDT (Yjs, Automerge, Loro) en el lienzo.** Los tres persisten estado binario, así
   que convivir con un fichero legible obliga a dos fuentes de verdad y a un blob opaco en git. El
   caso real es «dos pestañas de la misma persona», no edición concurrente carácter a carácter. Y
   el precedente pesa: **tldraw, el lienzo comercial más conocido, no usa CRDT** — usa servidor
   autoritativo por sala (verificado en su documentación).
2. **No montar sync engines** (Electric SQL, Zero, Jazz, Liveblocks, PartyKit). El motor pesa más
   que el problema, y Liveblocks ni siquiera permite self-host: rompen la promesa «todo local» que
   ya sostiene la decisión de no llamar a ningún LLM.
3. **No migrar `@xyflow/react` a tldraw.** Ya descartado en el backlog v3 con motivo, y el barrido
   lo confirma. Lo que se roba de tldraw son **patrones** (servidor autoritativo, separación
   documento/sesión, selector de nodo desde el puerto), no la dependencia.
4. **No ofrecer un «autonomy slider» con posición Autopilot, ni streaming de razonamiento.** Sería
   mentir sobre la arquitectura: el builder no controla esa latencia y no escribe sin ti. Vale más
   un indicador fijo —«el builder nunca escribe sin ti»— que un control desactivado.
5. **No eliminar el fallback copy-first de la cola.** Es diseño deliberado con decisión registrada
   (2026-08-12) y lo exige la spec 031 R6. Lo que se arregla es la incoherencia de la presencia
   (C.5), no el mecanismo.
6. **No añadir una checklist de onboarding en la sidebar.** Ver la lección de Storybook en el
   bloque D. El estado de arranque debe derivarse del disco.
7. **No añadir telemetría remota**, ni siquiera opt-out anónima. «Todo se queda en tu máquina» es
   el activo. Si algún día quieres datos de producto, la única forma coherente es un fichero de
   eventos local en el sidecar que el propio builder muestre y el usuario pueda borrar, con la
   lista de lo que **no** se registra publicada, como hace Turborepo.
8. **No escribir un merge driver propio para `.canvas`.** Mientras exista mergiraf (que ya entiende
   JSON) y mientras A.4 no esté hecho, es la definición de sobre-ingeniería: mantener un binario
   de merge para un problema que se reduce ordenando claves. Enviar un `.gitattributes` recomendado
   con el sidecar y documentar el mapeo.
9. **No construir historial de versiones propio dentro del builder.** Git ya es el historial. Lo
   que falta es *renderizarlo* (línea de tiempo de la spec con su diff), no duplicarlo.
10. **No copiar el clustering semántico ni los resúmenes automáticos de Miro/FigJam/Whimsical.**
    Exige un modelo dentro del producto —justo lo que la arquitectura descarta— y es el terreno
    donde esos tres ya son indistinguibles entre sí. Competir ahí es competir sin su presupuesto.
11. **No hacer auto-layout automático al abrir.** El layout vive en `board.canvas`: un reordenado
    automático es destructivo. Si se hace, comando explícito, animado y deshacible con un undo.

---

## Correcciones al barrido (para quien lo reuse)

Tres citas del barrido no sobrevivieron a la comprobación y **no deben reutilizarse**:

- **`docdecay`** existe en PyPI pero **no** compara commits de documentación contra los de los
  ficheros enlazados: es un detector de antigüedad por umbral, última release en junio de 2020.
  La regla de deriva por timestamp sigue siendo buena — pero ya la implementa la spec 025, no hace
  falta citar a nadie.
- **arXiv 2606.27045** existe y se titula «The Spec Growth Engine: Spec-Anchored, Code-Coupled,
  Drift-Enforced Architecture for AI-Assisted Software Development», enviado el **25 de junio de
  2026** (no el 24 de agosto). Su abstract habla de spec graph legible por máquina, context
  assembler y drift gate; el par «grafo de intención / grafo de evidencia» **no** aparece ahí.
- **`spec-board`**: la comparación de stack está verificada (Next.js 16, React Flow, PostgreSQL,
  Prisma, MCP, Zustand); el recuento de herramientas MCP y de estrellas que circulaba, no.
