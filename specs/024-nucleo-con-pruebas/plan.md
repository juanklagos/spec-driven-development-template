# Plan 024 - núcleo con pruebas

## Resumen

Introducir Vitest y escribir el primer suite de pruebas sobre la lógica que
custodia el invariante «el `.md` es la fuente de verdad»: la regla de estado de
`sdd-core`, el convertidor board↔canvas del builder, y el parser EARS. Cerrar la
incoherencia entre la tesis del template y la ausencia de verificación sobre su
propio código.

## Contexto técnico

- El builder ya corre sobre Vite 6 → Vitest encaja sin transpilado extra.
- `packages/` son ESM/TypeScript con `tsc`; Vitest los ejecuta con esbuild sin
  configurar un segundo pipeline.
- No hay ningún runner instalado hoy: `find` no encuentra `*.test.*` ni
  `vitest`/`jest` en ningún `package.json`.
- La raíz ya tiene un script `test` (hoy delega a los smoke); hay que componer,
  no reemplazar, para no perder los smoke que sí verifican el transporte.

## Fases de implementación

1. **Runner.** Añadir `vitest` como devDependency en `builder/` y en `packages/sdd-core/` (el que más lógica pura tiene). Config mínima por proyecto. `npm test` en la raíz orquesta ambos + los smoke actuales.
2. **`sdd-core/board`.** Pruebas de `isApprovedStatus` (variantes `Aprobado/Aprobada/Approved`), `specTone` (incluido el anti-patrón sin aprobar), y paridad de `tone` en `getBoardView`. Es la fase de mayor valor: la divergencia previa fue el bug documentado en la decisión del 2026-07-21.
3. **`builder/convert`.** Round-trip board↔canvas con casos representativos + una propiedad de idempotencia si el modelo lo permite.
4. **`builder/ears`.** Conformes/no conformes en ES y EN.
5. **Espejo.** Prueba que compara `sections.ts` con `sdd-core` para que el «keep in sync» sea mecánico.
6. **Gate + CI.** El gate exige pruebas verdes; workflow de CI las corre por PR.
7. **Docs + prueba de la prueba.** Documentar y demostrar (en history) que una regresión deliberada en `specTone` rompe el suite.

## Dependencias

- Ninguna spec previa la bloquea. Es fundacional para la 025 (que consumirá `ears.ts` con confianza).

## Hitos

- H1: `npm test` corre al menos una prueba verde de `sdd-core`.
- H2: round-trip del convertidor verde.
- H3: gate + CI exigiendo verde.

## Riesgos

- **Monorepo sin workspaces declarados:** orquestar `npm test` a través de `builder/` (que tiene su propio `package-lock`) y `packages/` puede requerir un script raíz que entre a cada carpeta. Mitigación: script explícito, sin asumir npm workspaces.
- **Falso sentido de cobertura:** apuntar solo a la lógica, y decir en el README qué NO se prueba, para no vender más de lo que hay (misma honestidad que el resto del repo).
