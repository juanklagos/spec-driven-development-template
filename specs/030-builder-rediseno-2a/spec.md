# Spec 030 — Rediseño del builder: "2a Terminal claro"

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-11`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Petición directa del autor en sesión de Claude Code (2026-08-11): "ayudame a que quede como se ve" + handoff en ~/Downloads/design_handoff_builder_2a (README, Builder 2a.dc.html, reference_tsx)

## Historia de usuario

Como usuario del SDD Builder (y del SDD Desk que lo sirve), quiero que la interfaz siga el rediseño "2a Terminal claro" entregado en `design_handoff_builder_2a`, para que la chrome tenga jerarquía clara (cuatro franjas), la compuerta SDD sea visible de forma permanente y la herramienta se lea como una herramienta de programación.

## Contexto

Handoff de diseño: `~/Downloads/design_handoff_builder_2a/` — README con valores exactos, prototipos `.dc.html` (el diseño a implementar es `Builder 2a.dc.html`; `1a` en `Builder Rediseño.dc.html` es la referencia del modo oscuro) e implementaciones TSX de referencia escritas contra el store e i18n reales.

## Requisitos

- R1 — Tokens y tipografía: paleta 2a en `styles.css` (claro exacto del prototipo + oscuro derivado de la variante 1a), IBM Plex Sans/Mono desde Google Fonts en `index.html`, sombras de una capa, escala de radios apretada.
- R2 — Renombrado "Lienzo" → "Grafo" en es/en (solo copy; `viewMode: "canvas"`, `BoardCanvas`, `board.canvas` y demás identificadores NO se tocan) + claves i18n nuevas del rediseño.
- R3 — Chrome de cuatro franjas: `IdentityBar` (46px), `ContextStrip` (34px, conmutador de vista + chips de filtro + meta), `Rail` (246px, añadir + navegador de specs/), `GateStatusBar` (30px, veredicto + detalle + regla siempre visible). `TopBar.tsx` y `Palette.tsx` se eliminan. Todo lo desplazado (PNG, informes, bitácora, asistente, plantillas, tour, idioma, dashboard, guardar) vive en ⌘K y en el menú `⋯`.
- R4 — Tarjetas: `SpecNode` con jerarquía nueva (título dominante, estado punto+palabra, avisos legibles `dep`/`deriva N`/`N error`, barra de 2px, pie con puntaje `C · 68` cacheado en el store), `NoteNode` con espina izquierda y cabecera de tipo, kanban de columnas a sangre con hairlines y zona de soltar explicada.
- R5 — Drawer 560px: cabecera nueva, pestañas subrayadas en minúscula, bloque de bloqueo/desbloqueo de implementar con los motivos reales, panel de puntaje con grado grande, lint EARS con espinas de color y motivo que nombra la palabra, barra inferior fija de guardado, pestaña de aprobación con el bloque de consentimiento explicado, relaciones con espinas y aviso en flujo.
- R6 — ⌘K promovida: acciones agrupadas antes que specs, filas con icono/atajo, pie de atajos, y todas las acciones desplazadas de la TopBar.
- R7 — Estados y overlays sin emojis en chrome: estado vacío con cabecera de terminal y ruta de terminal copiable, pantalla sin conexión que dice que nada se perdió, asistente con propuesta editable y CTA con número, tour con progreso en cabecera y barras, plantillas con aviso de workspace no vacío, bitácora con ruta visible, implementar con chips de precondición.
- R8 — Estado nuevo en el store: `scores`, `filters`, `zoom`, `drawerTab`, `paletteOpen`; atajos I/E/S; clic en fila del rail centra el nodo.

## Criterios de aceptación (EARS)

- CUANDO el builder carga con specs en disco, EL SISTEMA DEBERÁ mostrar las cuatro franjas (46/34/rail 246/30 px) sin que ninguna se envuelva a dos filas.
- CUANDO `gate.verdict` cambie, EL SISTEMA DEBERÁ teñir la GateStatusBar (verde/ámbar/rojo) y mantener la regla "no hay código sin spec aprobada" visible en menos de 1 s (role="status", aria-live="polite").
- CUANDO el usuario pulse I, E o S fuera de un input, EL SISTEMA DEBERÁ colocar Idea/Épica/Spec en el centro del viewport.
- CUANDO el usuario active un chip de filtro, EL SISTEMA DEBERÁ atenuar a opacidad 0.35 los nodos que no cumplen sin ocultarlos.
- CUANDO se carguen los specs del board, EL SISTEMA DEBERÁ cachear los puntajes y pintar `grado · puntaje` en el pie de cada tarjeta sin abrir el drawer.
- MIENTRAS una spec no esté aprobada, EL SISTEMA DEBERÁ mostrar en su pestaña resumen el bloque de bloqueo con las condiciones reales que fallan y un botón "Ir a aprobación".

## Fuera de alcance

- Cambios de servidor/API o del formato JSON Canvas.
- Cambios en el dashboard, el sitio o el desk (el desk hereda el builder servido).
- Nuevas dependencias de UI más allá de lucide-react ya presente.
