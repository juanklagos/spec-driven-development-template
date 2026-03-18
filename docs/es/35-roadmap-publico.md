# Roadmap público

## Propósito

Este roadmap hace explícitos los siguientes pasos del producto para que los usuarios sepan hacia dónde va el framework.

## Estado actual

Release publicada:
- `v1.1.0`

Disponible hoy:
- framework SDD con política multi-agente
- aislamiento de proyectos ejecutables en `./www/<project-name>/`
- `sdd-core` tipado
- `sdd-mcp` local
- `stdio` + `Streamable HTTP`
- tools, resources, prompts y smoke tests MCP

## v1.2.0

Enfoque: adopción y testabilidad más fuertes.

Planeado:
- tests de integración MCP basados en fixtures
- un ejemplo completamente documentado end-to-end para proyecto nuevo
- un ejemplo completamente documentado end-to-end para adaptar un proyecto existente
- onboarding visual más explícito en el README
- issue templates para adopción y feedback de casos de uso

## v1.3.0

Enfoque: experiencia del operador entre distintos clientes IA.

Planeado:
- guías validadas con capturas para Cursor, Claude Code y Codex
- contratos MCP más estrictos y mayor cobertura de resources
- mejoras en automatización de releases
- mejores salidas para status y roadmap del proyecto

## v2.0.0

Enfoque: estandarización del framework.

Planeado:
- estrategia de empaquetado/versionado más clara para `@sdd/sdd-core` y `@sdd/sdd-mcp`
- flujo opcional para publicar el paquete MCP
- modelo de gobernanza para contribuciones de comunidad
- showcase de proyectos reales usando el framework

## Notas

- GitHub Spec Kit sigue siendo la referencia externa y guía operativa principal.
- Las nuevas features deben seguir reduciendo fricción al usuario, no aumentar complejidad de setup.
