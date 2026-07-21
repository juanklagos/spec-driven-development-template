# 🎨 SDD Builder: construye tus specs visualmente

El SDD Builder es un lienzo drag-and-drop donde compones tu flujo SDD como tarjetas conectadas — y cada tarjeta es un bundle **real** `specs/NNN-slug/` en disco. Tu markdown sigue siendo la fuente de verdad; el lienzo solo guarda posiciones en `specs/board.canvas` (formato abierto JSON Canvas).

## Inicio rápido

```bash
# una sola vez: compila el frontend
npm run builder:build

# crea un workspace de juego (o usa cualquier proyecto con sidecar spec/)
./scripts/install-spec-sidecar.sh ~/sdd-playground --profile=recommended

# arranca el servidor apuntando a tu workspace
SDD_PROJECT_ROOT=~/sdd-playground npm run mcp:http:start
# abre http://127.0.0.1:3334/builder
```

Nota: dentro de este repositorio template el builder está bloqueado por diseño (no se ejecuta trabajo de proyecto destino en la raíz del template). Apunta siempre `SDD_PROJECT_ROOT` a un workspace real.

## Qué puedes hacer

| En el lienzo | Qué pasa en disco |
| :--- | :--- |
| Arrastra una tarjeta **Spec** de la paleta y ponle nombre | Se crea un bundle real `specs/NNN-slug/` (spec, plan, tasks, history) |
| Clic en una tarjeta de spec | Drawer con sus tareas como checkboxes; extracto de spec.md en solo lectura |
| Marca un checkbox de tarea | La línea `- [ ]` de `tasks.md` pasa a `- [x]` quirúrgicamente |
| Conecta dos tarjetas, doble clic en la línea | Dependencia con etiqueta guardada en `board.canvas` |
| Añade tarjetas 💡 Idea / 📦 Épica | Notas libres (con color) en `board.canvas` |
| Mueve tarjetas | Posiciones guardadas (con debounce) — nunca toca tus .md |

## Desde un agente IA (MCP)

Cualquier cliente MCP conectado a `sdd-mcp` puede trabajar con el mismo board mediante cinco tools — `sdd_board_read`, `sdd_board_write`, `sdd_board_connect`, `sdd_read_tasks`, `sdd_set_task_done` — respaldadas por la misma capa `sdd-core` que el lienzo, así que lo que tu agente escribe es lo que ves en `/builder` (y viceversa). Ver guía 41 (referencia completa de MCP).

## El board dentro de tu cliente IA (MCP App)

El servidor también entrega el board como **MCP App** (SEP-1865, la primera extensión oficial de MCP — parte de la release del protocolo 2026-07-28, construida con el SDK oficial `@modelcontextprotocol/ext-apps`). En un cliente con soporte de MCP Apps, pide a tu agente que muestre el board — invoca la tool `sdd_board_app` y la vista se renderiza **dentro del chat**: tarjetas de specs con estado de aprobación y progreso de tareas, el lienzo con sus uniones tipadas, el semáforo del gate y los avisos de dependencias, más un botón «↻ Actualizar / Refresh» que relee el workspace. Solo lectura en v1, bilingüe, con modo claro/oscuro.

Estado del estándar (honesto): la spec MCP 2026-07-28 es una **release candidate congelada desde el 2026-05-21** con publicación final el 2026-07-28; la extensión Apps tiene una revisión estable (2026-01-26) y un SDK publicado, así que esta vista está construida sobre la superficie estable. Notas:

- Funciona en hosts que implementan MCP Apps; el soporte se está desplegando en los clientes durante la ventana de finalización.
- Los hosts **sin** MCP Apps degradan con gracia: `sdd_board_app` devuelve los mismos datos de board + gate como texto JSON.
- La vista es totalmente autocontenida (sin CDNs): el bridge oficial de ext-apps va inline dentro del recurso `ui://sdd/board.html`.

## Sincronización en vivo

El servidor vigila tu directorio `specs/`. Edita cualquier `tasks.md` en tu editor y la barra de progreso de la tarjeta se actualiza sola — sin recargar. La barra superior muestra **🟢 En vivo**; si el servidor se reinicia con otro workspace, un banner ámbar te pide recargar. Regla de concurrencia: tu markdown siempre gana; el layout del lienzo es "último escritor gana" (una fase futura añade merge más fino).

