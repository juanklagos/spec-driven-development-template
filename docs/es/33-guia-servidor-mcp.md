# Guía del servidor MCP

## Propósito

Esta guía explica cómo ejecutar y conectar el servidor local `sdd-mcp`.

Ahora el repositorio sigue esta ruta de producto:

- raíz del framework como fuente canónica
- `packages/sdd-core` para lógica reusable SDD
- `packages/sdd-mcp` para tools, resources y prompts MCP

## MVP actual

Transporte:
- `stdio`

Tools:
- `sdd_create_workspace`
- `sdd_create_spec`
- `sdd_validate`
- `sdd_check_gate`
- `sdd_record_user_consent`
- `sdd_list_specs`
- `sdd_generate_status`
- `sdd_generate_roadmap`
- `sdd_append_project_log`
- `sdd_write_daily_log`
- `sdd_write_handoff`
- `sdd_write_decision`

Resources:
- política
- quickstart
- guía AI start
- plantilla de spec
- resource template para idea del proyecto

Prompts:
- `start_new_sdd_project`
- `adapt_existing_project_to_sdd`
- `close_sdd_session`

## Configuración local

```bash
npm install
npm run typecheck
npm run build
npm run mcp:smoke
```

Ejecuta el servidor:

```bash
npm run mcp:start
```

## Patrón de configuración del cliente

Usa el entrypoint compilado del servidor:

```text
node /RUTA/ABSOLUTA/A/spec-driven-development-template/packages/sdd-mcp/dist/index.js
```

Raíz de trabajo recomendada:
- abre este repositorio como workspace
- usa `./www/<project-name>/` para proyectos ejecutables

## Ejemplo de configuración MCP

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": [
        "/RUTA/ABSOLUTA/A/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ]
    }
  }
}
```

## Ejemplos por cliente

### Claude Desktop

Ejemplo de entrada MCP:

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": [
        "/RUTA/ABSOLUTA/A/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ]
    }
  }
}
```

Primer mensaje sugerido:

```text
Usa el servidor MCP sdd conectado.
Crea primero la base SDD.
Si el proyecto es ejecutable, mantenlo dentro de ./www/<project-name>.
No implementes código antes de spec aprobada y plan consistente.
Usa tools MCP cuando estén disponibles en lugar de edición libre de archivos.
```

### Cursor

Usa el mismo par `command/args` para registrar el servidor MCP local.

Primer mensaje sugerido:

```text
Usa las tools y resources del servidor MCP sdd para este repositorio.
Comienza leyendo los resources de policy y quickstart.
Luego crea o inspecciona el proyecto SDD activo dentro de ./www/.
```

### Codex Desktop

Cuando el registro de servidores MCP esté disponible, apunta al mismo entrypoint compilado.

Primer mensaje sugerido:

```text
Usa el servidor MCP local sdd para operaciones SDD.
Prefiere tools MCP para workspace, spec, validación, roadmap y bitácora.
```

## Reglas operativas

- La raíz del framework sigue siendo la fuente canónica.
- Los proyectos ejecutables deben vivir en `./www/`.
- No hay implementación sin spec aprobada y plan consistente.
- Registra consentimiento explícito solo antes de iniciar implementación.

## Siguiente evolución recomendada

- agregar tools `generate_status` y `generate_roadmap`
- agregar tools directos para bitácora
- agregar transporte Streamable HTTP
- agregar documentación de integración por cliente
