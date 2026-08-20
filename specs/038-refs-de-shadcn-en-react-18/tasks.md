# Tareas 038 - Las refs de shadcn en React 18

Estado: `- [ ]` pendiente · `- [x]` hecha

## Pruebas

- [x] T1 — `ui-refs.test.tsx` en el árbol principal, en verde. (R2)
- [x] T2 — Comprobación: once de los doce componentes de `ui/` contienen
  `forwardRef`; el que falta es `sonner.tsx`. (R1, R4)
- [x] T3 — `npm test` desde la raíz: ningún archivo falla por no cargar. (R3)
- [x] T4 — `npm run typecheck` limpio.
- [x] T5 — `npm run builder:build` sin errores.

## Implementación

- [x] T6 — Traer los diez componentes desde el worktree. (R1)
- [x] T7 — Traer `ui-refs.test.tsx`. (R2)
- [x] T8 — `vitest.config.ts` en la raíz con `exclude` de `.claude/`. (R3)
- [x] T9 — Nota en `sonner.tsx` explicando por qué no lleva `forwardRef`. (R4)

## Cierre

- [x] T10 — Verificar en el lienzo que los disparadores abren anclados.
- [ ] T11 — Retirar el worktree y su rama, ya integrados.
- [ ] T12 — Compuerta y bitácora del día.
