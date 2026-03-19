# Roadmap público

## Propósito

Este roadmap hace explícitos los siguientes pasos del producto para que los usuarios sepan hacia dónde va el framework.

## Línea del roadmap

```mermaid
flowchart LR
  A["v1.4.0"] --> B["v1.5.0"]
  B --> C["v1.6.0"]
```

## Estado actual

Release publicada:
- `v1.4.0`

Disponible hoy:
- framework SDD con política multi-agente
- GitHub Spec Kit como referencia base del flujo
- sidecar `spec/` recomendado para proyectos reales
- `./www/<nombre-proyecto>/` como contenedor limpio interno cuando el proyecto vive dentro de este repositorio
- `sdd-core` tipado
- `sdd-mcp` local
- `stdio` + `Streamable HTTP`
- tools, resources, prompts, smoke tests y tests de integración MCP
- recetas de setup por cliente y alineación de versiones internas

## v1.5.0

Enfoque: endurecer onboarding alojado y enriquecer experiencia del operador.

Planeado:
- endurecer el contrato de onboarding MCP alojado
- enriquecer prompts fáciles y atajos por cliente
- sumar más ejemplos visuales y walkthroughs
- guías validadas con capturas para Cursor, Claude Code y Codex
- automatización de releases y guía de empaquetado más fuerte

## v1.6.0

Enfoque: estandarización del framework y empaquetado MCP publicable.

Planeado:
- estrategia de empaquetado/versionado más clara para `@sdd/sdd-core` y `@sdd/sdd-mcp`
- flujo opcional para publicar el paquete MCP
- modelo de gobernanza para contribuciones de comunidad
- showcase de proyectos reales usando el framework

## Notas

- GitHub Spec Kit sigue siendo la referencia externa y guía operativa principal.
- Las nuevas features deben seguir reduciendo fricción al usuario, no aumentar complejidad de setup.
