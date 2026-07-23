# Especificación 023 - desk-electron

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-23`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-22 — tras la evaluación que mostró la decisión vigente en contra y sus fases previas sin completar, el propietario respondió "aprobada y hazle con todo nivel senior con solid". Decisión en bitacora/decisiones/2026-07-22-app-escritorio-electron.md

## Historia de usuario principal

Como persona que usa el SDD Builder a diario, quiero **una aplicación de escritorio con su propio ícono y su propia ventana** que abra el lienzo sobre mi proyecto, sin terminal viva de por medio y sin tener Node instalado, y que además **sea el servidor MCP** al que apuntan mis agentes, para dejar de tratar una herramienta que uso todos los días como si fuera un script.

## Escenarios de aceptación

1. Dado un equipo **sin Node instalado**, cuando la persona instala SDD Desk y hace doble clic, entonces se abre una ventana con el builder funcionando, porque Electron trae su propio runtime.
2. Dado el primer arranque sin proyecto configurado, cuando se abre la app, entonces aparece un selector de carpeta nativo que ofrece abrir un workspace SDD existente o crear uno nuevo con el sidecar, y la elección se recuerda entre sesiones.
3. Dado que el puerto por defecto está ocupado por otro proceso, cuando arranca la app, entonces usa otro puerto libre sin fallar ni pedir nada.
4. Dado un builder abierto sobre el proyecto A, cuando la persona elige "Abrir otro proyecto" y selecciona B, entonces la ventana muestra B sin reiniciar la aplicación.
5. Dado que la app está abierta, cuando la persona quiere conectar su agente, entonces la app le muestra la URL MCP efectiva y el fragmento de configuración listo para copiar, apuntando al mismo servidor que ya está corriendo sobre el mismo workspace.
6. Dado un agente conectado a esa URL MCP, cuando el agente crea o aprueba una spec, entonces la ventana lo refleja sola, sin recargar (SSE).
7. ~~Dado macOS con Gatekeeper activo, cuando se abre el `.dmg` descargado, entonces la app arranca sin el diálogo de "desarrollador no identificado", porque está firmada y notarizada.~~ **Retirado el 2026-07-23** — ver `bitacora/decisiones/2026-07-23-no-firmar-la-app-de-escritorio.md`. En su lugar: dado macOS con Gatekeeper activo, cuando se abre la app por primera vez, entonces la página de descarga DEBERÁ decir de antemano que hará falta autorizarla y cómo, en la versión de macOS que corre la persona.
8. Dado que ya existe una versión más nueva publicada, cuando la app arranca, entonces avisa y ofrece actualizarse, sin obligar.
9. Dado quien prefiere la ruta actual, cuando ejecuta `npx @juanklagos/sdd-mcp --http`, entonces todo sigue funcionando exactamente igual (cero regresión).

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se empaquete SDD Desk, EL SISTEMA DEBERÁ incluir el frontend del builder ya compilado y el servidor SDD, y NO DEBERÁ requerir Node instalado en la máquina destino.
- CUANDO la ventana cargue el builder, EL SISTEMA DEBERÁ hacerlo desde `http://127.0.0.1:<puerto>/builder` y NUNCA desde `file://`.
- SI el origen de la ventana fuera `file://`, ENTONCES EL SISTEMA DEBERÁ fallar de forma visible en desarrollo, porque `security.ts` rechaza el origen `"null"` en toda petición que modifica estado y la app quedaría en solo lectura silenciosa.
- CUANDO el puerto solicitado esté ocupado, EL SISTEMA DEBERÁ elegir el siguiente puerto libre y continuar.
- CUANDO la app esté corriendo, EL SISTEMA DEBERÁ exponer el endpoint MCP del mismo servidor y DEBERÁ mostrar su URL efectiva y un fragmento de configuración copiable.
- CUANDO la persona cambie de workspace, EL SISTEMA DEBERÁ reiniciar el servidor HTTP contra la nueva raíz sin reiniciar el proceso de Electron, y la URL MCP DEBERÁ seguir sirviendo el nuevo workspace.
- EL SISTEMA DEBERÁ enlazar siempre a loopback, y NO DEBERÁ exponer un puerto accesible desde la red.
- EL SISTEMA DEBERÁ deshabilitar `nodeIntegration` y mantener `contextIsolation` activo en el renderer.
- CUANDO el renderer intente navegar a un origen que no sea el servidor local, EL SISTEMA DEBERÁ bloquear la navegación y abrir el enlace en el navegador del sistema.
- EL SISTEMA DEBERÁ reutilizar `builder/dist` sin modificar el código del builder: el escritorio es un contenedor, no una segunda interfaz que mantener.
- EL SISTEMA DEBERÁ ser bilingüe (un idioma a la vez), en menús nativos y en los diálogos.

## Requisitos

