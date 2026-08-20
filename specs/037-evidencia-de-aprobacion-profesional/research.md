# Investigación 037 - Cómo se registró la aprobación hasta hoy

## Lo que se leyó en el repositorio (2026-08-20)

Barrido sobre `specs/`, `bitacora/` y `.sdd/user-consent.log`.

### La causa está en la plantilla

`specs/_template/spec.md:9` define el campo así:

    - Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote):

El formulario pide una cita. Quien lo rellenó hizo lo que el campo pedía. Por
eso R1 va primero en el plan: limpiar sin cambiar la plantilla es una limpieza
con fecha de caducidad.

### Alcance medido

| Ubicación | Afectados |
|---|---|
| `specs/0*/spec.md` | 25 de 36 |
| `specs/0*/history.md` | 15 |
| `bitacora/decisiones/` | 6 de 32 |
| `bitacora/diaria/` | 3 |
| `bitacora/global/PROJECT_LOG.md` | 1 |
| `.sdd/user-consent.log` | varias de 45 entradas |

### Catálogo de lo transcrito

«hazlo» · «dale» · «arranca» · «continue» · «hagalo» y después «dele con todo»
· «listo, hagamoslo asi» · «listo, hazlo» · «has lo mejor a corto y largo
plazo» · «aprobada y hazle con todo nivel senior con solid» · «arregla todo
nivel senior con solid, quiero dejar todo listo» · «sigue con las 029» · «por
eso, ayudame a resolverlo» · «ahora implementa con la dialectica» · «siga,
cubra todo lo que falte» · «cubre todo» · «arreglalo» · «si me parece, cubre
todo nivel senior con solid».

El caso extremo, en `bitacora/diaria/2026-07-21.md`, transcribe mayúsculas:
«arregla el fallo real, QUE RESPONDA TODO LO POSIBLE PARA EVITAR ERRORES Y QUE
EL USUARIO SUFRA».

### Por qué reescribir es seguro

- `scripts/check-sdd-gate.sh:148` solo falla si la evidencia queda vacía; no
  interpreta su contenido.
- `sdd.policy.yaml:32` fija `[<timestamp>] [spec:<NNN-slug>] <summary>`. El
  sello y el marcador son estructura; el resumen es libre.
- Ningún script parsea las citas. No hay dependencia mecánica que romper.

## Qué se pierde y qué no

La cita no aporta información: «hazlo» no dice qué se aprobó. Lo que sí hay que
conservar es lo que la rodea — la fecha, el aprobador y el documento contra el
que se aprobó — porque eso es lo que permite reconstruir la decisión.

Ejemplo del cambio, sobre la spec 021:

- Antes: «Chat 2026-07-23 — "crea commits y sigue con lo que falte". La 021 era
  el borrador pendiente de mayor valor…»
- Después: «Aprobado en sesión del 2026-07-23: implementación de la 021, el
  borrador pendiente de mayor valor, sobre el defecto reportado por el
  propietario (el binario del lienzo fallaba en silencio). Consentimiento en
  `.sdd/user-consent.log`.»

Misma fecha, misma fuente, más información y sin transcripción.

## Sobre el historial de git

Medido el 2026-08-20: 12 mensajes de commit contienen transcripciones y 121 de
258 commits tocan los archivos afectados. El primero es `933c982` (2026-03-18),
así que reescribir alcanzaría al 47% del historial y reasignaría los 25 tags,
incluido `v2.6.0`, al que apunta el registro MCP publicado.

El repositorio es público, con 12 estrellas y 1 fork. Un fork conserva el
historial anterior de forma permanente, GitHub sigue sirviendo commits
huérfanos por SHA, y cualquier clon existente lo mantiene. La reescritura no
sería reversible ni completa.

Fundamento adicional en `bitacora/decisiones/` (R7).
