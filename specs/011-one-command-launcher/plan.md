# Plan 011

## Resumen
Fase 1 de la ruta de distribución decidida el 2026-07-21: quitar la barrera real (hay que clonar el repo) con un lanzador de un comando, y dejar preparado el gate del .mcpb.

## Contexto técnico
- Depende de que aterricen los arreglos críticos (mismos archivos: static.ts, http.ts, packaging de sdd-mcp).
- `sdd-mcp-http` ya existe como bin; el trabajo es empaquetado + UX de arranque, no arquitectura nueva.
- Sin dependencias pesadas: `open` para el navegador y prompts ligeros; nada que comprometa el arranque del servidor MCP puro.

## Fases
1. R1 empaquetado del builder (+ smoke del tarball). 2. R2-R3 puerto y navegador. 3. R4-R5 selector y paquete lanzador. 4. R6 lanzadores de doble clic. 5. R7 gate .mcpb + docs.

## Riesgos
- El comportamiento de quarantine/SmartScreen en lanzadores generados localmente está sin verificar: si falla, se degrada a la Fase 1 sin pérdida.
- El .mcpb depende de bugs abiertos de terceros: por eso es gate de 1 hora antes de comprometer días.
