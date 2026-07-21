# Framework Readiness Roadmap

What is still missing to go from a solid template to a full framework, with GitHub Spec Kit as the main guide.

Lo que falta para pasar de un template sólido a un framework completo, usando GitHub Spec Kit como guía principal.

## Current gap areas / Áreas de brecha actuales

1. Normativa ejecutable / Executable governance
- Convert SDD rules into automated checks, not only documentation.
- Validate spec approval evidence and minimum `spec-plan-tasks` consistency in CI.

2. Flujo oficial GitHub Spec Kit end-to-end / Official GitHub Spec Kit flow
- Standardize one golden path:
  - `constitution -> specify -> plan -> tasks -> implement`
- Provide real examples per project type.

3. Versionado del framework / Framework versioning
- Define semantic versioning for the framework itself.
- Maintain changelog with clear breaking changes.

4. Certificación de calidad / Quality certification
- Create an official SDD compliance score and levels:
  - basic, intermediate, advanced.

5. Adopción multiagente completa / Complete multi-agent adoption
- Keep ready-to-use profiles for major agents.
- Add behavior tests to verify that each agent respects SDD gates.

6. Gobernanza del framework / Framework governance
- Define roadmap ownership and decision process (RFC/ADR).
- Define compatibility and deprecation policy.

7. Productized MCP architecture / Arquitectura MCP profesional
- Keep the repository root as the canonical framework.
- Move reusable domain logic into `packages/sdd-core`.
- Build the MCP server in `packages/sdd-mcp`.
- Keep `scripts/` as compatibility layer during migration.

## Guiding principle / Principio rector

GitHub Spec Kit stays the reference operating model for the workflow and the command sequence. When in doubt, follow it rather than inventing a parallel flow.

GitHub Spec Kit sigue siendo el modelo operativo de referencia para el flujo y la secuencia de comandos. Ante la duda, síguelo en vez de inventar un flujo paralelo.
