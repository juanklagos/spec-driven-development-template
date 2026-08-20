# Especificación 038 - Las refs de shadcn en React 18

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-20`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobado en sesión del 2026-08-20: generalizar a los demás componentes de `ui/` el arreglo que la 2.6.0 publicó solo para `button.tsx` (commit `d4e2060`), con la prueba de regresión que impide que vuelva, sobre el hallazgo medido en `research.md`.

## Objetivo

Que ningún componente de `builder/src/components/ui/` vuelva a tirar la ref en
silencio. El commit `d4e2060` arregló `button.tsx` porque el menú de tres
puntos se abría fuera de pantalla; los otros diez componentes que Radix compone
por `asChild` tienen el mismo defecto esperando.

## Historia de usuario principal

Como persona que usa el lienzo, quiero que los menús, diálogos, selects y
tooltips aparezcan donde los abro, y no dos pantallas por encima del borde
superior.

## Contexto (medido, no supuesto)

Leído en el código el 2026-08-20:

- **El defecto ya se manifestó una vez.** `d4e2060` documenta la cadena: Radix
  dejaba el contenido en `translate(0px, -200%)`, que es donde aparca un popper
  que no ha podido posicionarse porque no sabe dónde está su ancla. El
  disparador se monta como `<PopoverTrigger asChild><Button>`, y con `asChild`
  Radix entrega su ref al hijo.
- **La causa es una diferencia de versión.** El shadcn actual asume React 19,
  donde `ref` viaja como una prop más. Este proyecto va con React 18.3.1
  (`builder/package.json`), donde no viaja: la ref se cae sin aviso, el ancla
  queda a `null` y Floating UI nunca llega a medir nada.
- **El arreglo publicado cubre un solo componente.** De los 12 archivos de
  `builder/src/components/ui/`, solo `button.tsx` tiene `forwardRef`. Los otros
  once no.
- **De esos once, diez lo necesitan**: `accordion`, `badge`, `dialog`,
  `popover`, `scroll-area`, `select`, `separator`, `sheet`, `tabs` y `tooltip`.
  Radix compone refs a través de ellos vía `Slot`/`Presence` para anclar el
  popper, mover el foco y bloquear el scroll.
- **`sonner.tsx` queda fuera a propósito.** Es un envoltorio del `Toaster` de
  terceros, montado directamente en `App.tsx:464` y nunca a través de
  `asChild`. Nada compone una ref por él.
- **El trabajo existe y está verde**, sin integrar, en el worktree
  `.claude/worktrees/elated-wright-62b638`: los diez componentes más
  `builder/src/ui-refs.test.tsx`, que monta a la vez todas las superficies
  (portal, popper, overlay) y falla ante cualquier `console.error` de React.
- **La raíz no tiene configuración de vitest.** `npm test` ejecuta `vitest run`
  con los valores por defecto, así que recorre `.claude/worktrees/` y allí no
  resuelve `jsdom` — declarado en `builder/package.json`, no en la raíz. Es la
  causa del único archivo que falla hoy en la suite completa.

## Escenarios de aceptación

1. Dado el lienzo abierto, cuando pulso cualquier disparador `asChild` de los
   diez componentes, entonces el contenido aparece anclado a su disparador.
2. Dado alguien que revendoriza `ui/` con `npx shadcn add`, cuando ejecuta las
   pruebas, entonces `ui-refs.test.tsx` falla antes de que el defecto llegue al
   usuario.
3. Dada la suite completa desde la raíz, cuando ejecuto `npm test`, entonces no
   se recorre `.claude/` y ningún archivo falla por dependencias no resueltas.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO un componente de `ui/` reciba una ref, EL SISTEMA DEBERÁ reenviarla al
  elemento del DOM correspondiente.
- SI React emite un aviso de ref sobre un componente función, ENTONCES EL
  SISTEMA DEBERÁ fallar la prueba de regresión.
- CUANDO se ejecute `npm test` desde la raíz, EL SISTEMA DEBERÁ excluir
  `.claude/` del descubrimiento de pruebas.

## Requisitos

- R1 — `forwardRef` en los diez componentes que lo necesitan, con el porqué
  documentado una sola vez (en `button.tsx`) y referenciado desde los demás.
- R2 — `builder/src/ui-refs.test.tsx` como guarda de regresión, montando todas
  las superficies y fallando ante cualquier `console.error` de React.
- R3 — Configuración de vitest en la raíz que excluya `.claude/`.
- R4 — `sonner.tsx` queda sin `forwardRef`, y la razón queda escrita.

## Ámbito de archivos / File scope

- `builder/src/components/ui/` — los diez componentes
- `builder/src/ui-refs.test.tsx` — la prueba de regresión
- `vitest.config.ts` — configuración de la raíz

## Criterios de éxito

- Once de los doce componentes reenvían refs; el doceavo documenta por qué no.
- La suite completa desde la raíz en verde, sin archivos que no cargan.
- El defecto de `d4e2060` no puede reaparecer sin poner una prueba en rojo.
