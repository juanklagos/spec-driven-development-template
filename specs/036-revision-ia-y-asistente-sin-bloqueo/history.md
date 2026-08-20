# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-08-19 | Scope / Alcance | Borrador inicial: asistente sin la guardia de workspace vacío + revisión de specs por IA con dos caminos (cola y pegado) | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-19 | Decision / Decisión | Descartadas las claves de API en el builder; la revisión devuelve hallazgos anclados, no reescrituras | `spec.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-19 | Approval / Aprobación | Spec aprobada por el propietario; SOLID añadido como restricción de diseño de la implementación (no cambia alcance ni criterios) | `spec.md`, `plan.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-19 | Implementation / Implementación | Spec implementada y verificada en lienzo real (dos pasadas del asistente sobre workspace poblado, revisión por cola y revisión pegada). Dos defectos propios corregidos sobre la marcha: plurales «1 hallazgos»/«1 descartados»/«Crear 1 specs», y el lienzo escrito con 0 specs creadas | `builder/src/*`, `packages/sdd-core/src/requests.ts`, `packages/sdd-mcp/src/server.ts` | Juan Carlos Alvarez Lagos / Claude |
