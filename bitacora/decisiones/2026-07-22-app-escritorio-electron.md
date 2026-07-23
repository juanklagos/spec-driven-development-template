# Decisión clave - Construir SDD Desk en Electron / Key decision - Build SDD Desk on Electron

## Date / Fecha

2026-07-22

Modifica —no supersede— [`2026-07-21-no-app-escritorio.md`](2026-07-21-no-app-escritorio.md):
aquella decisión difería Electron, y esta lo activa. Todo lo que aquella documentó sobre
costos y bloqueadores sigue siendo cierto y sigue vigente como advertencia.

## Context / Contexto

El 2026-07-21 se decidió **no** construir app de escritorio como primer movimiento, y
poner por delante: (1) el lanzador `npx @juanklagos/sdd`, (2) un spike de una hora del
`.mcpb`, (3) el `.mcpb` si el spike pasaba. Electron quedó *"diferido, no descartado"*.

Estado real al tomar esta decisión, verificado en la sesión del 2026-07-22:

| Fase previa | Estado |
|---|---|
| 1. Lanzador de un comando | **1 de 8 tareas** (`specs/011-one-command-launcher/tasks.md`). Solo T1: el builder ya viaja en el tarball. El paquete `@juanklagos/sdd` no existe en `packages/` |
| 2. Spike `.mcpb` | **Ejecutado el 2026-07-22, sin veredicto de host.** Empaqueta (4.0 MB), instala y habilita en Claude Desktop, y pasa 8/8 comprobaciones de protocolo por stdio. Lo que no se comprobó es si el host renderiza el iframe de `ui://sdd/board.html` |
| 3. `.mcpb` distribuido | No iniciada |

**Es decir: ninguna de las dos condiciones escritas de reapertura se cumplió.** No hay
evidencia de uso real de que la fricción persista tras el lanzador, y el spike no falló —
quedó sin responder en el único punto que importaba.

Se dejó dicho, con esa tabla a la vista. El propietario reafirmó el pedido: *"bueno pero
necesito mas una app tipo escritorio con electron del builder"*, y luego precisó la forma:
*"quiero una carpeta dedicada para ese proyecto, claramente conectado a todo lo que se
necesite de los mcp y demas"*.

## Decision / Decisión

Construir **SDD Desk**: `desk/`, carpeta hermana de `builder/`, shell de Electron que
hospeda el servidor SDD en su proceso principal y carga `builder/dist` sin modificarlo.
Spec `023-desk-electron`.

Tres elecciones de forma que vale la pena fijar aquí:

1. **Contenedor, no segunda interfaz.** `desk` carga el builder tal cual. Verificado que
   es posible: `builder/src/api.ts` y `live.ts` solo hablan `fetch` y `EventSource` contra
   rutas relativas, sin tocar `fs` ni `process`.
2. **La app es también el servidor MCP del workspace.** `http.ts:72-77` ya enruta `/mcp`;
   hospedarlo en el escritorio hace que un agente pueda apuntar a la app abierta. Es la
   parte que el pedido llamó *"conectado a todo lo que se necesite de los mcp"*, y su costo
   es una vista, no protocolo nuevo.
3. **La ventana carga por `http://127.0.0.1`, nunca `file://`.** `security.ts:81-93`
   rechaza el origen `"null"` de las páginas `file://`, y solo en métodos mutantes: una
   ventana `file://` leería bien y fallaría en toda escritura. Sube a criterio de
   aceptación por ser un fallo que aparenta funcionar.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Mantener el orden de la decisión anterior** (terminar 011, resolver el spike, y solo entonces evaluar Electron) | Es lo que recomendé y sigue siendo la secuencia más barata. Descartada por decisión explícita del propietario, no por un hallazgo técnico que la invalidara. Queda dicho para que un lector futuro no busque una razón de ingeniería que no existe |
| **Tauri** | El main de Electron es Node, así que el servidor corre en proceso; Tauri exigiría Node como sidecar (~115 MiB solo el binario, contra ~116 MB de todo Electron) más Rust como segundo stack. La ventaja de tamaño no existe para esta forma de producto, y `opencode` ya recorrió ese camino y volvió |
| **Reescribir la interfaz dentro de Electron** | Una segunda superficie que mantener y desincronizar, sin ganancia: el builder ya corre sin cambios dentro de un renderer |
| **Empaquetar sin firmar y distribuir igual** | Traslada el costo a la cola de soporte (Gatekeeper, SmartScreen), con una audiencia que no puede autodiagnosticarse. Se acepta solo como estado intermedio para uso propio, no como distribución |

## Consequences / Consecuencias

**A favor**
- Elimina el prerrequisito de Node, que es el muro real para quien no es técnico. Electron
  trae su propio runtime.
- Ventana e ícono propios, sin terminal viva como host del proceso.
- La app pasa a ser el servidor MCP del workspace abierto, no solo un visor.
- Fuerza un refactor que ya hacía falta: `http.ts` deja de arrancar un servidor como efecto
  de importación y pasa a ser factoría, que es también `011` R2.

**Costos aceptados, con los ojos abiertos**
- ~150-300 h/año de mantenimiento en tres sistemas operativos, y la cola de soporte
  escalando con la adopción. La decisión anterior lo documentó y no cambió.
- Electron saca major cada 8 semanas y solo soporta las últimas 3: se hereda el flujo de
  CVEs de Chromium/V8.
- Ser dueño de un canal de push de código a máquinas ajenas (el auto-updater). Ver
  CVE-2025-27554, ToDesktop, CVSS 9.9, que afectó a Cursor y Linear.
- Apple Developer $99/año para notarizar macOS.
- Flathub sigue prohibiendo código asistido por IA desde 2026-05-29: el Linux de mayor
  alcance queda cerrado; solo AppImage y `.deb`.

**Lo que sí cambió a favor desde la decisión anterior**
- Aquella listaba como bloqueador que PolyForm Noncommercial, al no estar aprobada por OSI,
  cerraba la firma gratuita de SignPath Foundation. El mismo día,
  [`2026-07-21-relicencia-mit.md`](2026-07-21-relicencia-mit.md) relicenció a MIT, que sí
  está aprobada por OSI. La firma gratuita de Windows vuelve a la mesa —
  **por verificar contra los términos actuales de SignPath antes de contar con ella.**

**Riesgo principal**
- No es Electron: es el refactor de `http.ts`, que toca el camino que ya usa todo el mundo.
  Por eso el plan lo pone como hito bloqueante verificado antes de escribir una línea de
  Electron.

## Cuándo revisar esta decisión / When to revisit

- **Si las fases 1-3 de la spec (shell usable) cuestan mucho más de lo estimado**: es la
  señal temprana de que el resto del plan también, y todavía no se gastó en firma ni CI.
- Si el mantenimiento real supera lo presupuestado en el primer año, o si aparece la cola
  de soporte de Gatekeeper/SmartScreen que la decisión anterior anticipó.
- Si el `.mcpb` termina de verificarse y resuelve el prerrequisito de Node para la
  audiencia objetivo: entonces la pregunta pasa a ser si `desk` sigue justificando su
  costo, o si vale la pena reducir su alcance a uso propio sin distribución firmada.
- Si el proyecto deja de ser mantenido por una sola persona — que en este caso abarataría
  la decisión, no la encarecería.
