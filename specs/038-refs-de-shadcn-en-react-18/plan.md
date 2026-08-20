# Plan 038 - Las refs de shadcn en React 18

## Resumen

Integrar trabajo que ya existe y está verificado, no escribirlo de cero. Los
diez componentes y su prueba viven en el worktree
`.claude/worktrees/elated-wright-62b638`; la prueba pasa allí. El plan es
traerlos, añadir la configuración de vitest que falta en la raíz y verificar en
el árbol principal.

## Contexto técnico

- React 18.3.1: `ref` no es una prop más. Un componente función sin
  `forwardRef` la descarta en silencio.
- Radix la usa para tres cosas distintas: anclar el popper (Floating UI), mover
  el foco al abrir y bloquear el scroll del cuerpo. Los tres fallan callados.
- `builder/package.json` ya declara `jsdom` como dependencia de desarrollo; lo
  que falta es que la raíz no recorra `.claude/`.
- El porqué largo ya está escrito en `button.tsx` (commit `d4e2060`). Los demás
  componentes lo referencian en lugar de repetirlo.

## Restricciones

- No se cambia la API pública de ningún componente: solo se envuelve en
  `forwardRef` y se reenvía la ref.
- No se toca `sonner.tsx`: no lo compone Radix.
- No se actualiza React ni shadcn. Eso sería otra spec, con otro riesgo.

## Fases de implementación

1. **Traer** los diez componentes y la prueba desde el worktree.
2. **Configurar** vitest en la raíz con el `exclude` de `.claude/`.
3. **Verificar**: prueba de regresión, suite completa, typecheck y build.
4. **Comprobar en el producto** que los disparadores siguen funcionando.
5. **Retirar** el worktree, ya sin trabajo único que perder.

## Dependencias

- Ninguna externa. `jsdom` ya está declarado en `builder/package.json`.

## Hitos

- H1: los once componentes que lo necesitan reenvían refs (fin de fase 1).
- H2: `npm test` desde la raíz en verde sin archivos que no cargan (fase 3).

## Riesgos

- **Que la prueba solo cubra el montaje y no el anclaje real.** Mitigación:
  falla ante cualquier `console.error` de React, que es donde aparece el aviso
  de ref; y la verificación de fase 4 abre los disparadores de verdad.
- **Que el worktree esté desincronizado del árbol principal.** Mitigación:
  comparar antes de traer y compilar después.
- **Perder el trabajo al retirar el worktree.** Mitigación: la fase 5 va
  después de que todo esté commiteado y verificado, nunca antes.
