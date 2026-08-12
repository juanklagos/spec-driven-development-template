# Investigación 032 - Conectar el agente en un paso

## Estado actual del template (2026-08-12)

- La spec 031 dejó la cola funcionando, pero conectar sigue siendo manual:
  registrar el MCP a mano y escribir el prompt del bucle cada sesión.
- Los comandos `/sdd:*` viven en `.claude/commands/sdd/*.md` y se
  distribuyen como **plugin de Claude Code**
  (`.claude-plugin/plugin.json`). `scripts/build-framework-payload.mjs` no
  copia `.claude/` ni `skills/`, así que **los proyectos generados por el
  template no reciben los comandos**. Por eso el texto de la skill nueva se
  embebe en TypeScript: es lo único que llega siempre por npm.
- Hay una skill portable ya en el repo: `skills/sdd-workflow/SKILL.md`
  (frontmatter `name` + `description`), que sirve de precedente de formato.
- Los prompts MCP usan la API `server.prompt(name, argsSchema, handler)`.
- Documentación de conexión hoy: guía 51 cubre Claude Code, Codex, Gemini y
  HTTP; guías 33 y 36 cubren Cursor/Claude/Codex pero **desactualizadas**
  (usan `node …/dist/index.js` en vez de `npx @juanklagos/sdd-mcp@latest`).
  Nadie cubre Windsurf, VS Code ni opencode, aunque el template ya emite
  reglas para Windsurf.

## Ecosistema de clientes (investigado 2026-08-12)

### Rutas de configuración MCP

| Cliente | Archivo | Clave raíz | Formato |
| :--- | :--- | :--- | :--- |
| Claude Code | `.mcp.json` (proyecto) / `~/.claude.json` | `mcpServers` | JSON |
| Codex | `.codex/config.toml` / `~/.codex/config.toml` | `[mcp_servers.*]` | TOML |
| Cursor | `.cursor/mcp.json` / `~/.cursor/mcp.json` | `mcpServers` | JSON |
| VS Code | `.vscode/mcp.json` (solo proyecto) | `servers` | JSON |
| Windsurf | `.windsurf/mcp_config.json` / `~/.codeium/windsurf/mcp_config.json` | `mcpServers` | JSON |
| Gemini CLI | `.gemini/settings.json` / `~/.gemini/settings.json` | `mcpServers` | JSON |
| opencode | `opencode.json` / `~/.config/opencode/opencode.json` | `mcp` (`type: "local"`) | JSON |

Fuentes: guía comparativa de setup MCP (chatforest), documentación de
opencode (`opencode.ai/docs/config`), documentación de Gemini CLI, y las
recetas ya presentes en las guías 33/36 del propio template.

### Invocación reutilizable (atender la cola)

- **Estándar abierto SKILL.md**: `name` + `description` obligatorios; lo
  adoptan Codex CLI, Claude Code, Cursor, Gemini CLI y +30 herramientas, con
  el mismo archivo sin modificar. Codex lee `.codex/skills/` y también la
  ubicación estándar de repositorio `.agents/skills/`.
- **Prompts MCP como slash commands**: soportado por Claude Code
  (`/mcp__servidor__prompt`) y VS Code. **Codex todavía no** — issue abierto
  openai/codex#8342. Por eso el prompt MCP no puede ser el único camino.
- **Comandos nativos** para los que no leen SKILL.md: Gemini CLI usa TOML en
  `.gemini/commands/` (campos `prompt` y `description`, subdirectorios →
  `namespace:comando`); opencode usa markdown en `.opencode/command/` con
  frontmatter `description`/`agent`/`model`.
- **Prompts de Codex** (`~/.codex/prompts/*.md`, `/prompts:nombre`) están
  **deprecados** a favor de skills — no los emitimos.
- **Headless** (documentado, no automatizado por nosotros): `claude -p`,
  `codex exec`, `gemini -p`, `opencode run`.

## Decisiones y alternativas evaluadas

- **Decisión: escribir la configuración del usuario, no solo documentarla.**
  Por qué: el coste real hoy no es entender el concepto sino localizar el
  archivo correcto de siete herramientas distintas. Riesgo mitigado con
  merge, idempotencia, `--dry-run` y la regla de no tocar jamás un archivo
  que no se pudo parsear. Rechazado el camino "solo docs": deja el trabajo
  manual intacto, que es justo lo que se pide eliminar.
- **Decisión: tres caminos coexistiendo (CLI, skill/comandos, prompt MCP).**
  Por qué: ninguno cubre los siete clientes en 2026 (Codex sin prompts MCP;
  Gemini y opencode sin SKILL.md). Rechazado apostar solo por el prompt MCP
  (dejaría fuera a Codex, el segundo cliente más usado del público de este
  template) y solo por SKILL.md (dejaría fuera a Gemini y opencode).
- **Decisión: el texto del bucle vive en TypeScript en `sdd-core`.**
  Por qué: es la única ubicación que el paquete npm distribuye hoy
  (verificado en `build-framework-payload.mjs` y en los `files` de los tres
  paquetes). Rechazado ponerlo en `skills/`: no viajaría al usuario.
- **Decisión: no lanzar el agente como subproceso.** Por qué: un servidor
  local que ejecuta `claude`/`codex` por su cuenta es una superficie de
  sorpresa y de seguridad que esta herramienta no debe tener; además ataría
  el producto a los flags de cada CLI. Rechazado el "botón mágico" que
  arranca el agente; en su lugar el builder escribe el comando y el usuario
  lo ejecuta.
- **Decisión: sin dependencia de parser TOML.** Por qué: solo emitimos una
  tabla plana de cuatro claves; una dependencia nueva en el núcleo no se
  paga. Rechazado añadir `@iarna/toml` o similar.
