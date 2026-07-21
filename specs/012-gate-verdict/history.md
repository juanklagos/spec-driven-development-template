# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-07-21 | Scope / Alcance | Borrador inicial. Alcance derivado del workflow de decisión de 25 agentes: veredicto de tres estados, línea de postura, unificación del extractor bash/TS, tres fallos que erosionan la fiabilidad, aviso de aprobaciones heredadas y la sección `## Ámbito de archivos` sin capacidad de bloquear. | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos |
| 2026-07-21 | Scope / Alcance | Detector de código **excluido** y trasladado a la spec 013. Tres revisiones adversariales independientes lo rompieron por la misma vía: la condición «cero specs aprobadas» es permanentemente falsa en la ruta de entrada, y se burla con una spec señuelo. | `spec.md` (Fuera de alcance), `research.md` (hallazgo 3) | Juan Carlos Alvarez Lagos |
| 2026-07-21 | Scope / Alcance | Alcance de aprobaciones heredadas **reducido** a la ruta de «Use this template» y `degit`, tras verificar en instalación limpia desde npm que `sdd_create_workspace` no hereda specs ni consent log. | `plan.md` (fase 5), `research.md` (hallazgo 4) | Juan Carlos Alvarez Lagos |
