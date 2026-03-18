# Plan 001 - sdd-mcp-foundation

## Resumen

Crear la base arquitectónica para convertir el framework SDD en un producto MCP profesional sin romper el uso actual del template. La estrategia será separar lógica reusable (`sdd-core`) y superficie MCP (`sdd-mcp`) dentro del mismo repositorio.

## Contexto técnico

- El repositorio actual contiene scripts Bash funcionales y documentación amplia.
- MCP requiere una superficie explícita de `tools`, `resources` y `prompts`.
- El mejor punto de entrada es un servidor en TypeScript con transporte `stdio`.
- La lógica de negocio no debe quedar atada indefinidamente a parsing de stdout de shell.

## Fases de implementación

1. Definir la arquitectura, alcance del MVP MCP y restricciones de seguridad.
2. Crear `packages/sdd-core` y `packages/sdd-mcp` con documentación inicial.
3. Diseñar contratos tipados para tools, resources y prompts.
4. Migrar gradualmente lógica reusable desde `scripts/` hacia `sdd-core`.
5. Implementar servidor MCP `stdio` y validarlo con clientes MCP compatibles.

## Dependencias

- TypeScript
- SDK oficial de MCP
- Política SDD actual del repositorio
- Scripts actuales como capa de compatibilidad temporal

## Hitos

- Hito 1: arquitectura aprobada
- Hito 2: estructura `packages/` creada
- Hito 3: contratos MCP v1 definidos
- Hito 4: servidor MCP MVP operativo por `stdio`

## Riesgos

- Riesgo 1: duplicar lógica entre scripts y MCP
- Riesgo 2: crear un MCP demasiado orientado a documentación y no a operaciones reales
- Riesgo 3: no imponer correctamente las restricciones de root y `./www/`
- Riesgo 4: introducir demasiada complejidad antes de estabilizar el MVP

