# Research 001 - sdd-mcp-foundation

## Hallazgos iniciales

- El repositorio ya posee operaciones equivalentes a futuras tools MCP:
  - `create-www-project`
  - `init-project`
  - `init-project-with-spec-kit`
  - `new-spec`
  - `validate-sdd`
  - `check-sdd-gate`
  - `confirm-user-consent`
- El repositorio también posee recursos naturales para MCP:
  - política SDD
  - templates
  - quickstart
  - contexto canónico para agentes
- La arquitectura más profesional es separar framework, core reusable y servidor MCP.

## Decisiones preliminares

- Mantener la raíz del repositorio como framework canónico.
- Crear `packages/sdd-core` para la lógica reusable.
- Crear `packages/sdd-mcp` para la superficie MCP.
- Empezar por transporte `stdio`.
- Mantener `scripts/` como compatibilidad temporal.

## Fuentes

- Model Context Protocol specification
- MCP TypeScript SDK oficial
- Política interna del repositorio (`sdd.policy.yaml`)

