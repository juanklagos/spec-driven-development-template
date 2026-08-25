# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-08-25 | Scope / Alcance | Borrador inicial tras reproducir la pérdida: el grupo se leía como nota y se guardaba como texto | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-25 | Implementación / Implementation | Fases 1-5: tipo en las tres declaraciones, marco pintado, contención derivada de la geometría, autoría (crear, renombrar, redimensionar, borrar liberando) y documentación | `board.ts`, `schemas.ts`, `builder/src/*`, `docs/*/54-*.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-25 | Alcance / Scope | Dos cambios sobre lo aprobado: `extent: "parent"` descartado porque atraparía las tarjetas dentro del marco, y «recolorear» fuera de alcance porque el builder no tiene selector de color para ningún nodo | `tasks.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-25 | Verificación / Verification | 30 pruebas de `convert.ts` más verificación en navegador: arrastre del marco, adopción al soltar dentro, borrado que libera, renombrado y redimensión, todo contrastado contra el archivo en disco | — | Juan Carlos Alvarez Lagos / Claude |
