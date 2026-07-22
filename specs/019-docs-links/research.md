# Investigación 019 - Los enlaces entre guías

## Hallazgos

1. **140 enlaces rotos en 54 archivos, sobre 19 rutas distintas.** Medido recorriendo el contenido
   sincronizado y comprobando contra el disco cada ruta de GitHub. Las dos peores se repiten 34 veces
   cada una: `docs/19-prompt-matrix-by-goal` y `docs/26-validated-prompt-bank`.

2. **70 enlaces a GitHub del mismo lote sí resuelven.** El defecto no está en la regla general en sí,
   que hace bien su trabajo con los enlaces que le corresponden.

3. **La cadena se muerde la cola.** La regla de guías produce `](../<slug>/)` y la regla general
   vuelve a capturar esa misma salida. Reproducido sobre `docs/es/00-introduccion.md:31`:
   `](./19-matriz-prompts-por-objetivo.md)` acaba en `blob/main/docs/19-prompt-matrix-by-goal/`.

4. **La regla cruzada sobrevive por casualidad.** Su salida también la captura la regla general, pero
   `normalize(join('docs', locale, '../../../en/guides/…'))` se sale del repositorio y la guarda
   `if (resolved.startsWith('..')) return m` la devuelve intacta. Esa guarda se escribió para enlaces
   que apuntan fuera del repositorio, no para proteger reescrituras.

## Decisiones, y por qué

- **Apartar y devolver, en vez de reordenar reglas.** Reordenar solo mueve el destrozo: si la regla
  general va primero, se come los `./NN-guia.md` antes de que la regla de guías los vea. Apartar hace
  que el orden deje de importar.

- **Apartar también la regla cruzada.** Hoy no hace falta. Se hace igual porque depender de que una
  ruta se salga del repositorio es una trampa esperando a que alguien cambie la profundidad del
  enlace.

- **Ampliar la verificación, no solo arreglar el defecto.** La referencia es el historial de la spec
  017, que declaró «cero enlaces internos rotos» y era cierto y a la vez insuficiente: el barrido solo
  miraba enlaces absolutos que empezaban por la base del sitio. Un defecto que la verificación no
  puede ver, vuelve.