- R1. **Extraer una factoría del servidor.** Hoy `packages/sdd-mcp/src/http.ts:21-23,81` lee puerto y raíz en el ámbito del módulo y llama `server.listen` como efecto de importación, así que importarlo arranca un servidor que ya no se puede reconfigurar. Extraer `createSddHttpServer({ projectRoot, port, host })` que devuelva el servidor, el puerto efectivo y un `close()`; `http.ts` queda como el guion delgado que la invoca. `createApiHandler` y `createEventHub` ya son factorías: el cambio se limita a `http.ts`.
- R2. **Fallback de puerto** en esa factoría, devolviendo el puerto efectivo. Es el mismo requisito que `011` R2 — se implementa una vez y sirve a ambos.
- R3. **Carpeta `desk/` hermana de `builder/`**, con su propio `package.json`, su `tsconfig.json` y sus scripts (`dev`, `build`, `dist`), igual que `builder/` es hoy un proyecto autónomo. El main de Electron arranca el servidor **en proceso** (el main de Electron es Node: no hay sidecar ni binario externo que firmar por separado) y abre una `BrowserWindow` en la URL local efectiva.
- R4. **Selector de workspace nativo** (`dialog.showOpenDialog`), persistido entre sesiones, con opción de crear uno nuevo instalando el sidecar. Cambiar de workspace reinicia el servidor vía R1.
- R5. **Panel de conexión MCP**: la app muestra `http://127.0.0.1:<puerto>/mcp`, el workspace activo, y un fragmento de configuración copiable para agentes. El endpoint no se implementa aquí — ya existe en `http.ts:72-77` vía `transport.ts`; lo que R5 añade es hacerlo visible y copiable en vez de que haya que adivinarlo.
- R6. **Endurecimiento del renderer**: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, sin preload que exponga Node, `setWindowOpenHandler` y `will-navigate` que manden todo lo externo a `shell.openExternal`.
- R7. **Menús nativos bilingües** y atajos: abrir proyecto, recargar, alternar idioma, copiar la URL MCP, abrir el proyecto en el Finder/Explorador, salir.
- R8. **Empaquetado**: `electron-builder` para macOS (`.dmg` arm64 y x64), Windows (`.exe` NSIS) y Linux (`AppImage`, `.deb`). Flathub sigue prohibiendo código asistido por IA desde 2026-05-29. **Firma, alcance revisado el 2026-07-23:** macOS queda **fuera de alcance** — Apple cobra 99 USD/año sin excepción para código abierto y el proyecto decidió no atarse a esa cuota; el bundle se firma **ad-hoc**, que es lo que evita el error "está dañado" en Apple Silicon pero no quita el aviso de notarización. Windows queda pendiente por la vía gratuita de SignPath Foundation, que MIT habilita. Decisión en `bitacora/decisiones/2026-07-23-no-firmar-la-app-de-escritorio.md`.
- R9. **Auto-actualización** con `electron-updater` contra GitHub Releases, con aviso y sin instalación forzada.
- R10. **CI**: build de las tres plataformas en GitHub Actions, con los secretos de firma, disparado por tag.
- R11. **Documentación** EN/ES: cómo instalar, qué hace y qué no, cómo conectar un agente al MCP de la app, y cuál es la diferencia con `npx @juanklagos/sdd-mcp --http`.

## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)

- Para todo workspace válido, el board que muestra el escritorio DEBERÁ ser idéntico al que muestra el mismo builder en el navegador sobre el mismo `projectRoot`.
- Para toda petición que modifique estado emitida por la ventana, el guard de `security.ts` DEBERÁ aceptarla (origen loopback), y DEBERÁ rechazarla si la ventana se cargara desde `file://`.
- Para todo cambio hecho por un agente vía el endpoint MCP de la app, la ventana DEBERÁ reflejarlo sin recarga manual.

## Ámbito de archivos / File scope

- `desk/` — el shell de Electron (nuevo, hermano de `builder/`)
- `packages/sdd-mcp/src/http.ts` — extracción de la factoría (R1, R2)
- `.github/workflows/` — build y firma (R10)
- `docs/es/`, `docs/en/` — guía de instalación y conexión MCP (R11)

## Fuera de alcance / Out of scope

- Reescribir o duplicar la interfaz del builder. `desk` carga `builder/dist` tal cual.
- Reimplementar el servidor MCP o el API REST: `desk` los hospeda, no los reescribe.
- Modo offline sin servidor local, o un builder que hable con el disco directamente desde el renderer.
- Sincronización en la nube, cuentas o multi-tenancy: la arquitectura sigue siendo local-first.
- Distribución en Mac App Store, Microsoft Store o Flathub.
- Sustituir `npx @juanklagos/sdd-mcp --http` ni el `.mcpb`: el escritorio es un canal más, no un reemplazo.

## Criterios de éxito

- En una máquina limpia **sin Node**, instalar y abrir el builder sobre un proyecto real: menos de un minuto, cero terminal.
- Paridad verificada: el mismo proyecto abierto en `desk` y en el navegador muestra el mismo board, el mismo gate y las mismas tareas.
- Un agente externo conectado a la URL MCP que muestra la app opera sobre el workspace activo, y la ventana refleja sus cambios sin recargar.
- `npm run build`, `npm run typecheck`, `npm run mcp:test` y los tres scripts SDD en verde tras el refactor de R1 — el refactor toca el camino que usa todo el mundo, así que la ausencia de regresión es parte del éxito, no un extra.
- Un `.dmg` firmado y notarizado que abre sin diálogo de Gatekeeper en un Mac que nunca vio el proyecto.
