# Investigación 038 - Por qué las refs se caen en React 18

## Lo que se leyó en el código (2026-08-20)

### Cobertura actual de `forwardRef`

De los 12 archivos de `builder/src/components/ui/`, solo `button.tsx` lo tiene,
y lo tiene desde el commit `d4e2060`, que arregló un defecto reportado: el menú
de tres puntos de la barra de identidad se abría fuera de pantalla.

Sin `forwardRef`: `accordion`, `badge`, `dialog`, `popover`, `scroll-area`,
`select`, `separator`, `sheet`, `sonner`, `tabs`, `tooltip`.

### La cadena del fallo, ya diagnosticada una vez

`d4e2060` la dejó escrita en `button.tsx`: Radix aparcaba el contenido en
`translate(0px, -200%)` porque el popper no sabía dónde estaba su ancla. El
disparador se monta como `<PopoverTrigger asChild><Button>`; con `asChild`,
Radix entrega su ref al hijo. El `Button` de shadcn era una función simple, sin
`forwardRef`, porque el shadcn actual asume React 19 — donde `ref` viaja como
una prop más. Este proyecto va con React 18.3.1, donde no viaja.

Lo que lo delató fue una comparación: el disparador del gate, que es plano, ya
recibía coordenadas reales (`translate(544px, 927.5px)`) frente al `-200%` del
menú.

### Por qué `sonner.tsx` no entra

Es un envoltorio del `Toaster` de la librería `sonner`, montado directamente en
`App.tsx:464`. No se compone por `asChild` y nada le pasa una ref. Añadirle
`forwardRef` sería ruido sin defecto que prevenir.

### El trabajo ya existe

En `.claude/worktrees/elated-wright-62b638`, sin commitear: los diez
componentes convertidos (338 inserciones, 240 eliminaciones) y
`builder/src/ui-refs.test.tsx`. La prueba se ejecutó allí el 2026-08-20 y pasa.

Su cabecera explica el diseño: monta a la vez todas las superficies —portal,
popper, overlay— y falla ante cualquier `console.error` de React, no solo ante
el aviso de refs. Así cubre el caso que motivó la spec y cualquier otro que
React reporte por consola.

### Por qué la suite completa falla hoy

La raíz no tiene `vitest.config.*`. `npm test` ejecuta `vitest run` con los
valores por defecto, que recorren todo el árbol incluido `.claude/worktrees/`.
Allí encuentra `ui-refs.test.tsx` y no resuelve `jsdom`, porque esa dependencia
está declarada en `builder/package.json` y se instala bajo `builder/`, no en la
raíz. El síntoma —«Cannot find package 'jsdom'»— apunta a una dependencia que
sí existe, en otro sitio.
