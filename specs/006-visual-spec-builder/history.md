# History 006 - visual-spec-builder

## 2026-07-20

- Spec creada tras investigación doble (existencia + stack). Autor eligió Opción B (ambiciosa) vía pregunta de alcance; consentimiento registrado.
- Plan por fases: MVP (1a-1d) → sync vivo → MCP App → demo/docs.

## 2026-07-20 (Fase 1a-1b completadas)

- `board.ts` en sdd-core y API REST en http.ts implementados y verificados end-to-end contra workspace sidecar real (board por defecto, uniones persistidas en board.canvas, toggle de tareas escrito en disco, creación de spec vía POST, guards de seguridad).
- Frontend (Fase 1c) delegado a agente con contrato de API exacto y verificación obligatoria.

## 2026-07-20 (Fase 1 completa)

- Frontend entregado y verificado por agente con evidencia real (screenshots, toggle escrito en disco, creación de spec end-to-end, merge automático de specs sin nodo, dark mode, estados de error).
- Bug de atomicidad de `createSpec` (hallado por el agente) corregido y verificado: sin bundle parcial ante fallo.
- Limitación conocida documentada: PUT de board completo — "el último escritor gana" en el canvas (los .md nunca se pisan); lo resuelve la Fase 2.

## 2026-07-20 (Fase 2 completa — sync en vivo)

- Backend: `GET /api/events` (SSE) en http.ts — `hello` con projectRoot al conectar, watcher `fs.watch` recursivo sobre `specs/` (helper `specsRoot()` nuevo en sdd-core/board.ts) que emite `change` con `{path, kind: board|specs}`, debounce 300 ms agrupando ráfagas, filtro de temporales `.tmp-<pid>` y dotfiles, keep-alive comment + evento `ping` observable cada 25 s, multi-cliente con limpieza, y reintento perezoso si `specs/` no existe (sin crash: verificado contra workspace vacío — hello llega y el server sigue vivo).
- Frontend: `live.ts` (EventSource con backoff 1→15 s y watchdog de 60 s sobre `ping` para conexiones zombis tras proxies), reconciliación en store: kind=specs re-fetch de board actualizando tarjetas/drawer sin tocar posiciones (y añade tarjetas de specs nuevas); kind=board aplica el canvas solo con guardado idle y sin drag (último escritor gana, documentado en código); guard anti-eco de 1 s tras PUT propio. Indicador "🟢 En vivo / 🌗 Sin conexión en vivo" en TopBar; banner ámbar "workspace cambió — recarga" cuando el hello trae otro root.
- UX: mensaje de error de API sugiere `SDD_PROJECT_ROOT=/ruta/a/tu/proyecto npm run mcp:http:start`; tooltip del TopBar muestra el workspace completo.
- Verificado de verdad (sandbox sidecar en tmp con 2 specs): curl a /api/events recibió hello + change kind=specs (sed en tasks.md) + kind=board (PUT board, .tmp filtrado); en navegador la tarjeta pasó 0/3→2/3→3/3 y el drawer refrescó checkboxes sin recargar (screenshots); banner ámbar apareció tras reiniciar el server con otro SDD_PROJECT_ROOT. Build + typecheck raíz y builder en verde; 3 scripts SDD en verde.
- Nota honesta: el estado "🌗 Sin conexión en vivo" no se observó visualmente porque el túnel del navegador de prueba enmascara el cierre TCP (por eso existe el watchdog, que sí se ejercitó: la reconexión que mostró el banner vino de él); la supresión de eco se verifica por código e indirectamente (sin bucles de re-render observados).

## 2026-07-20 (revisión de coherencia y SOLID a pedido del autor)

- **Coherencia MCP (el hallazgo principal)**: el board solo existía como API REST; un agente conectado por MCP no podía verlo ni tocarlo. Se añadieron 5 tools en `server.ts` con el patrón existente (naming `sdd_*`, schemas zod, `structuredContent` + texto JSON): `sdd_board_read`, `sdd_board_write`, `sdd_board_connect`, `sdd_read_tasks`, `sdd_set_task_done`.
- **Capa compartida en sdd-core**: la lógica compuesta que vivía en el handler HTTP (canvas + specs + conteo de tareas; leer→toggle→escribir→releer) se movió a `board.ts` como `getBoardView`, `readSpecTasks`, `setSpecTaskDone` y `connectBoardCards` (idempotente). REST y MCP consumen exactamente las mismas funciones: cero lógica duplicada entre transportes.
- **SOLID en http.ts**: el monolito (~476 líneas) se dividió en módulos cohesivos — `workspace.ts` (resolución de proyecto), `events.ts` (hub SSE + watcher, ahora factory con `dispose()`), `dashboard.ts`, `api.ts` (handler REST como factory con dependencias explícitas), `static.ts` (estáticos /builder), `transport.ts` (sesiones MCP Streamable HTTP), `http-utils.ts` (json/readBody) — con `http.ts` como composición fina (~70 líneas). Mismas rutas, mismos formatos, mismos códigos de estado (smoke verificado).
- **Ciclo de imports en sdd-core**: `board.ts` importaba de `index.js`, que a su vez reexporta `board.js` (funcionaba solo por hoisting). Se extrajo lo compartido (`resolveSddRoot`, `listSpecs`, `getFrameworkRoot`, `ensureProjectRootAllowed` + helpers fs) a un módulo interno `workspace.ts`; `index.ts` reexporta la superficie pública. También se eliminaron artefactos compilados obsoletos versionados por error en `src/` (`index.js`, `index.js.map`, `index.d.ts` de la era v1.0).
- **Coherencia de docs/comandos**: guía 42 EN/ES ahora documenta `site/`, `builder/` y `skills/` (faltaban las tres); guía 41 EN/ES documenta las 5 tools nuevas; guía 51 EN/ES y `skills/sdd-workflow/SKILL.md` mencionan el board por MCP; `/sdd:help`, `/sdd:new` y `/sdd:tutor` mencionan el builder como alternativa visual (una línea bilingüe cada uno).
- **Verificado de verdad**: build + typecheck monorepo en verde; `npm run mcp:test` extendido con las 5 tools del board (nodo y conteos verificados, toggle escrito a disco, edge persistida en board.canvas) en verde; 3 scripts SDD en 0 errores; smoke REST contra sandbox sidecar (GET/PUT board, detalle, PUT tasks escrito a disco, SSE hello, dashboard, /builder 200, 404 de ruta desconocida); build del builder en verde.

## 2026-07-20 (decisión Fase 3 + Fase 4)

- Fase 2 verificada y en main. Decisión senior aprobada por el autor ("hazlo continua, nivel senior"): posponer la Fase 3 (MCP App) hasta después del 2026-07-28 (publicación de la spec MCP final) para no construir sobre un estándar en movimiento; ejecutar ahora la Fase 4 (guía 51 + release v1.6.0). La demo interactiva en Pages queda como mejora futura (requiere FS Access API solo-Chrome); la guía 51 con el flujo completo cubre la documentación de usuario.
