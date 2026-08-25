# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-08-25 | Scope / Alcance | Borrador inicial: el instalador clona HEAD y el actualizador compara contra el tag | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-25 | Scope / Alcance | Revisión: la decisión 4 negaba un cambio que la spec sí necesita — se invierte §6/§7 de `RELEASING.md` y el §4 declara `--ref`; hallazgo §R11 registrado | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-25 | Implementación / Implementation | Fases 1-4: resolución de ref por versión con `--ref` y fallback anunciado; `RELEASING.md` invierte §6/§7 y el §4 declara `--ref main`; decisión y bitácora registradas | `packages/create-sdd-project/index.mjs`, `packages/create-sdd-project/README.md`, `RELEASING.md`, `CHANGELOG.md`, `bitacora/` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-25 | Verificación / Verification | A/B con `sdd-mcp@2.6.0`: instalado desde el tag `v2.6.0` → «ya está al día»; desde `main` → `specs/_template/spec.md` divergente. Cuatro caminos de resolución, modo `full` y tarball instalado sin TTY | — | Juan Carlos Alvarez Lagos / Claude |
