# Especificación 037 - La evidencia de aprobación deja de transcribir el chat

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-20`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobado en sesión del 2026-08-20: corrección del registro de aprobaciones en las ubicaciones catalogadas en `research.md`, más la plantilla que inducía la práctica. Alcance limitado a la forma — no altera qué se aprobó, quién ni cuándo. El propietario decidió además no reescribir el historial de git, sobre el coste medido en `research.md` (R7).

## Objetivo

Que el registro de aprobaciones diga qué se aprobó y contra qué propuesta, en
vez de transcribir lo que el propietario escribió en un chat. Hoy dice
«hazlo»; eso ni informa a quien lo lea dentro de un año ni resiste que lo lea
un cliente.

## Historia de usuario principal

Como persona que abre este repositorio sin haber estado en las sesiones,
quiero que cada spec aprobada me diga qué alcance se aprobó y sobre qué
documento, para reconstruir el porqué de una decisión sin depender de un chat
al que no tengo acceso.

## Contexto (medido, no supuesto)

Leído en el repositorio el 2026-08-20:

- **La plantilla pide la cita.** El campo se llama
  `Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or
  short quote)` en `specs/_template/spec.md:9`. La práctica no fue un
  descuido de quien escribió: la invitó el formulario. Cualquier limpieza que
  no toque la plantilla se vuelve a llenar.
- **Alcance real**: 25 de 36 `spec.md`, 15 `history.md`, 6 de 32 registros de
  `bitacora/decisiones/`, 3 de `bitacora/diaria/`, `bitacora/global/PROJECT_LOG.md`
  y varias de las 45 entradas de `.sdd/user-consent.log`.
- **Muestra de lo registrado como evidencia formal**: «hazlo», «dale»,
  «arranca», «continue», «hagalo» + «dele con todo», «listo, hagamoslo asi»,
  «has lo mejor a corto y largo plazo», «aprobada y hazle con todo nivel
  senior con solid», «sigue con las 029», «por eso, ayudame a resolverlo».
  El caso extremo está en `bitacora/diaria/2026-07-21.md`, que transcribe
  mayúsculas gritadas: «QUE RESPONDA TODO LO POSIBLE PARA EVITAR ERRORES Y QUE
  EL USUARIO SUFRA».
- **Nada valida el contenido de esos campos.** El gate solo comprueba que la
  evidencia no esté vacía (`scripts/check-sdd-gate.sh:148`) y que «Aprobado
  por» no siga en su marcador. El log de consentimiento exige
  `[<timestamp>] [spec:<NNN-slug>] <summary>` (`sdd.policy.yaml:32`) con el
  resumen como texto libre. Reescribir la prosa no toca la mecánica.
- **La cita ocupa el sitio del dato.** En la 021, «crea commits y sigue con lo
  que falte» sustituye a lo que un lector necesita: qué alcance se aprobó y
  contra qué informe.

## Decisiones que esta spec fija

1. **La evidencia registra hechos, no transcripciones.** Qué se aprobó, con
   qué alcance, contra qué documento o propuesta, y con qué fecha. La cita
   literal del chat no se usa como evidencia.
2. **Se conserva la sustancia; no se reescribe lo aprobado.** Esto es una
   corrección de forma sobre un registro de auditoría: cambia cómo se cuenta,
   nunca qué se aprobó, quién ni cuándo. Donde la cita sea la única prueba de
   un alcance, se resume ese alcance sin perderlo.
3. **El historial de git no se reescribe.** Registrado aparte con su
   fundamento; ver `bitacora/decisiones/`.

## Escenarios de aceptación

1. Dado un `spec.md` aprobado, cuando leo su campo de evidencia, entonces
   encuentro qué se aprobó y contra qué fuente, y ninguna transcripción de
   chat.
2. Dada la plantilla de spec, cuando creo una spec nueva, entonces el campo no
   me pide una cita, y su texto de ayuda me dice qué registrar.
3. Dado el log de consentimiento, cuando leo cualquier entrada, entonces
   conserva su marca de tiempo y su `[spec:<id>]`, y su resumen describe el
   alcance sin transcribir.
4. Dado el repositorio completo tras el cambio, cuando ejecuto la compuerta,
   entonces sigue en 0 errores y 0 avisos.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO alguien cree una spec desde la plantilla, EL SISTEMA DEBERÁ ofrecer un
  campo de evidencia que pida alcance y fuente, y que no mencione «cita».
- CUANDO se registre una aprobación, EL SISTEMA DEBERÁ conservar fecha,
  aprobador y puntero a la fuente verificable.
- SI una entrada histórica solo prueba su alcance mediante la cita, ENTONCES EL
  SISTEMA DEBERÁ conservar ese alcance reformulado, nunca eliminarlo.
- CUANDO termine la reescritura, EL SISTEMA DEBERÁ pasar `validate-sdd.sh
  --strict`, `check-sdd-policy.sh` y `check-sdd-gate.sh` con 0 errores.

## Requisitos

- R1 — `specs/_template/spec.md` renombra el campo y explica qué registrar.
  La misma corrección en la copia de `packages/sdd-core/framework/`.
- R2 — `CLAUDE.md` y `template-context/core-instructions/` fijan la norma para
  agentes: la evidencia no transcribe el chat.
- R3 — Reescritura de los 25 `spec.md` afectados conservando fecha, aprobador y
  fuente.
- R4 — Reescritura de los 15 `history.md` afectados.
- R5 — Reescritura de los 6 registros de decisión, 3 diarios y el
  `PROJECT_LOG.md` afectados.
- R6 — Reescritura de los resúmenes de `.sdd/user-consent.log`, conservando
  intactos el sello de tiempo y el marcador `[spec:<id>]` de cada línea.
- R7 — El historial de git no se reescribe; la razón queda en un registro de
  decisión.

## Ámbito de archivos / File scope

- `specs/_template/spec.md` — la raíz del problema
- `packages/sdd-core/framework/specs/_template/spec.md` — su copia empaquetada
- `specs/0*/spec.md` — 25 archivos
- `specs/0*/history.md` — 15 archivos
- `bitacora/decisiones/` — 6 registros
- `bitacora/diaria/` — 3 registros
- `bitacora/global/PROJECT_LOG.md`
- `.sdd/user-consent.log`
- `CLAUDE.md`, `template-context/core-instructions/`

## Criterios de éxito

- Cero transcripciones de chat en los campos de evidencia y en la bitácora.
- La plantilla ya no induce el defecto.
- Compuerta en 0/0 y `docs:links` sin regresión.
- Ninguna fecha, aprobador ni alcance alterado respecto de lo aprobado.
