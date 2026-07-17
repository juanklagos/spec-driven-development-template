# History 001 - sdd-mcp-foundation

## 2026-03-18

- Se crea la primera spec para profesionalizar el framework hacia una arquitectura MCP.
- Se define como dirección base la separación `packages/sdd-core` + `packages/sdd-mcp`.
- Se crea la estructura inicial de paquetes para soportar la evolución futura.
- El usuario aprueba explícitamente avanzar con la implementación completa del MVP MCP.
- Se crea el monorepo TypeScript base en la raíz del framework.
- Se implementa un primer `sdd-core` con operaciones tipadas para workspace, spec, validación, gate y consentimiento.
- Se implementa un primer `sdd-mcp` con tools, resources y prompts por `stdio`.
- Se agrega guía bilingüe de uso del servidor MCP y un smoke test automatizado del protocolo.
- Se amplía el MCP con tools para status, roadmap y bitácora.
- Se agregan ejemplos iniciales de configuración por cliente.
- Se agregan resource templates por archivo de spec.
- Se agrega transporte `Streamable HTTP` junto con smoke test dedicado.

## 2026-07-17

- La fundación MCP descrita en esta spec quedó implementada y liberada a lo largo de v1.1.0 → v1.4.1 (`sdd-core`, `sdd-mcp` stdio + HTTP, smoke tests, ejemplos por cliente).
- Se actualiza el estado en `specs/INDEX.md` de `Draft / Borrador` a `Done / Completada` para reflejar la realidad del release.
- Cambio realizado durante la revisión general de organización y documentación del template (investigación SDD 2026 + auditoría interna).
