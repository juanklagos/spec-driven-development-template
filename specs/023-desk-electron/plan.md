# Plan 023 - SDD Desk (Electron)

## Resumen

`desk/` es un **contenedor**, no una segunda interfaz. La aplicación no reimplementa nada:
hospeda en su proceso principal el mismo servidor HTTP que ya sirve `/builder`, `/api/*`,
`/api/events` y `/mcp`, y abre una ventana sobre la URL local que ese servidor devuelve.
Todo el trabajo real de SDD sigue viviendo en `@juanklagos/sdd-core`.

El único cambio en código existente es un refactor pequeño y aislado: convertir `http.ts`
de guion con efectos de importación a factoría. Ese refactor lo pedía ya la spec `011`.

## Contexto técnico

Lo que hace esto barato, verificado leyendo el código:

- `builder/src/api.ts` y `builder/src/live.ts` hablan **solo** por `fetch` y `EventSource`
  contra rutas relativas. El builder no toca `fs` ni `process`: corre dentro de Electron sin
  una línea de cambio. Por eso `desk` puede reutilizar `builder/dist` verbatim.
- `packages/sdd-mcp/src/api.ts:31` (`createApiHandler`) y `events.ts:23` (`createEventHub`)
  **ya son factorías** parametrizadas por `projectRoot`. No hay que tocarlas.
- `packages/sdd-mcp/src/http.ts:21-23` lee `port`, `host` y `projectRoot` en el ámbito del
  módulo, y `:81` llama `server.listen` como efecto de importación. Esa es la única pieza
  que impide hospedar el servidor desde otro proceso y reconfigurarlo: importarlo arranca
  un servidor fijo. De ahí R1.
- `packages/sdd-mcp/src/security.ts:81-93` acepta cualquier origen loopback en las
  peticiones que modifican estado, y **rechaza explícitamente el origen `"null"`** que
  envían las páginas `file://`. Traducción operativa: la ventana debe cargar
  `http://127.0.0.1:<puerto>/builder`. Cargar el HTML desde disco produciría una app que
  lee bien y falla en toda escritura — el peor modo de fallo posible, porque parece
  funcionar. Esto es un criterio de aceptación, no una nota al pie.
- `packages/sdd-mcp/src/http.ts:72-77` ya enruta `/mcp` vía `transport.ts`. El panel de
  conexión MCP (R5) es superficie de interfaz sobre algo que ya funciona, no protocolo nuevo.
- `packages/sdd-mcp/src/static.ts` resuelve `builder/dist` desde el checkout primero y
  desde el paquete después. `desk` empaqueta el segundo camino.

Por qué Electron y no Tauri, para que quede en el expediente y no se rediscuta:
el main de Electron **es Node**, así que el servidor corre en proceso. Tauri exigiría
enviar Node como sidecar (~115 MiB solo el binario, contra ~116 MB de todo Electron),
más Rust como segundo stack. Para esta forma de producto la ventaja de tamaño no existe.

## Fases de implementación

1. **Factoría del servidor (R1, R2).** Extraer `createSddHttpServer({ projectRoot, port, host })`
   que devuelva `{ server, port, url, close }`, con fallback de puerto. `http.ts` queda como
   el guion delgado que la llama y mantiene su salida por consola tal cual. Sin cambios de
   comportamiento observable para quien usa `npx @juanklagos/sdd-mcp --http`.
2. **Shell mínimo (R3, R6).** `desk/` con `package.json` propio, main de Electron que llama
   la factoría y abre la ventana en la URL efectiva, renderer endurecido. Objetivo de la
   fase: ver el builder en una ventana propia, funcionando contra un workspace fijo.
3. **Workspace (R4).** Selector nativo, persistencia entre sesiones, cambio en caliente
   cerrando y relevantando el servidor con la nueva raíz.
4. **Conexión MCP y menús (R5, R7).** Panel con la URL efectiva y el fragmento copiable;
   menús nativos bilingües.
5. **Empaquetado y firma (R8).** `electron-builder`, macOS notarizado, Windows firmado,
   Linux AppImage y `.deb`.
6. **Actualización y CI (R9, R10).** `electron-updater` contra GitHub Releases; workflow
   por tag con los secretos de firma.
7. **Documentación (R11)** y verificación end-to-end en una máquina sin Node.

Las fases 1-3 producen algo usable. Las fases 5-6 son las caras, y son las que se pueden
posponer sin perder el producto: un `desk` sin firmar sigue sirviendo para uso propio.

## Dependencias

- **Bloqueante:** la fase 1 comparte archivo con `011` R2 (fallback de puerto). Se
  implementa **una vez, aquí**, y `011` T2 se marca satisfecho por esta spec. Si se
  implementan por separado habrá conflicto en `http.ts`.
- `builder/dist` compilado — ya viaja en el paquete desde `011` T1.
- Cuenta de Apple Developer ($99/año) para notarizar. Sin ella, la fase 5 entrega macOS
  sin firmar y el escenario de aceptación 7 no se cumple.
- Certificado de firma para Windows. La relicencia a MIT (`2026-07-21-relicencia-mit.md`)
  reabre la firma OV gratuita de SignPath Foundation, que exige licencia aprobada por OSI
  y antes estaba cerrada — **por verificar contra sus términos actuales antes de contar
  con ello.**

## Hitos

- H1. `mcp:test` y los tres scripts SDD en verde tras el refactor de `http.ts`, **antes**
  de escribir una línea de Electron. El refactor toca el camino de todo el mundo.
- H2. Ventana propia mostrando el board de un workspace real.
- H3. Paridad verificada contra el mismo proyecto abierto en el navegador.
- H4. Un agente externo conectado a la URL MCP de la app, escribiendo, y la ventana
  reflejándolo sin recarga.
- H5. `.dmg` notarizado abriendo sin diálogo en un Mac limpio.

## Riesgos

- **El costo real no es construir, es mantener.** ~150-300 h/año en tres sistemas
  operativos, con la cola de soporte (Gatekeeper, SmartScreen, falsos positivos de
  antivirus) escalando con la adopción. Está documentado en
  `bitacora/decisiones/2026-07-21-no-app-escritorio.md` y no cambió; se acepta a
  sabiendas, no por desconocerlo.
- **Electron saca major cada 8 semanas y solo soporta las últimas 3 versiones**: se hereda
  el flujo de CVEs de Chromium/V8. Mitigación: Renovate sobre `desk/package.json` y una
  cadencia de actualización explícita.
- **Ser dueño de un canal de push de código a máquinas ajenas.** El auto-updater es
  exactamente eso; ver CVE-2025-27554 (ToDesktop, CVSS 9.9, afectó a Cursor y Linear).
  Mitigación: firmar los artefactos y no delegar el canal a un tercero.
- **Flathub cierra el Linux de mayor alcance** desde 2026-05-29 por su prohibición de
  código asistido por IA. Se acepta: AppImage y `.deb`.
- **Regresión silenciosa en el refactor de `http.ts`.** Es el riesgo más probable de todos
  porque toca lo que ya funciona. Mitigación: H1 es un hito bloqueante, no una revisión
  final.
- **Que la ventana termine cargando `file://`** por una optimización aparentemente
  inocente, produciendo una app que lee y no escribe. Mitigación: está como criterio de
  aceptación y debe tener una verificación explícita, no confianza.
