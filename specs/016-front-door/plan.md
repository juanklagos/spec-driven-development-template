# Plan 016 - La puerta de entrada

## Resumen

Cinco arreglos independientes en la ruta que recorre un desconocido. Ninguno toca `sdd-core` ni el
protocolo: el barrido confirmó que esa mitad está bien.

## Contexto técnico

**La tubería que aborta.** `grep` devuelve 1 cuando no encuentra nada, y bajo `set -euo pipefail` eso
mata el script sin mensaje. Un `|| true` alrededor de la tubería basta y no cambia el conteo.

**Idea y bitácora vacías.** Va junto a `sdd_write_empty_spec_index` en `sdd-scaffold.sh`: misma razón
de cambio, la forma de un workspace recién creado.

**El aviso que sí se dispara.** Necesita una señal que distinga «mi consentimiento» de «el que venía
en la copia». `TEMPLATE_VERSION` ya guarda `installed_at`: un consentimiento **anterior** a la
instalación del workspace no puede ser del usuario. Preciso, se mantiene solo, y degrada a silencio
cuando no hay sello — que es el caso del propio repositorio del template, y no debe acusarse a sí
mismo. Depende de que el sello llegue a git, así que ese arreglo va primero.

## Fases de implementación

1. `TEMPLATE_VERSION` fuera del ignorado y escrito por los dos andamiadores.
2. El aviso de consentimiento heredado, apoyado en `installed_at`.
3. La tubería de `validate-sdd.sh`.
4. Idea y bitácora vacías en los andamiadores.
5. `demo.tape` andamiando antes de ejecutar, y regeneración por CI.

## Dependencias

- La fase 2 depende de la 1: sin sello versionado no hay señal.

## Hitos

- **H1** — la compuerta deja de certificar aprobaciones ajenas (fases 1-2).
- **H2** — los comandos de la documentación funcionan (fases 3-4).
- **H3** — la portada muestra un flujo que termina bien (fase 5).

## Riesgos

- **Comparar fechas en bash es frágil.** Mitigación: comparación de cadenas ISO-8601, que ordenan
  lexicográficamente, sin aritmética de fechas.
- **Un sello ausente no debe acusar.** Mitigación: sin `installed_at` legible, silencio.
- **El GIF solo se puede regenerar en CI** (no hay vhs aquí). Mitigación: revisar un fotograma tardío
  antes de dar por bueno el resultado.
