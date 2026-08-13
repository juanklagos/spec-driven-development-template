# Investigación 033 - Documentación por tipos

## De dónde sale el problema

Revisión de documentación del 2026-08-12 (cinco frentes en paralelo). El
hallazgo estructural, por encima de los errores puntuales ya corregidos: las
guías mezclan tipos de necesidad dentro del mismo archivo, y por eso crecen
sin criterio y se desactualizan sin que nadie note dónde.

## Estándar externo

- [Diátaxis](https://diataxis.fr/): cuatro necesidades — tutorial, cómo-hacer,
  referencia, explicación — y una tesis verificable: mezclarlas es la causa
  más común de documentación confusa. El caso típico que describe es
  exactamente el de la guía 51: quien escribe un tutorial se pone nervioso
  por lo que el lector no sabe y lo llena de explicación y referencia.
- [Google](https://developers.google.com/style/highlights) y
  [Microsoft](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice)
  ya adoptados en la guía 53 (frases cortas, segunda persona, término
  desarrollado en su primer uso). Diátaxis es la capa que falta: aquellos
  dicen *cómo se escribe una frase*; este dice *qué va en cada documento*.

## Decisiones

- **Decisión: tipar sin renumerar.** Los números son identificadores
  públicos: sidebar, `llms.txt`, `docs/README.md`, enlaces cruzados y las
  redirecciones heredadas de cuando las guías tenían nombre en español.
  Renumerar por tipo rompe todo eso y el coste lo paga el lector que ya tenía
  el enlace. Rechazada la renumeración.
- **Decisión: una sola fuente de la clasificación.** El mismo dato alimenta
  la cabecera del documento y el menú del sitio. Rechazado mantener dos
  listas: es el mismo defecto que ya nos costó «21 herramientas» dos veces.
- **Decisión: cabeceras generadas con marcadores.** 108 archivos.
  Rechazado escribirlas a mano.
- **Decisión: un quinto tipo, «proyecto».** El roadmap, el kit de prensa, la
  auditoría de documentación y las preparaciones de versión no son
  documentación de producto. Rechazado forzarlas dentro de «explicación».
- **Decisión: partir solo la guía 51.** Es la única que mezcla los cuatro
  tipos y la más visitada. Rechazado partir las 54 en una sola spec: el diff
  sería irrevisable y el riesgo de romper enlaces, máximo.
