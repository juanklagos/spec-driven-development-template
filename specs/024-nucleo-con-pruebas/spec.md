# Especificación 024 - núcleo con pruebas

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-23`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-23 — tras la evaluación del builder y la creación de las specs 024/025, el propietario autorizó la implementación con «arranca». Consentimiento registrado en `.sdd/user-consent.log`.

## Objetivo / Objective

Dotar a la lógica de dominio del builder y de `sdd-core` de pruebas automatizadas que fallen cuando se rompe el invariante «el `.md` es la fuente de verdad», y exigirlas en el gate y en CI. / Give the builder's and `sdd-core`'s domain logic automated tests that fail when the "the `.md` is the source of truth" invariant breaks, and enforce them in the gate and CI.

## Historia de usuario principal

Como autor de un template cuya tesis es *"criterios verificables antes de código"*, quiero que **el código que custodia el invariante «el `.md` es la fuente de verdad» tenga pruebas automatizadas que fallen cuando ese invariante se rompe**, para que el producto cumpla con su propio código la disciplina que le exige a sus usuarios.

## Contexto observado (no hipotético)

Auditoría 2026-07-23: `find builder/src packages/*/src -name '*.test.*'` devuelve **cero** archivos. La única verificación ejecutable son los smoke scripts de `scripts/` (arranque del server, tarball, stdio silencioso), que prueban el transporte, **no** la lógica. Mientras tanto:

- `builder/src/convert.ts` (219 líneas) traduce board ↔ markdown en ambos sentidos: es exactamente la frontera donde una regresión corrompe las specs del usuario en disco.
- `builder/src/store.ts` (599 líneas) orquesta el estado y las llamadas al API.
- `builder/src/ears.ts` (62 líneas) parsea los criterios EARS que la spec 025 y el puente a specs ejecutables van a consumir.
- `packages/sdd-core/src/board.ts` contiene `specTone`/`isApprovedStatus`, la regla única de estado cuya divergencia previa *"sobrevivió tres releases de features sin que nadie la notara"* (`bitacora/decisiones/2026-07-21-una-sola-regla-de-estado-de-spec.md`). Esa regla hoy no tiene una sola prueba que la fije.

La incoherencia es la más visible del proyecto: el hard stop del template bloquea código sin criterios verificables, y el propio código del template no tiene ninguno ejecutable sobre su lógica.

## Escenarios de aceptación

1. Dado un board con notas, specs y edges, cuando se convierte a `board.canvas` y de vuelta a modelo, entonces el resultado es igual al original (round-trip estable), y una prueba lo verifica.
2. Dado un `spec.md` con estado `Aprobada` y todas las tareas marcadas, cuando se calcula `specTone`, entonces devuelve `ok` (aprobada) y **nunca** `done` sin aprobación previa — la prueba cubre explícitamente el anti-patrón «casillas marcadas sin aprobar».
3. Dado un bloque de criterios EARS bien y mal formados, cuando `ears.ts` los parsea, entonces reconoce los válidos y señala los inválidos, verificado por prueba.
4. Dado el suite de pruebas, cuando se ejecuta `npm test` en la raíz, entonces corre las pruebas de `sdd-core` y del builder, y el gate SDD las exige verdes antes de aprobar cualquier spec futura.
5. Dado CI, cuando entra un cambio a `main`, entonces las pruebas corren y un fallo bloquea el merge (sin regresión de los smoke ya existentes).

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se convierta un board a `board.canvas` y de vuelta, EL SISTEMA DEBERÁ preservar nodos, texto, colores y edges sin pérdida, y una prueba property-based o de ejemplos representativos DEBERÁ verificarlo.
- CUANDO una spec no esté aprobada, EL SISTEMA DEBERÁ devolver `tone` distinto de `done` sin importar cuántas tareas estén marcadas, y una prueba DEBERÁ fijar ese caso.
- CUANDO `ears.ts` reciba un criterio sin la estructura CUANDO/EL SISTEMA DEBERÁ (o WHEN/SHALL), EL SISTEMA DEBERÁ marcarlo como no conforme.
- EL SISTEMA DEBERÁ ejecutar todas las pruebas con un solo comando (`npm test`) y en CI.
- SI el bundle del builder mantiene un espejo de `isApprovedStatus` (hoy `builder/src/sections.ts`), ENTONCES una prueba DEBERÁ comparar espejo y original para que no diverjan en silencio.

## Requisitos

- R1. Elegir e instalar el runner. **Recomendado: Vitest**, por afinidad nativa con Vite (el builder ya lo usa) y con ESM/TypeScript de `packages/`. Cero configuración de transpilado extra.
- R2. Pruebas de `packages/sdd-core/src/board.ts`: `specTone`, `isApprovedStatus`, `getBoardView` (paridad de `tone`). Es la regla más cara si se rompe.
- R3. Pruebas de `builder/src/convert.ts`: round-trip board ↔ canvas, incluyendo edges tipados y notas de épica.
- R4. Pruebas de `builder/src/ears.ts`: conformes / no conformes, ES y EN.
- R5. Prueba del espejo `sections.ts` ↔ `sdd-core` (el comentario *"keep in sync"* pasa de promesa a verificación).
- R6. `npm test` en la raíz agrega los suites; el gate SDD (`scripts/check-sdd-gate.sh` o su equivalente) los exige antes de aprobar.
- R7. CI: workflow que corre las pruebas por push/PR a `main`, sin quitar los smoke actuales.
- R8. Documentar en `builder/README.md` y `packages/*/README.md` cómo correr y añadir pruebas.

## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)

- Para todo board `b`: `fromCanvas(toCanvas(b))` es equivalente a `b` bajo la relación de igualdad del modelo (round-trip idempotente).
- Para toda spec `s`: si `s.status` no es aprobado, entonces `specTone(s) ≠ "done"`, para cualquier conjunto de tareas.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/*.test.ts` — nuevas pruebas de la lógica de dominio
- `builder/src/**/*.test.ts` — nuevas pruebas del convertidor, store y EARS
- `builder/package.json`, `packages/*/package.json`, raíz `package.json` — script `test` y dependencia del runner
- `.github/workflows/` — corrida de pruebas en CI
- `sdd.policy.yaml` — si el gate debe exigir pruebas verdes

## Fuera de alcance / Out of scope

- Cobertura del 100 %: se apunta a la lógica que custodia el invariante, no a los componentes de presentación.
- Pruebas E2E de navegador (Playwright): candidatas a una spec futura, no a esta.
- Reescribir código para hacerlo testeable más allá de extracciones mínimas y justificadas.

## Criterios de éxito

- `npm test` verde en local y CI, cubriendo `board`, `convert`, `ears` y el espejo.
- Una regresión introducida a propósito en `specTone` (devolver `done` sin aprobación) hace fallar una prueba — demostrado en el `history.md` de cierre.
- El gate SDD rechaza aprobar una spec si las pruebas están rojas.
