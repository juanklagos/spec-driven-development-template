# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-08-20 | Scope / Alcance | Borrador y aprobación: generalizar el `forwardRef` de `d4e2060` a los diez componentes que Radix compone por `asChild`, con prueba de regresión, y excluir `.claude/` del descubrimiento de vitest | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |
| 2026-08-20 | Implementation / Implementación | Los diez componentes y `ui-refs.test.tsx` integrados desde el worktree. Dos huecos que la integración destapó y no estaban en el worktree: `jsdom` faltaba en las devDependencies de la raíz (la CI ejecuta `test:unit` desde ahí) y el alias `@` solo existía en `builder/vite.config.ts` | `builder/src/components/ui/*`, `builder/src/ui-refs.test.tsx`, `vitest.config.ts`, `package.json` | Juan Carlos Alvarez Lagos / Claude |
