# Decisión clave - Revisar la de «sin API keys» con evidencia nueva: MCP deprecó sampling, así que el copy-first del builder queda confirmado, no revisado / Key decision - MCP deprecated sampling; the builder's copy-first path is vindicated

## Date / Fecha

2026-07-23

## Context / Contexto

La decisión del 2026-07-20 (`bitacora/decisiones/2026-07-20-builder-sin-llamadas-a-llm.md`) fijó que el asistente ✨ del builder **no usa API keys ni llama a ningún modelo**: la heurística es local y determinista, y la IA real se delega al agente del usuario vía un **prompt copiable** (copy-first), no vía deep links ni vía una llamada del server.

Esa decisión dejó escrita, explícitamente, una condición de revisión:

> *"Si algún agente publica un mecanismo de entrega de prompt estable y estándar (no un deep link propietario): la parte «copy-first» podría revisarse."*

El candidato natural a ese «mecanismo estándar» era **MCP sampling** (`sampling/createMessage`): el server pide una generación y el *host* provee el modelo — sin API key en el server, que es justo la premisa económica del builder. En la evaluación del builder (2026-07-23) se propuso un spike para verificar su soporte real en clientes, con el mismo método que se usó con SEP-1865 en `bitacora/decisiones/2026-07-20-mcp-app-postergada`: verificar el estándar **antes** de escribir código.

## Decision / Decisión

Se verificó el estado del estándar antes de spike alguno. La evidencia **cierra** la condición de revisión en lugar de abrirla:

- **Sampling está deprecado** a partir de la versión de protocolo `2026-07-28`, por **SEP-2577** (registro de features deprecadas de MCP, verificado 2026-07-23 en `modelcontextprotocol.io/specification/draft/deprecated` y en la página de Sampling). Texto normativo: *"New implementations **SHOULD NOT** adopt it; existing implementations **SHOULD** migrate to integrating directly with LLM provider APIs."*
- La **ruta de migración oficial** es *"integrate directly with LLM provider APIs"* — es decir, **poner una API key en tu implementación**: exactamente lo que el builder decidió no hacer, y lo que su modelo de instalación («no hay nada que configurar») prohíbe.
- En la misma limpieza se deprecaron **Roots** y **Logging** del server (SEP-2577); el transporte **HTTP+SSE** ya estaba deprecado (SEP-2596) a favor de Streamable HTTP — y el builder **ya usa Streamable HTTP** (`packages/sdd-mcp/src/transport.ts:14`, `StreamableHTTPServerTransport`), así que ahí no hay deuda.

Conclusión: **no se hace el spike de sampling, y no se toca el copy-first.** La condición de revisión que la decisión del 2026-07-20 dejó abierta se resuelve con evidencia: el «mecanismo estándar» que la habría abierto acaba de ser marcado como el camino a abandonar. El prompt copiable —que funciona con cualquier agente, hoy y mañana— es la opción que envejece bien, no la que había que revisar.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Hacer el spike de sampling igualmente** | Construiría sobre una feature que MCP marca `SHOULD NOT adopt` con nueve días de antelación a su publicación final. Verificar el estándar antes de codificar es precisamente lo que evita este gasto (lección de la decisión MCP App del 2026-07-20) |
| **Adoptar la ruta de migración (API key directa)** | Rompe el contrato de instalación del builder («no hay key que pedir, guardar ni rotar») y contradice de frente la decisión del 2026-07-20, que rechazó *la categoría entera* de llamadas a LLM desde el server |
| **Esperar a un sustituto de sampling** | No hay uno anunciado para el caso «host provee el modelo, server sin key». Mientras no exista, el copy-first cubre la necesidad sin depender de nada externo |

## Consequences / Consecuencias

**A favor**
- La decisión del 2026-07-20 sale **reforzada por evidencia externa**, no solo por preferencia: el estándar se movió hacia donde el builder ya estaba.
- Se evita un spike que habría producido, en el mejor caso, una dependencia deprecada.
- Queda documentado, para la revisión del 2026-07-28, que Roots/Logging/Sampling/HTTP+SSE están deprecados y cuáles afectan (ninguno bloquea al builder; el transporte ya es el recomendado).

**Costos aceptados**
- El asistente ✨ sigue limitado a sus 9 dominios heurísticos cuando no hay agente conectado. Esta decisión **no** mejora ese modo degradado; solo cierra una vía que no lo habría mejorado sin romper el contrato.
- Si en el futuro MCP (u otro estándar) publica un mecanismo «host-provee-modelo, server-sin-key» **no deprecado**, la condición de revisión del copy-first vuelve a abrirse. Esta decisión no la cierra para siempre; la cierra contra *sampling*.

**Relación con otras decisiones**
- **Confirma** `2026-07-20-builder-sin-llamadas-a-llm.md` (no la reemplaza).
- **Se apoya** en el método de `2026-07-20-mcp-app-postergada-y-luego-con-sdk-oficial.md`: verificar el estado real del estándar justo antes de codificar.

**Cuándo revisar esta decisión**
- El 2026-07-28, al publicarse la spec MCP final: confirmar que sampling siguió deprecado (no hubo marcha atrás) y que Streamable HTTP quedó como el transporte estable.
- Si aparece un reemplazo de sampling que preserve «server sin API key»: reabrir solo la parte copy-first, dejando intacta la parte «sin API keys».
