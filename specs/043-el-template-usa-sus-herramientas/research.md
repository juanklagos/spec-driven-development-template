# Investigación 043 - El template puede usar sus propias herramientas sobre sí mismo

Medido el 2026-08-30 sobre `main` en `a934896`, durante la implementación de la
spec 042. Los cuatro bloqueos son de esa sesión.

## Los cuatro bloqueos, con su salida real

| Herramienta | Invocación | Resultado |
|---|---|---|
| `new-spec.sh` | `./scripts/new-spec.sh "prueba-guard" "test"` | `Error: refusing to create spec in template root.` |
| `scoreSpec` | `scoreSpec(process.cwd(), "042-...")` | `Project root cannot be the template root itself` |
| `generateStatus` | `generateStatus(process.cwd())` | `Project root cannot be the template root itself` |
| `sdd_create_spec` | vía MCP con `projectRoot` = raíz del repo | mismo mensaje (`workspace.ts:114`) |

Los tres últimos comparten origen: `resolveSddRoot` llama a
`ensureProjectRootAllowed` (`workspace.ts:170-172`). El primero es una copia
independiente de la regla escrita en bash (`scripts/new-spec.sh:18-23`), que
comprueba la presencia simultánea de `sdd.policy.yaml`,
`scripts/create-www-project.sh` y `www/`.

## Superficie afectada

`grep -rn "resolveSddRoot(" packages/*/src/*.ts` sin pruebas: **25 llamadas**,
repartidas en `index.ts` (11), `bitacora.ts` (2), `board.ts` (2),
`workspace.ts` (2), `connect.ts`, `policy.ts` y `requests.ts`.

Todas quedan bloqueadas hoy sobre la raíz del template, incluidas las de sólo
lectura como `getBoardView` — la que sirve `sdd_board_read`.

## Qué protege la regla, y de qué

`sdd.policy.yaml` declara `execution_root.do_not_implement_in_template_root: true`
y `if_target_inside_template_use_default_workspace: true`. Es una política sobre
**dónde se materializa un proyecto destino**, no sobre desde dónde se leen unas
specs.

Las operaciones que materializan un proyecto destino son tres:
`createWorkspace` (`index.ts:103`), `installSidecar` (`index.ts:166`) y el
descubrimiento heredado (`legacy.ts:50`). La tercera **ya** llama a la guarda
por su cuenta, lo que confirma que ése es el sitio correcto de la llamada.

## Coste medido de no arreglarlo

- `STATUS.md` estuvo 17 días sin regenerar y le faltaban 8 specs. El 2026-08-30
  se regeneró ejecutando el generador real sobre un espejo de `specs/` y
  `bitacora/` en un directorio temporal, y copiando el resultado de vuelta.
- La spec 042 se creó a mano, copiando `specs/_template/`.
- La puntuación de la 042 se obtuvo copiando el bundle a un workspace de usar y
  tirar.

Los tres rodeos producen el resultado correcto y ninguno es reproducible por
alguien que no sepa que hay que darlos.

## Por qué existe la guarda (fuente, no memoria)

La añadió el commit `cd01c5d`, «feat(enforcement): require user consent and
block spec creation in template root» (2026-03-14), en el mismo cambio que
introdujo el consentimiento del usuario. El mensaje no da más justificación
escrita, y no hay decisión registrada en `bitacora/decisiones/` sobre este punto
— así que la razón hay que leerla del propio código y de la política, no
inventarla:

- `sdd.policy.yaml` declara `do_not_implement_in_template_root: true` y
  `if_target_inside_template_use_default_workspace: true`.
- Los ficheros que ese commit tocó (`AGENTS.md`, `AI_START_HERE.md`,
  `INSTRUCTIONS.md`, `QUICKSTART.md`) hablan todos de dónde va el **proyecto
  destino**, no de dónde se leen las specs.

La referencia normativa de qué debe seguir prohibido es, por tanto,
`sdd.policy.yaml`, y esta spec no la toca: sólo mueve el punto donde se aplica.

**Por qué el sitio actual es el equivocado**, en una frase: `resolveSddRoot`
responde a la pregunta «¿dónde está la raíz SDD de este directorio?», que no
tiene nada que ver con «¿puedo materializar aquí un proyecto destino?». Meter la
segunda dentro de la primera es lo que hace que leer un tablero esté tan
prohibido como scaffoldear un proyecto.

## Alternativas consideradas

1. **Mover la guarda a las operaciones que crean un proyecto destino.**
   Elegida. Deja la política intacta y la aplica donde significa algo.
2. **Una variable de entorno de escape** (`SDD_ALLOW_TEMPLATE_ROOT=1`).
   Descartada: convierte una decisión de diseño en un truco que hay que
   recordar, y no arregla `new-spec.sh` para quien no lo conozca.
3. **Un parámetro `allowTemplateRoot` en `resolveSddRoot`.** Descartada: son 25
   llamadas, y decidir en cada una es exactamente el reparto de responsabilidad
   que causó el problema.
4. **No hacer nada y documentar los rodeos.** Descartada: el template dejaría de
   poder usarse a sí mismo, que es la mejor prueba de que sus herramientas
   funcionan.
