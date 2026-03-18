# Estrategia de versionado

## Propósito

Este documento define cómo debe funcionar el versionado entre el framework y sus paquetes internos.

## Regla actual

- la versión pública canónica es la release del repositorio
- `@sdd/sdd-core` y `@sdd/sdd-mcp` deben mantenerse alineados con la release minor del repositorio

Alineación actual:
- framework: `1.2.0`
- `@sdd/sdd-core`: `1.2.0`
- `@sdd/sdd-mcp`: `1.2.0`

## Política práctica de releases

### Patch

Usa releases patch para:
- fixes de documentación
- fixes de CI
- fixes de scripts no rompientes
- fixes MCP no rompientes

### Minor

Usa releases minor para:
- nuevos tools
- nuevos resource templates
- nuevos flujos de onboarding
- nuevos ejemplos
- nuevas guías que mejoran materialmente la adopción

### Major

Usa releases major para:
- cambios rompientes en workflow
- cambios rompientes en policy/gate
- cambios rompientes en contratos MCP
- cambios rompientes en la estructura de paquetes

## Regla para paquetes

- los paquetes internos permanecen `private` hasta que exista un flujo deliberado de publicación
- mientras sean privados, mantén sus versiones alineadas con la release del framework para evitar confusión
- si luego se publican, conserva semver y maneja changelogs por paquete
