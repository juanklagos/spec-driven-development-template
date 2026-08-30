# Tareas 043 - El template puede usar sus propias herramientas sobre sí mismo

> Orden TDD: las pruebas de cada fase van antes que su implementación.

## Fase 1 — La red (R4)

- [x] Crear `packages/sdd-core/src/workspace.test.ts` con un template simulado y un proyecto externo
- [x] Prueba: `ensureProjectRootAllowed` rechaza la raíz del template
- [x] Prueba: rechaza una ruta dentro del paquete instalado en `node_modules`
- [x] Prueba: rechaza una ruta dentro del template que no cuelga de `www/`
- [x] Prueba: acepta una ruta bajo `www/` y una ruta externa
- [x] Prueba: `resolveSddRoot` sobre la raíz del template — escrita primero contra el comportamiento actual (rojo) y luego invertida en la fase 2
- [x] Verificar que `npm run test:unit` sigue en verde

## Fase 2 — Mover la regla (R1, R2)

- [x] Prueba: `resolveSddRoot` sobre la raíz del template devuelve esa raíz
- [x] Prueba: `createWorkspace` con la raíz del template como destino sigue rechazando
- [x] Prueba: `installSidecar` con la raíz del template como destino sigue rechazando
- [x] Prueba: el descubrimiento heredado sobre la raíz del template sigue rechazando
- [x] Prueba: `scoreSpec` y `generateStatus` funcionan sobre la raíz del template
- [x] Quitar `ensureProjectRootAllowed` de `resolveSddRoot`
- [x] Añadir la llamada explícita en `createWorkspace` y en `installSidecar`
- [x] Comprobar que `legacy.ts:50` ya la tiene y dejar constancia en el comentario
- [x] Comentario en `ensureProjectRootAllowed` que diga qué política impone y quién debe llamarla

## Fase 3 — El script y el cierre (R3)

- [x] Alinear el bloqueo de `scripts/new-spec.sh` — al mirarlo, su condición sólo podía ser cierta para la raíz del template, así que el bloque se retira entero con el porqué escrito; no había «demás casos» que conservar
- [x] Verificación de punta a punta: crear una spec de prueba en este repositorio con el script y borrarla
- [x] Regenerar `STATUS.md` desde este repositorio, ya sin espejo
- [x] Añadir a `RELEASING.md` el paso de regenerar `STATUS.md`
- [x] Entrada en `CHANGELOG.md`
- [x] Actualizar `history.md` de esta spec
- [x] Ejecutar `./scripts/validate-sdd.sh . --strict` y `./scripts/check-sdd-gate.sh .`