## Novedades de la v2 (spec 007)

- **Semáforo del gate**: chip vivo en la barra superior (🟢 abierto / 🔴 cerrado) más un botón «Validar ahora» que ejecuta la validación real; los errores del gate aparecen como badge rojo `⚠ N` con tooltip sobre la tarjeta afectada.
- **Aprobar desde el panel**: un clic confirmado escribe el bloque de aprobación real (estado, fecha de hoy, aprobador, evidencia) en `spec.md` — con error claro si el bloque no existe.
- **Tour de bienvenida**: cinco pasos anclados (paleta → crear → conectar → tareas → gate), descartable con «No mostrar de nuevo» y relanzable desde el botón «?».
- **Galería de plantillas**: los playbooks App web, API/Backend, E-commerce y SaaS crean specs reales más un tablero conectado y ordenado. Solo en un workspace con cero specs.
- **Editor guiado de spec**: la pestaña «Editar» del panel escribe la historia de usuario, los escenarios, los criterios EARS (prefijo autocompletado al enfocar) y el fuera de alcance de forma quirúrgica — la aprobación y los requisitos nunca se tocan.
- **Deshacer/rehacer + export PNG**: historial del lienzo (Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z) y un botón «📷 PNG» para compartir el tablero como imagen.

Los agentes tienen los mismos tres poderes por MCP: `sdd_gate_summary`, `sdd_approve_spec`, `sdd_update_spec_sections`.

## Novedades de la v3 (spec 008) — IA sin API keys

El builder nunca llama a un LLM por su cuenta (no hay keys que configurar). Las heurísticas locales cubren lo rápido; lo que necesita inteligencia real se delega a **tu** agente con prompts copiables y las tools MCP.

- **✨ Asistente — «Descríbeme tu proyecto»**: un wizard en la barra superior toma una frase (p. ej. *«una tienda online de plantas con pagos y panel de administración»*) y propone un borrador de board — una nota de idea, 2-4 épicas y 3-6 specs agrupadas por dominios detectados (auth, pagos, catálogo, admin, API, notificaciones, perfil, búsqueda; fallback MVP genérico). El borrador se previsualiza y edita (renombrar/quitar specs, «Regenerar» para nombres alternativos) y **nada toca el disco** hasta pulsar «Crear en el board» — entonces ejecuta las mismas llamadas reales que la galería de plantillas (un `POST /api/spec` por spec + el lienzo pre-ordenado). Solo en workspaces vacíos.
- **🤖 Implementar con agente**: en el drawer de una spec **aprobada**, un botón precarga el prompt exacto de arranque de implementación (ruta del workspace, carpeta de la spec, ejecutar la compuerta SDD, registrar consentimiento, hard stop, marcar tareas, cerrar con el contrato de sesión) con un botón «Copiar prompt». Copy-first por diseño — sin deep links frágiles; funciona con Claude Code, Codex, Cursor, lo que sea. En una spec no aprobada el botón está deshabilitado con el hard stop: *no hay código sin spec aprobada y plan consistente*.
- **Lint EARS en vivo**: al escribir criterios de aceptación en el editor guiado, cada fila recibe un borde verde (con forma EARS) o ámbar (sugerencia) con una pista corta bilingüe — el esqueleto `CUANDO/SI/MIENTRAS … EL SISTEMA DEBERÁ …` y las palabras vagas sin número medible (*rápido, fácil, intuitivo…*). Solo consultivo: nunca bloquea el guardado. La misma regla está exportada para agentes como `validateEarsCriterion` en `sdd-core`.

### El prompt orquestador (IA real vía MCP)

La sección «¿Tienes un agente IA?» del asistente ofrece este prompt (cópialo también desde aquí). Pégalo en cualquier agente conectado a `sdd-mcp` y construirá el board con inteligencia real — incluidas las secciones borrador dentro de cada spec:

