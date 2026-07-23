# Investigación 023 - SDD Desk (Electron)

## Hallazgos

### Del código de este repo (verificados leyendo los archivos, 2026-07-22)

1. **El builder ya es portable a Electron sin cambios.** `builder/src/api.ts` usa `fetch`
   contra rutas relativas y `builder/src/live.ts` usa `EventSource` contra `/api/events`.
   No hay una sola referencia a `fs`, `process` o `electron`. El contenedor puede cargarlo
   verbatim.
2. **Dos de las tres piezas del servidor ya son factorías.** `createApiHandler`
   (`packages/sdd-mcp/src/api.ts:31`) y `createEventHub` (`events.ts:23`) reciben
   `projectRoot` como parámetro. No requieren cambio alguno.
3. **`http.ts` es la única pieza no reutilizable.** Lee `port`/`host`/`projectRoot` en el
   ámbito del módulo (`:21-23`) y llama `server.listen` como efecto de importación (`:81`).
   Importarlo desde el main de Electron arrancaría un servidor fijo que no se puede
   reconfigurar al cambiar de workspace. De aquí sale R1, y es un refactor de un archivo.
4. **El guard de origen decide cómo debe cargar la ventana.** `security.ts:81-93`:
   `isAllowedOrigin` acepta cualquier hostname loopback, y un origen que no parsea —
   incluido el literal `"null"` que envían las páginas `file://` — se rechaza. Como el
   guard solo corre en métodos mutantes (`isMutatingMethod`), una ventana `file://` leería
   perfectamente y fallaría en toda escritura. Es un modo de fallo que aparenta funcionar,
   así que sube a criterio de aceptación en vez de quedarse en nota de implementación.
5. **El endpoint MCP viene gratis.** `http.ts:72-77` ya enruta `/mcp` a `transport.ts`
   (Streamable HTTP con sesiones). Si el escritorio hospeda ese servidor, la app *es* el
   servidor MCP del workspace abierto. R5 solo hace visible y copiable una URL que hoy hay
   que adivinar.
6. **El frontend ya viaja empaquetado.** `static.ts` resuelve `builder/dist` desde el
   checkout y, si no, desde `dist/builder-ui` dentro del paquete npm — el trabajo de
   `011` T1, verificado en el tarball publicado 2.2.1 durante el spike del `.mcpb`.

### Del expediente del proyecto

7. **Existe una decisión vigente en contra**, `bitacora/decisiones/2026-07-21-no-app-escritorio.md`,
   que difiere Electron detrás de (1) el lanzador de un comando y (2) un `.mcpb`. Al
   redactar esta spec, la fase 1 tenía 1 de 8 tareas hechas y la fase 2 no estaba
   resuelta. Esta spec **no** se apoya en que esas condiciones se cumplieran: se apoya en
   una decisión explícita del propietario tomada con esa evaluación a la vista.
8. **Un bloqueador de aquella decisión caducó.** Decía que PolyForm Noncommercial, al no
   estar aprobada por OSI, cerraba la firma de código gratuita de SignPath Foundation. El
   mismo día, `2026-07-21-relicencia-mit.md` relicenció el proyecto a MIT, que sí está
   aprobada por OSI. La vía de firma gratuita para Windows vuelve a estar sobre la mesa —
   **pendiente de verificar contra los términos actuales de SignPath**, no dado por hecho.
9. **Los demás bloqueadores siguen en pie**: Apple $99/año, la prohibición de Flathub a
   código asistido por IA (2026-05-29), la cadencia de majors de Electron cada 8 semanas,
   y el mantenimiento estimado en ~150-300 h/año.
10. **El spike del `.mcpb` quedó verde a nivel de protocolo pero sin veredicto de host.**
    El bundle empaqueta, instala y responde 8/8 comprobaciones por stdio
    (`scripts/probe-mcpb-stdio.mjs`); lo que no se comprobó es si el host pinta el iframe
    de `ui://sdd/board.html`. Es relevante para 023 porque el `.mcpb` y el escritorio
    resuelven el mismo problema — el prerrequisito de Node — por caminos distintos.

## Decisiones derivadas de los hallazgos

- **Electron, no Tauri** (hallazgo 1-3): el main de Electron es Node, así que el servidor
  corre en proceso. Tauri exigiría Node como sidecar (~115 MiB solo el binario, frente a
  ~116 MB de todo Electron) más Rust como segundo stack, y `opencode` ya recorrió ese
  camino y volvió. La ventaja de tamaño no existe para esta forma de producto.
- **`desk/` es contenedor, no interfaz** (hallazgo 1): carga `builder/dist` tal cual. Una
  segunda interfaz sería una segunda superficie que mantener y desincronizar.
- **Refactor de `http.ts` primero, y verificado antes de tocar Electron** (hallazgo 3):
  es el único cambio en código que ya usa todo el mundo, así que es donde vive el riesgo
  de regresión. Hito bloqueante H1.
- **La ventana carga por `http://127.0.0.1`, nunca `file://`** (hallazgo 4), y con
  verificación explícita de que una escritura llega al disco.
- **El panel de conexión MCP entra en el alcance mínimo** (hallazgo 5): el costo es una
  vista, y convierte la app de visor en el servidor MCP del workspace.
- **La firma se planifica, no se asume** (hallazgo 8): la vía gratuita de Windows se
  verifica contra los términos de SignPath antes de depender de ella; el `.dmg` notarizado
  requiere la cuenta de Apple y sin ella el escenario 7 no se cumple.
