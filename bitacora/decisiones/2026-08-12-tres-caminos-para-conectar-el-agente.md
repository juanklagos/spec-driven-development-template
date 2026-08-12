# Tres caminos para conectar el agente, y escribir la config del usuario

- Fecha: 2026-08-12
- Spec: 032-conectar-agente-en-un-paso
- Estado: adoptada

## Qué se decidió

1. `sdd-mcp connect` **escribe** la configuración MCP en el archivo propio de
   cada cliente detectado (7 clientes), fusionando en vez de plantillar, y
   nunca tocando un archivo que no se pudo parsear.
2. La atención de la cola se ofrece por **tres caminos que conviven**: skill
   portable SKILL.md (`/sdd-serve`), comandos nativos (Gemini TOML, opencode
   markdown) y prompt MCP `sdd_serve_requests`.
3. El texto del bucle tiene **una sola fuente** en
   `packages/sdd-core/src/connect.ts`; skill, comandos y prompt lo renderizan.

## Por qué

- Fuente: investigación registrada en
  `specs/032-conectar-agente-en-un-paso/research.md` (2026-08-12). Ningún
  mecanismo cubre solo a los siete clientes: Codex no expone prompts MCP
  como slash commands (openai/codex#8342), y Gemini y opencode no leen
  SKILL.md. Tres caminos es la respuesta al ecosistema real, no exceso.
- El coste real para el usuario no era entender el concepto, sino localizar
  el archivo correcto de siete herramientas con cuatro claves raíz distintas
  y dos formatos.
- La fuente única del texto evita que el contrato del bucle se bifurque
  según cómo el usuario invoque la ayuda.
- El texto vive en TypeScript porque `scripts/build-framework-payload.mjs` no
  copia `skills/` ni `.claude/` al paquete npm (verificado): es la única
  ubicación que llega siempre al usuario.

## Alternativas rechazadas

- **Solo documentar**: deja intacto justamente el trabajo manual que se pide
  eliminar.
- **Lanzar el agente como subproceso** desde el builder o el servidor: un
  servidor local que ejecuta `claude`/`codex` por su cuenta es superficie de
  sorpresa y de seguridad, y ataría el producto a los flags de cada CLI.
- **Apostar por un solo mecanismo**: el prompt MCP dejaría fuera a Codex;
  SKILL.md dejaría fuera a Gemini y opencode.
- **Dependencia de un parser TOML**: solo emitimos una tabla plana de cuatro
  claves.

## Cuándo revisitarla

- Cuando Codex implemente prompts MCP como slash commands (issue #8342):
  entonces el prompt MCP podría absorber parte de los otros caminos.
- Si un cliente cambia su ruta o clave de configuración: el descriptor está
  aislado en `AGENT_CLIENTS` y hay prueba de merge por formato.
- Si aparece un octavo cliente relevante, o si el estándar SKILL.md unifica
  también a Gemini y opencode.