```text
Eres mi agente SDD conectado al MCP `sdd-mcp`. Mi proyecto: "<describe tu proyecto>".
Objetivo: puebla el SDD Builder board como el asistente ✨, pero con inteligencia real.
1. Lee el estado actual con `sdd_board_read` (projectRoot: <ruta del workspace>).
2. Propón 2-4 épicas y 3-6 specs con nombres claros, en minúsculas y sin acentos; enséñame la propuesta y espera mi OK antes de escribir nada.
3. Con mi OK: crea cada spec real con `sdd_create_spec`; rellena su borrador con `sdd_update_spec_sections` (historia de usuario, escenarios, criterios EARS «CUANDO … EL SISTEMA DEBERÁ …», fuera de alcance); dibuja el board con `sdd_board_write` + `sdd_board_connect` (nota de idea → épicas → specs, edges etiquetados).
4. No implementes código: el gate SDD sigue cerrado hasta que yo apruebe las specs.
```

## Novedades de la v4 (spec 009) — equipos

Cuatro funciones para que un equipo pequeño coordine trabajo real sobre las mismas specs:

- **Vista Kanban**: el toggle «🗺️ Lienzo ↔ 📋 Tablero» de la barra superior muestra las mismas specs en tres columnas según el estado real de tus .md — **Borrador · Pendiente**, **Aprobada** (la línea `Estado / Status` del `spec.md`) y **Hecha** (todas las tareas marcadas). Las tarjetas conservan su barra de progreso y abren el mismo panel. v1 honesta: arrastrar una tarjeta a otra columna *no cambia nada* en disco — aprobar es un acto real sobre la spec, así que al soltar aparece un toast («La aprobación se hace en la spec») con un botón «Abrir spec» hacia el flujo de aprobación del panel.
- **Uniones tipadas + avisos de dependencias**: haz doble clic en una unión y elige su tipo — *relacionada* (por defecto), *depende de* (ámbar), *bloquea* (rojo) o cualquier etiqueta libre como antes. El tipo viaja en el campo `label` de `board.canvas` (las grafías ES y EN son canónicas) más un `color` estándar de JSON Canvas. Cuando una unión tipada conecta dos specs reales y la **spec dependiente está aprobada pero su dependencia no**, el builder avisa: chip ámbar `⚠ N dep` junto al semáforo del gate (con la lista completa en el tooltip) y badge ámbar `⚠ dep` en la tarjeta dependiente, en ambas vistas. Solo consultivo — el gate nunca se cierra por esto. Los agentes ven la misma lista en el campo `dependencyWarnings` de `sdd_gate_summary` y de `GET /api/gate`.
- **Tareas → issues de GitHub**: en el panel, «🐙 Crear issues» crea un issue de GitHub por cada tarea **pendiente** vía tu `gh` CLI local — título `[<specId>] <tarea>` para trazabilidad, cuerpo con enlace al `tasks.md` del bundle. Idempotente por título: las tareas cuyo título exacto ya existe se saltan, y el resultado se informa por tarea (creada / saltada / fallida) con enlaces. Degrada con honestidad: sin repo git, sin remote o sin `gh` autenticado recibes un error bilingüe claro que te dice exactamente qué ejecutar.
- **Presencia**: cuando más de una persona (o agente) tiene el builder abierto sobre el mismo workspace, la barra superior muestra **👥 N** («N personas viendo este workspace») — con el mismo hub SSE de la sincronización en vivo, incluidas entradas y salidas.

## Limitaciones (honestas)

- El contenido largo de `spec.md` más allá de las secciones guiadas se edita en tu editor, no en el lienzo (por diseño: el lienzo compone, tu editor escribe).
- Borrar una carpeta de spec en disco no retira su tarjeta automáticamente (conservador; borra la tarjeta a mano).
- Un workspace por instancia del servidor (`SDD_PROJECT_ROOT`).
- La Kanban v1 es una proyección de solo lectura del estado: mover tarjetas entre columnas nunca aprueba ni desaprueba nada (usa el panel). La idempotencia de issues es por título (renombrar una tarea crea un issue nuevo).

## Roadmap

- ✅ Vista MCP App (el board dentro de tu cliente IA) — entregada; ver la sección de arriba. A revisar tras el 2026-07-28: confirmar que el texto final de la spec mantiene `_meta.ui.resourceUri` + `text/html;profile=mcp-app` tal cual y subir `@modelcontextprotocol/ext-apps` si sale una versión final.
- Demo interactiva en el sitio (Pages) — pendiente (requiere la FS Access API solo-Chrome); ver `specs/006-visual-spec-builder/`.
