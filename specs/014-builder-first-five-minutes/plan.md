# Plan 014 - Los tres defectos de los primeros cinco minutos

## Resumen

Tres arreglos independientes en el frontend. Ninguno toca el servidor ni el formato en disco, así que
los tres son reversibles por separado y ninguno puede corromper una spec.

## Contexto técnico

**Borrado.** React Flow respeta `deletable: false` por nodo. Las tarjetas de spec nacen en cuatro
sitios (`convert.ts` ×2 —desde el canvas y para specs sin nodo— y `store.ts` ×2 —`addSpecNode` y el
re-añadido del refresco en vivo—), así que la bandera va en los cuatro o el defecto sobrevive por el
camino que se olvide. `onBeforeDelete` explica una vez en vez de dejar la tecla sin respuesta.

**Borradores.** El editor permanece montado y solo cambia de `specId`, así que basta guardar el
borrador saliente antes de re-inicializar. Van en un `Map` a nivel de módulo, no en el store: es
estado transitorio de interfaz que no debe persistirse, ni entrar en deshacer, ni viajar por la red.

**Kanban.** Aprobar exige aprobador y evidencia; convertir eso en un gesto de arrastre socavaría el
argumento del propio producto. El arrastre lleva al formulario. Para eso el drawer necesita poder
abrirse en una pestaña concreta: su pestaña es estado local que se resetea a «resumen», así que entra
un `requestedDrawerTab` en el store que el drawer consume una vez y limpia.

## Fases de implementación

1. `deletable: false` en los cuatro sitios + `onBeforeDelete` con texto en ambos idiomas.
2. Borradores por spec en el editor de secciones, descartados al guardar con éxito.
3. `requestedDrawerTab` en el store, consumido por el drawer.
4. Kanban: solo «aprobada» acepta, y solo mientras se arrastra un borrador; el drop abre la aprobación.
5. Limpieza: las claves de i18n del aviso que deja de existir.

## Dependencias

- Ninguna. Los tres son de frontend y no cambian contratos.

## Hitos

- **H1** — borrar deja de mentir (fase 1).
- **H2** — escribir deja de perderse (fase 2).
- **H3** — arrastrar lleva a algún sitio (fases 3-5).

## Riesgos

- **Un `Map` a nivel de módulo sobrevive al cambio de workspace.** Mitigación: se expone
  `clearSectionDrafts()` para cuando exista el selector de proyectos (spec de multi-carpeta).
- **`deletable: false` en cuatro sitios se desincroniza** si mañana nace un quinto. Mitigación: el
  comentario ancla vive en `store.ts` y los otros tres lo referencian.
- **Quitar destinos de arrastre reduce lo que se puede hacer.** Es deliberado: hoy no hacían nada.
