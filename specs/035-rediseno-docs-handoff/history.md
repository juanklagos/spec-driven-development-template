# Historial 035 - Rediseño de la documentación (handoff)

- 2026-08-17 — Creación. Origen: el propietario entregó un handoff de diseño
  en `design_handoff_docs_redesign/` y pidió revisarlo a fondo antes de
  implementar. La revisión verificó sus afirmaciones una a una (ver
  `research.md`): conteos y salida del script correctos, dos cifras de
  contraste incorrectas, y un defecto que el handoff sí vio y la spec 034 no
  — el badge de tipo publicado falla WCAG AA. Se añade un hallazgo propio: la
  medida `68ch` deja de significar 68 caracteres al pasar a una familia
  proporcional. La decisión de añadir la sans la toma el propietario, en las
  condiciones que la propia spec 034 dejó escritas.

- 2026-08-17 — Implementada, T1-T10. Dos correcciones del propio proceso:
  **La primera medición de esta revisión estaba mal.** Acusé al handoff de dar
  dos cifras falsas de contraste; las había medido contra el fondo de página
  cuando los avisos viven sobre `--sdd-card`. Medidos donde tocaba, sus
  números eran correctos (2.93:1 el ámbar, 3.30:1 el verde). El fondo es parte
  del par: medir contra otro es medir otra cosa. Corregido en `research.md`.
  **El cálculo de la medida también estaba mal.** Predije que 58ch daría unos
  68 caracteres; medido en el navegador daban 77. En IBM Plex Sans el «0» mide
  9.6px y la letra media 7.12px — ratio 0.74, no el 0.83 que supuse. Con 50ch
  salen 67, dentro del rango. Por eso el R4 exige contar, no calcular.
  Construido: variantes `-text` de los cuatro semánticos, verde de enlace a
  `accent-high` en claro, IBM Plex Sans auto-hospedada (45 KB, OFL, sin
  dependencia en `node_modules`), reparto sans/Quattro por rol, cuerpo a 17px,
  cabecera de tipo como franja entre reglas, contadores en el menú desde
  `GUIDE_TYPES`, y el hero con la salida literal del script incluido su
  `[WARN]` real.
  Verificado: los 13 pares de color cumplen AA (`npm run docs:contrast`), 67
  caracteres por línea medidos en vivo, prosa en Plex y código en Quattro
  comprobados en el DOM, 10 líneas de terminal con su aviso y su cierre
  bilingüe, cero peticiones externas, builder intacto y cero enlaces rotos en
  las tres superficies.

## 2026-08-17 — Segunda vuelta: menú, descarga y documentación caducada

- El propietario rechazó el menú entregado: el contador se había resuelto
  pegando `· N` a la etiqueta, no como pedía el handoff. Al reabrirlo apareció
  un defecto mayor —dos taxonomías pintadas a la vez, con «Referencia»
  significando dos cosas distintas en la misma fila— y 11 títulos con emoji.
  Corregido en T11 y T12.
- `/download/` se reescribe: el builder en el navegador pasa a ser la ruta
  recomendada. Decisión en `bitacora/decisiones/2026-08-17-builder-en-navegador-como-ruta-recomendada.md`.
- Tres guías describían un estado inexistente (T14, T15). Decisión en
  `bitacora/decisiones/2026-08-17-una-sola-lista-de-release.md`.
- Enlazar por primera vez a las guías 39 y 46 destapó que `sync-docs` reescribía
  los enlaces con el nombre del archivo y no con el slug con el que Astro los
  sirve, que borra los puntos. `check-doc-links` no lo veía porque solo miraba
  los `href` absolutos. Los dos corregidos en T16; el verificador se comprobó
  fallando antes de arreglar el origen.
- 2026-08-20 — Evidencia de aprobación reescrita: registra qué se aprobó y contra qué fuente, sin transcribir el chat. No cambia qué se aprobó, quién ni cuándo (spec 037).
