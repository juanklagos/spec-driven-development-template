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
