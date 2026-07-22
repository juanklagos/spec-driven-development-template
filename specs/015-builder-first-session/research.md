# Investigación 015 - La primera sesión del builder

## Hallazgos

1. **El título está a mano y se tira.** La línea 1 de cada `spec.md` lleva el título humano, y
   `listSpecs` ya lee el archivo entero para extraer el estado. Cero I/O adicional.
2. **No existe ruta de consentimiento.** `grep consent` sobre `packages/sdd-mcp/src/api.ts` y
   `builder/src/api.ts` no devuelve nada, mientras `recordUserConsent` está en el core. El builder
   puede aprobar y no puede consentir: la compuerta queda cerrada y la única salida es la terminal.
3. **Un atajo global en toda la aplicación.** Siete manejadores de teclado, todos locales, y ningún
   estado de búsqueda en el store.

## Decisiones derivadas de los hallazgos

1. **El título degrada, nunca falta.** Una tarjeta sin nombre sería peor que un slug.
2. **El id sigue visible.** Es la clave que el usuario escribe en la terminal y en los commits;
   sustituirlo por el título rompería esa continuidad.
3. **El consentimiento exige acción explícita.** Registrarlo como efecto secundario de aprobar
   convertiría dos decisiones en una, que es justo lo que la separación aprobación/consentimiento
   existe para evitar.
4. **El título no se edita aquí.** Reescribir la línea 1 de `spec.md` es cirugía sobre el documento y
   merece su propia decisión.
