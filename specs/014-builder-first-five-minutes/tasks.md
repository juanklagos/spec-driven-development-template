# Tareas 014 - Los tres defectos de los primeros cinco minutos

## H1 — Borrar deja de mentir

- [x] **T1a** `deletable: false` en los cuatro sitios donde nace una tarjeta de spec.
- [x] **T1b** `onBeforeDelete` que filtra las specs y explica una vez, con texto ES/EN.
- [x] **T1c** Comprobar que las notas siguen borrándose.

## H2 — Escribir deja de perderse

- [x] **T2a** Borradores por spec en `SectionEditor`, guardados al salir y restaurados al volver.
- [x] **T2b** El borrador se descarta cuando el guardado termina bien.
- [x] **T2c** `clearSectionDrafts()` expuesto para el futuro cambio de workspace.

## H3 — Arrastrar lleva a algún sitio

- [x] **T3a** `requestedDrawerTab` en el store; el drawer lo consume una vez y lo limpia.
- [x] **T3b** Solo «aprobada» acepta, y solo mientras se arrastra un borrador.
- [x] **T3c** El drop abre el formulario de aprobación. Nunca aprueba.
- [x] **T3d** Quitar las claves de i18n del aviso que ya no existe.

## Verificación de cierre

- [x] `npx tsc --noEmit` y `npm run build` del builder en verde.
- [x] Los cuatro scripts SDD en 0 errores.
- [x] `npm run mcp:test` y `npm run mcp:pack:smoke` en verde.
- [x] Comprobado en navegador: Suprimir sobre spec explica y no borra; sobre nota sí borra; el texto
      sin guardar sobrevive al cambio de spec; el arrastre a «aprobada» abre el formulario.
