# Especificación 001 - sdd-mcp-foundation

## Estado de aprobación / Approval status

- Estado / Status: `Pendiente`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `YYYY-MM-DD`
- Aprobado por / Approved by: `Nombre o rol`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote):

## Historia de usuario principal

Como mantenedor del framework SDD,
quiero convertir la lógica principal del template en un producto MCP con herramientas y recursos tipados,
para que múltiples asistentes IA puedan ejecutar el flujo SDD de forma consistente, segura y profesional.

## Escenarios de aceptación

1. Dado el framework actual, cuando se defina la arquitectura del MCP, entonces la decisión deja claro que la raíz del repositorio sigue siendo el framework canónico y el MCP vive en `packages/sdd-mcp`.
2. Dado un cliente MCP, cuando se conecte al futuro servidor, entonces podrá descubrir tools, resources y prompts orientados al flujo SDD.
3. Dado un proyecto ejecutable, cuando el MCP actúe sobre él, entonces solo podrá operar dentro del workspace actual y usar `./www/<project-name>/` como raíz de ejecución.
4. Dado que una spec aún no está aprobada, cuando el MCP intente avanzar a implementación, entonces debe bloquear la ejecución y exigir spec aprobada, plan consistente y consentimiento del usuario.
5. Dado el framework actual basado en scripts, cuando se implemente el MCP, entonces la lógica reusable deberá moverse gradualmente a `packages/sdd-core` para evitar contratos basados solo en texto de shell.

## Requisitos

- Definir una arquitectura profesional basada en `packages/sdd-core` y `packages/sdd-mcp`.
- Mantener este repositorio como fuente canónica del framework y no convertir la raíz en un servidor MCP monolítico.
- Exponer un conjunto inicial de herramientas MCP para crear workspace, crear spec, validar estructura, revisar gate SDD y registrar consentimiento.
- Exponer recursos MCP para política, templates, guías clave y contexto del proyecto activo.
- Exponer prompts MCP para flujos guiados de proyecto nuevo, adaptación de proyecto existente, primera spec y cierre de sesión.
- Enforzar que el MCP solo escriba dentro del root abierto por el cliente y que los proyectos ejecutables vivan en `./www/`.
- Diseñar el MVP del MCP sobre `stdio`, con posibilidad de agregar `Streamable HTTP` después.
- Definir una migración progresiva desde `scripts/` hacia `sdd-core` sin romper compatibilidad actual.

## Criterios de éxito

- Existe una spec inicial que describe el producto MCP, su alcance y sus restricciones.
- Existe una estructura base en `packages/sdd-core` y `packages/sdd-mcp`.
- La documentación del repositorio deja claro que la ruta profesional es framework canónico + core reusable + servidor MCP.
- La implementación futura puede arrancar sobre una base consistente sin rehacer la arquitectura.

