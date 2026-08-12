# Plan técnico 032 - Conectar el agente en un paso

## Idea central

Tres caminos que conviven, porque ningún mecanismo cubre a todos los
clientes hoy:

| Camino | Cubre | Coste para el usuario |
| :--- | :--- | :--- |
| **A. `sdd-mcp connect`** | los 7 clientes | un comando, una vez |
| **B. Skill portable + comandos nativos** | SKILL.md: Claude Code, Codex, Cursor y compatibles; nativo: Gemini, opencode | lo instala A; luego `/sdd-serve` |
| **C. Prompt MCP `sdd_serve_requests`** | Claude Code, VS Code (Codex aún no: openai/codex#8342) | cero instalación |

Los tres sirven el **mismo texto de bucle**, con una sola fuente en
`sdd-core`. Si el texto cambia, cambia en los tres a la vez.

## Componentes

### 1. `packages/sdd-core/src/connect.ts` — cubre R1, R2, R3, R4, R5, R8, R9, R11

Un descriptor por cliente, todos con la misma forma:

```ts
interface AgentClient {
  id: string;                 // "claude-code", "codex", …
  label: string;
  /** Config MCP: ruta relativa al proyecto (o al home con --global). */
  mcpFile: { project?: string; global?: string; format: "json" | "toml" };
  /** Dónde va la entrada dentro del archivo. */
  mcpKey: string[];           // ["mcpServers","sdd"] | ["servers","sdd"] | ["mcp","sdd"] | ["mcp_servers","sdd"]
  entry: "stdio" | "vscode" | "opencode" | "toml";
  /** Skills estándar (SKILL.md) y/o comando nativo. */
  skillsDir?: string;
  nativeCommand?: { path: string; render(): string };
  detect(projectRoot: string): Promise<boolean>;
}
```

Tabla de destinos (investigada, ver `research.md`):

| Cliente | Archivo | Clave | Skills / comando |
| :--- | :--- | :--- | :--- |
| Claude Code | `.mcp.json` | `mcpServers.sdd` | `.claude/skills/` |
| Codex | `.codex/config.toml` | `[mcp_servers.sdd]` | `.codex/skills/`, `.agents/skills/` |
| Cursor | `.cursor/mcp.json` | `mcpServers.sdd` | `.cursor/skills/` |
| VS Code | `.vscode/mcp.json` | `servers.sdd` | — (prompt MCP) |
| Windsurf | `.windsurf/mcp_config.json` | `mcpServers.sdd` | — |
| Gemini CLI | `.gemini/settings.json` | `mcpServers.sdd` | `.gemini/commands/sdd/serve.toml` |
| opencode | `opencode.json` | `mcp.sdd` (`type: "local"`, `command: [...]`) | `.opencode/command/sdd-serve.md` |

Reglas de escritura:

- **Merge, nunca plantilla**: se lee el archivo, se parsea, se coloca la
  entrada en su ruta de claves y se reserializa. Todo lo demás sobrevive
  (R2). Sin dependencias nuevas: el TOML que emitimos es una tabla plana de
  4 líneas y el parseo para merge se limita a localizar el bloque
  `[mcp_servers.sdd]` y sustituirlo (o añadirlo al final).
- **Idempotencia observable**: si la entrada ya es exactamente igual, el
  resultado del destino es `unchanged` y el archivo no se toca (mtime
  incluido) (R2).
- **Config inválida = se respeta**: parse fallido → `error` con la ruta, se
  continúa con los demás (R3). Nunca se sobrescribe algo que no entendimos.
- Escritura atómica (temp + rename), como el resto del core.

### 2. Texto del bucle: una sola fuente — cubre R6

`SERVE_QUEUE_INSTRUCTIONS` en `connect.ts`, bilingüe, con el contrato:
`sdd_next_request` → redactar → `sdd_respond_request` → repetir; y la regla
dura: **no escribir archivos bajo `specs/`**. De ahí salen:

- el cuerpo del `SKILL.md` (frontmatter `name`/`description` del estándar
  abierto),
- el `prompt` del TOML de Gemini,
- el template del comando de opencode,
- el prompt MCP `sdd_serve_requests` (lo importa `sdd-mcp`).

Nota de distribución: el texto vive en TypeScript, no en `skills/`, porque
`scripts/build-framework-payload.mjs` no copia `skills/` ni `.claude/` al
paquete npm (verificado). Embebido en el código llega siempre, sin plumbing
nuevo. El `skills/sdd-serve/SKILL.md` del repo se genera con el propio
`connect`, así que no hay dos verdades.

### 3. `packages/sdd-mcp/src/cli.ts` — subcomando `connect`

`connect [--client <id>] [--dry-run] [--global] [--project-root <ruta>]`.
Hoy el CLI solo acepta `--http`/`--version`/`--help`; se añade el verbo
manteniendo el rechazo estricto de flags desconocidos. Salida: una línea por
destino con estado (`creado`/`actualizado`/`sin cambios`/`error`), la ruta
absoluta, y al final el siguiente paso exacto (R11). Sin clientes detectados
→ código 0 + instrucciones manuales (R9).

### 4. `packages/sdd-mcp/src/server.ts` — prompt `sdd_serve_requests` (R7)

Con la API existente `server.prompt(name, argsSchema, handler)`, argumento
`projectRoot`, devolviendo `SERVE_QUEUE_INSTRUCTIONS`.

### 5. Builder: panel "Conectar agente" (R10)

`ConnectAgentModal.tsx`: pestañas por cliente, y por cada una dos filas de
comando copiables reutilizando el `CommandRow` que ya existe en `App.tsx`
(se extrae a su propio módulo para poder importarlo). Entradas de acceso:

- el estado "sin agente" del `AiAssistButton` (spec 031) enlaza al panel,
- una acción `cmdk.connect` en `CommandPalette.tsx`,
- el bloque punteado del `EmptyOverlay`, junto al comando de terminal.

### 6. Comando `/sdd:serve` del plugin

`.claude/commands/sdd/serve.md`, con el formato de los otros seis
(frontmatter `description` bilingüe). Es el camino para quien ya usa el
plugin del marketplace.

## Decisiones y alternativas

- **Escribir la config nosotros vs. solo documentarla**: la escribimos. El
  usuario pidió "lo más automático posible" y el coste real de la conexión
  hoy es encontrar el archivo correcto de cada cliente. Mitigación del
  riesgo: merge + idempotencia + `--dry-run` + nunca tocar lo que no
  parseamos.
- **Rechazado: lanzar el agente como subproceso** desde el builder o el
  servidor. Un servidor local que ejecuta `claude`/`codex` por su cuenta es
  una superficie de sorpresa (y de seguridad) que esta herramienta no debe
  tener. El usuario ejecuta sus comandos; nosotros los escribimos por él.
- **Rechazado: una sola vía "universal"**. No existe hoy: Codex no expone
  prompts MCP (openai/codex#8342), Gemini y opencode no leen SKILL.md. Tres
  caminos es la respuesta honesta al ecosistema de 2026, no un exceso.
- **Rechazado: dependencia de un parser TOML**. Solo emitimos una tabla
  plana; una dependencia nueva en el core por 4 líneas no se paga.

## Riesgos

- Un cliente cambia su ruta de config: el descriptor está aislado y la
  prueba de merge lo pilla; queda documentado en la tabla de la guía.
- Detección por presencia de directorio: puede haber falsos negativos (un
  cliente instalado pero nunca ejecutado). Mitigación: `--client <id>`
  fuerza cualquiera de los siete.

## Cobertura requisito → componente

| Requisito | Componente |
|---|---|
| R1 | descriptores + `detect` + escritura por cliente |
| R2 | merge + comparación previa (`unchanged`) |
| R3 | parse defensivo por destino |
| R4 | emisión de SKILL.md a `skillsDir` + `.agents/skills/` |
| R5 | `nativeCommand` de Gemini y opencode |
| R6 | `SERVE_QUEUE_INSTRUCTIONS` (fuente única) |
| R7 | `server.prompt("sdd_serve_requests", …)` |
| R8 | modo `dryRun` en el planificador |
| R9 | salida sin clientes + instrucciones manuales |
| R10 | `ConnectAgentModal` + ⌘K + estado sin agente |
| R11 | resumen de resultados del CLI |
