# Referencia del builder

<!-- sdd:doc-type:start -->

> **Referencia** · Datos para consultar mientras trabajas. No está pensada para leerse entera.

<!-- sdd:doc-type:end -->

Datos para consultar mientras usas el tablero: cada acción del buscador ⌘K, los atajos de teclado y qué hace cada filtro. Si lo que buscas es aprender a usarlo, empieza por la [guía del builder](./51-guia-visual-sdd-builder.md).

La barra superior no tiene botones para todo: casi todo vive en el **buscador ⌘K** (Ctrl+K en Windows y Linux) y en el menú **⋯**. Se escribe lo que quieres y se pulsa Enter.

**En ⌘K puedes:**

| Escribes | Qué hace |
| :--- | :--- |
| el número o el nombre de una spec | salta a esa tarjeta y la abre |
| «validar» | ejecuta la validación real del proyecto |
| «aprobar» | abre la pestaña de aprobación de la spec que tengas abierta |
| «decisión» | abre la bitácora para registrar una decisión |
| «informes» | regenera `STATUS.md` y el roadmap |
| «PNG» | exporta el grafo como imagen |
| «plantillas» | abre la galería de plantillas |
| «asistente» | abre el asistente que propone un tablero entero |
| «conectar» | te dice cómo conectar tu agente |
| «tour» | vuelve a lanzar el recorrido guiado |
| «idioma» | cambia entre español e inglés |
| «guardar» | fuerza el guardado ahora |
| «dashboard» | abre la página de estado |

Dentro de ⌘K te mueves con ↑ y ↓, ejecutas con Enter y cierras con Esc.

**Atajos de teclado**, para cuando ya te lo sabes:

| Tecla | Qué hace |
| :--- | :--- |
| **I** | pone una nota de Idea en el centro |
| **E** | pone una nota de Épica |
| **S** | abre el formulario de spec nueva |
| **⌘K** / Ctrl+K | abre el buscador |
| **⌘Z** / Ctrl+Z | deshace |
| **⇧⌘Z** / Ctrl+Shift+Z | rehace |
| **Supr** o **Retroceso** | borra la nota o la unión seleccionada (las tarjetas de spec no se borran así, y te explica por qué) |
| **⌘Enter** / Ctrl+Enter | confirma en los campos de texto largos (nota, asistente, petición a la IA) |
| **Esc** | cancela la edición |
| **←** **→** | avanza y retrocede en el tour |

Las tres teclas I, E y S solo funcionan cuando no estás escribiendo en un campo.

**Los filtros** de la segunda franja no ocultan nada: **atenúan** lo que no coincide, para que el tablero no cambie de forma mientras miras. Son tres: `pendientes` (specs sin aprobar), `con avisos` (specs con errores del gate) y `con deriva` (specs cuyo código cambió después de aprobarlas). A la derecha de esa franja tienes el recuento: cuántas specs, cuántas uniones y el zoom.


## Las siete configuraciones de cliente

Qué archivo escribe `connect` en cada cliente, y qué escribes tú para que atienda la cola. Detalles del comando en la [guía del builder](./51-guia-visual-sdd-builder.md).

| Cliente | Archivo | Clave | Atender la cola |
| :--- | :--- | :--- | :--- |
| Claude Code | `.mcp.json` | `mcpServers.sdd` | `/sdd-serve` |
| Codex | `.codex/config.toml` | `[mcp_servers.sdd]` | `/sdd-serve` |
| Cursor | `.cursor/mcp.json` | `mcpServers.sdd` | `/sdd-serve` |
| VS Code | `.vscode/mcp.json` | `servers.sdd` | prompt MCP `sdd_serve_requests` |
| Windsurf | `.windsurf/mcp_config.json` | `mcpServers.sdd` | prompt MCP `sdd_serve_requests` |
| Gemini CLI | `.gemini/settings.json` | `mcpServers.sdd` | `/sdd:serve` |
| opencode | `opencode.json` | `mcp.sdd` | `/sdd-serve` |
