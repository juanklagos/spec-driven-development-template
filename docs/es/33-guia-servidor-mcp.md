# Guía del servidor MCP

<!-- sdd:doc-type:start -->

> **Cómo hacer** · Pasos para una tarea concreta. Da por sabido lo básico.

<!-- sdd:doc-type:end -->

## Propósito

Solo setup y conectividad MCP. Nada más.

Si quieres primero la ruta no técnica, empieza aquí:
- [Guía fácil de MCP](./43-guia-mcp-facil.md)

Si quieres la referencia funcional completa, empieza aquí:
- [Referencia completa de MCP](./41-referencia-completa-mcp.md)

## Flujo de setup

```mermaid
flowchart LR
  A["Instalar dependencias"] --> B["Compilar MCP"]
  B --> C["Registrar configuración del cliente"]
  C --> D["Levantar transporte"]
  D --> E["Validar conexión"]
```

Separación del producto:
- raíz del repositorio: framework SDD canónico
- `packages/sdd-core`: lógica reusable de SDD
- `packages/sdd-mcp`: tools, resources, prompts y transportes MCP

## Lo que ya está implementado

Resumen de alto nivel solamente:

Transportes:
- `stdio`
- `Streamable HTTP`

Herramientas — **39 en total**. Esta guía no las lista una por una a propósito: esa lista se quedó obsoleta dos veces. La referencia completa y siempre al día es la [guía 41](./41-referencia-completa-mcp.md). Lo que cubren:

- **Crear y validar**: workspaces, specs numeradas, validación, la compuerta, consentimiento, puntaje de spec, lint EARS.
- **Leer y escribir specs**: documentos completos, secciones guiadas, la fila del INDEX y toda la lista de tareas (añadir, renombrar, quitar, mover, marcar).
- **El tablero**: leerlo, escribirlo, unir dos tarjetas y la vista para clientes con MCP Apps.
- **Bitácora**: decisiones, handoffs, diarias, log del proyecto — leer y escribir.
- **Informes**: STATUS.md y el roadmap.
- **Proyectos existentes**: instalar la carpeta `spec/`, descubrir estructura heredada, comprobar la política, comprobar deriva.
- **Mantenerte al día**: comparar tu versión instalada con la del servidor, y actualizar.
- **La cola de IA del builder**: reclamar una petición y responderla con una propuesta.

Salida estructurada:
- cada tool expone `outputSchema`
- los handlers devuelven `structuredContent` y salida textual

Resources estáticos:
- `sdd-policy`
- `sdd-ai-start`
- `sdd-easy-mcp-guide`
- `sdd-quickstart`
- `sdd-spec-template`

Resource templates del proyecto:
- `sdd-project-index`
- `sdd-project-log`
- `sdd-project-latest-handoff`
- `sdd-project-idea`
- `sdd-spec-document`

Prompts:
- `start_new_sdd_project`
- `adapt_existing_project_to_sdd`
- `close_sdd_session`
- `easy_start_project`
- `easy_create_spec`
- `easy_show_structure`
- `easy_validate_project`
- `easy_show_next_step`
- `easy_close_session`
- `sdd_serve_requests` — el bucle de atención de la cola de IA del builder (sin instalar nada en clientes que muestran los prompts MCP como slash commands)

## Configuración local

```bash
npm install
npm run typecheck
npm run build
npm run mcp:smoke
npm run mcp:http:smoke
```

Levanta los servidores:

```bash
npm run mcp:start
npm run mcp:http:start
```

Entrypoints:
- stdio: `packages/sdd-mcp/dist/index.js`
- HTTP: `http://127.0.0.1:3334/mcp`

## Contrato operativo

- abre este repositorio como raíz del workspace
- prefiere `./www/<nombre-proyecto>/` como espacio de trabajo recomendado por defecto
- también se soportan rutas externas para los tools basados en `projectRoot`
- crea primero la base SDD
- no implementes código antes de tener spec aprobada y plan consistente
- solicita consentimiento explícito solo cuando la implementación vaya a comenzar

Referencias relacionadas:
- [Referencia completa de MCP](./41-referencia-completa-mcp.md)
- [Referencia de resultados por comando](./40-referencia-resultados-comandos.md)

## Ejemplos listos para copiar

> **Atajo (spec 032):** `npx @juanklagos/sdd-mcp@latest connect` escribe estos archivos por ti, para siete clientes, fusionando con lo que ya tengas. Ver guía 51. Los ejemplos de abajo siguen como referencia manual.

Archivos de referencia:
- `packages/sdd-mcp/examples/.cursor/mcp.json`
- `packages/sdd-mcp/examples/.mcp.json`
- `packages/sdd-mcp/examples/codex.config.toml`

### Cursor

Ruta oficial de configuración en macOS/Linux:
- `~/.cursor/mcp.json`

Alternativa por proyecto:
- `mcp.json` dentro del workspace, si prefieres registro local al proyecto

Ejemplo:

```json
{
  "mcpServers": {
    "sdd": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/RUTA/ABSOLUTA/A/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ]
    }
  }
}
```

### Codex

Ruta oficial de configuración compartida:
- `~/.codex/config.toml`

Ejemplo:

```toml
[mcp_servers.sdd]
command = "node"
args = ["/RUTA/ABSOLUTA/A/spec-driven-development-template/packages/sdd-mcp/dist/index.js"]
```

### Claude Code

Configuración oficial por proyecto:
- `.mcp.json` en la raíz del repositorio

Configuración oficial por usuario:
- `~/.claude.json`

Ejemplo por proyecto:

```json
{
  "mcpServers": {
    "sdd": {
      "command": "node",
      "args": [
        "/RUTA/ABSOLUTA/A/spec-driven-development-template/packages/sdd-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

### Clientes con HTTP

Si el cliente soporta MCP remoto vía Streamable HTTP:

```text
http://127.0.0.1:3334/mcp
```

Usa:

```bash
npm run mcp:http:start
```

## Primer mensaje recomendado para la IA

```text
Usa el servidor MCP sdd conectado para este repositorio.
Crea primero la base SDD.
Si el proyecto es ejecutable dentro de este template, mantenlo en ./www/<nombre-proyecto>; también se soportan rutas externas.
Lee primero los resources de policy y quickstart.
No implementes código antes de spec aprobada y plan consistente.
Pide consentimiento explícito solo cuando la implementación vaya a comenzar.
```

## Checklist de verificación

- `npm run typecheck`
- `npm run build`
- `npm run mcp:smoke`
- `npm run mcp:http:smoke`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`
