# Especificación 043 - El template puede usar sus propias herramientas sobre sí mismo

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-30`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobada en sesión del 2026-08-30 contra este `spec.md` de esa misma fecha: mover la guarda de proyecto destino fuera de `resolveSddRoot` y aplicarla explícitamente en `createWorkspace`, `installSidecar` y el descubrimiento heredado, más el bloqueo equivalente de `scripts/new-spec.sh`, con los cuatro requisitos R1-R4 y las tres fases del plan. Origen: los cuatro bloqueos medidos al implementar la spec 042 y el hallazgo G.3 de `idea/IDEAS_BUILDER_V4_2026-08-30.md`. Quedan fuera por decisión explícita: relajar la política `do_not_implement_in_template_root` de `sdd.policy.yaml`, cambiar que los proyectos dentro del template vivan bajo `www/`, y automatizar la regeneración de `STATUS.md` en cada release.

## Objetivo

Que este repositorio pueda crear sus specs, puntuarlas y regenerar sus informes
con sus propias herramientas, igual que cualquier proyecto que lo use.

Hoy no puede: una única guarda pensada para impedir que se scaffoldeen
*proyectos destino* en la raíz del template está puesta en el punto por el que
pasa **todo**, incluidas las funciones que sólo leen.

## Historia de usuario principal

Como persona que mantiene este template, quiero crear una spec con
`./scripts/new-spec.sh`, ver su puntuación y regenerar `STATUS.md` sin salir del
repositorio ni montar un workspace de mentira, para que el template se use a sí
mismo y sus defectos salgan aquí antes que en el proyecto de alguien.

## Contexto (medido, no supuesto)

Medido el 2026-08-30 sobre `main` en `a934896`, durante la implementación de la
spec 042. Los cuatro casos son de esa sesión, no hipotéticos.

- **La guarda está en el choke point de lectura.**
  `packages/sdd-core/src/workspace.ts:170-172`: `resolveSddRoot` llama a
  `ensureProjectRootAllowed(root)` antes de nada, y esa función lanza
  «Project root cannot be the template root itself» cuando la ruta es la raíz
  del template (`workspace.ts:112-114`).

  `resolveSddRoot` es la puerta de 25 llamadas en `sdd-core` y `sdd-mcp`:
  `listSpecs`, `scoreSpec`, `generateStatus`, `generateRoadmap`, `getBoardView`,
  la bitácora, la cola de peticiones, la política y el resto. Todas quedan
  bloqueadas, incluidas las que sólo leen.

- **Consecuencias reales, medidas el mismo día:**

  | Herramienta | Qué pasó |
  |---|---|
  | `./scripts/new-spec.sh` | «Error: refusing to create spec in template root». La spec 042 se creó a mano |
  | `sdd_create_spec` / `POST /api/spec` | mismo rechazo, por `workspace.ts:114` |
  | `generateStatus()` | mismo rechazo. `STATUS.md` llevaba desde el 2026-08-13 y le faltaban 8 specs |
  | `scoreSpec()` | mismo rechazo. La 042 se puntuó copiando el bundle a un workspace de usar y tirar |

- **Y sin embargo el template ES un proyecto SDD.** Tiene 42 specs en `specs/`,
  su `specs/INDEX.md`, su `bitacora/` con 35 decisiones y su `STATUS.md`
  versionado en git — un fichero que sólo tiene sentido si algo lo regenera.
  El propio `sdd.policy.yaml` declara `gates.required_order` y
  `validate_commands` para este repositorio.

- **La guarda protege algo distinto de lo que bloquea.** `sdd.policy.yaml`
  dice `do_not_implement_in_template_root: true`, y eso es una regla sobre
  *dónde vive el código de un proyecto destino*. `createWorkspace`
  (`index.ts:103`) e `installSidecar` (`index.ts:166`) son las operaciones que
  materializan un proyecto destino, y `legacy.ts:50` ya llama a la guarda por su
  cuenta. Ninguna de las tres necesita que la guarda esté además dentro de
  `resolveSddRoot`.

- **El rechazo tampoco distingue leer de escribir.** `sdd_board_read`, que no
  escribe nada, está tan bloqueado como `createWorkspace`.

## Decisiones que esta spec fija

1. **La guarda se mueve, no se elimina.** Sigue prohibiendo materializar un
   proyecto destino en la raíz del template. Lo que deja de hacer es prohibir
   leer y mantener el propio template.
2. **El sitio de la regla son las operaciones que crean un workspace o un
   sidecar**, no la resolución de la raíz SDD.
3. **Ninguna otra ruta se relaja.** Las reglas sobre `node_modules` y sobre
   «los proyectos dentro del template van bajo `www/`» siguen intactas.

## Escenarios de aceptación

1. Dado este repositorio, cuando ejecuto `./scripts/new-spec.sh "una-cosa"`,
   entonces se crea `specs/044-una-cosa/` con sus cinco documentos y su fila en
   `specs/INDEX.md`.
2. Dado este repositorio, cuando pido la puntuación de una spec, entonces la
   obtengo sin copiar nada a otro sitio.
3. Dado este repositorio, cuando regenero `STATUS.md`, entonces se escribe con
   las filas de `specs/INDEX.md` y los recuentos reales de tareas.
4. Dado este repositorio, cuando intento crear un workspace de proyecto destino
   en su raíz, entonces sigue rechazándose con el mensaje de hoy.
5. Dado este repositorio, cuando intento instalar el sidecar `spec/` en su raíz,
   entonces sigue rechazándose.
6. Dado un proyecto destino cualquiera fuera del template, cuando uso cualquier
   herramienta, entonces se comporta exactamente igual que antes de esta spec.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria

- CUANDO se resuelva la raíz SDD de un directorio, EL SISTEMA NO DEBERÁ
  rechazarla por ser la raíz del template.
- CUANDO se pida crear un workspace de proyecto destino en la raíz del template,
  EL SISTEMA DEBERÁ rechazarlo con el mismo mensaje que hoy.
- CUANDO se pida instalar el sidecar `spec/` en la raíz del template, EL SISTEMA
  DEBERÁ rechazarlo con el mismo mensaje que hoy.
- CUANDO se pida el descubrimiento de un proyecto heredado sobre la raíz del
  template, EL SISTEMA DEBERÁ seguir rechazándolo.
- CUANDO se cree una spec desde la raíz del template, EL SISTEMA DEBERÁ crear el
  paquete completo y añadir su fila al índice.
- CUANDO se pida un informe —puntuación, `STATUS.md` o roadmap— desde la raíz
  del template, EL SISTEMA DEBERÁ producirlo leyendo los ficheros de ese mismo
  repositorio.
- SI la ruta pedida está dentro del paquete instalado en `node_modules`,
  ENTONCES EL SISTEMA DEBERÁ seguir rechazándola.
- SI la ruta pedida está dentro del template pero fuera de `www/`, y la
  operación es crear un workspace, ENTONCES EL SISTEMA DEBERÁ seguir
  rechazándola.

## Requisitos

- R1. `resolveSddRoot` deja de aplicar la política de proyecto destino.
- R2. `createWorkspace`, `installSidecar` y el descubrimiento heredado la
  aplican explícitamente, con los mensajes actuales.
- R3. `scripts/new-spec.sh` deja de rechazar la raíz del template, conservando
  su bloqueo para los demás casos que ya cubre.
- R4. Cobertura de pruebas de las dos mitades: lo que pasa a permitirse y lo que
  debe seguir prohibido.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/workspace.ts` — la guarda y su punto de aplicación
- `packages/sdd-core/src/index.ts` — `createWorkspace` e `installSidecar`
- `packages/sdd-core/src/legacy.ts` — descubrimiento heredado
- `packages/sdd-core/src/workspace.test.ts` — pruebas de la guarda
- `scripts/new-spec.sh` — el bloqueo equivalente del script

## Fuera de alcance

- **Relajar `do_not_implement_in_template_root`** como política. La regla sigue
  vigente; sólo deja de aplicarse a las lecturas.
- **Que `www/` deje de ser el sitio de los proyectos dentro del template.**
- **Regenerar `STATUS.md` automáticamente** en cada release: es otra discusión,
  y `RELEASING.md` es su sitio.
- **La superficie HTTP y el confinamiento de `/mcp`** (paquete v11).

## Criterios de éxito

- Los cuatro casos de la tabla del contexto dejan de fallar en este repositorio.
- Los tres rechazos que deben seguir vivos tienen prueba que lo fija.
- Ningún cambio de comportamiento para un proyecto destino fuera del template:
  la suite existente pasa sin tocarla.
