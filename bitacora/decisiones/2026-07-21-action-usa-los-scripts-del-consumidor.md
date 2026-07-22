# Decisión clave - La Action usa los scripts del consumidor / Key decision - The Action runs the consumer's scripts

## Date / Fecha

2026-07-21

## Context / Contexto

`action.yml` resuelve qué scripts ejecutar en este orden: `<target>/spec/scripts/` (sidecar), luego `<target>/scripts/` (standalone), y solo si no encuentra ninguno usa los que viaja la propia Action (`${{ github.action_path }}/scripts`).

La verificación adversarial del 2026-07-21 señaló la tensión: un proyecto con un sidecar **obsoleto o manipulado** sigue ejecutando *su* compuerta en CI, no la nuestra. Y es lo contrario de la regla que ese mismo día se aplicó al instalador (`scripts/install-spec-sidecar.sh`), donde los scripts del framework se refrescan por ser nuestros.

Vale la pena registrarla porque no es un descuido: son dos respuestas legítimas a la misma pregunta, y la elegida tiene un costo real que alguien preguntará más adelante.

## Decision / Decisión

**Se mantiene el orden actual**: la Action ejecuta los scripts del consumidor cuando existen.

Razón: el sidecar es *del proyecto*, y su versión de la compuerta es la que su equipo aprobó y probó. Si la Action impusiera los suyos, un `uses: ...@main` podría cambiar silenciosamente las reglas de validación de un repo ajeno entre dos commits sin que nadie lo pidiera — exactamente el fallo que la fijación de versiones existe para evitar. El consumidor elige cuándo actualizar, reinstalando el sidecar.

Mitigación aceptada: el instalador ahora estampa `spec/.sdd/TEMPLATE_VERSION`, así que un sidecar viejo es *detectable* aunque no se refresque solo.

> **Actualización 2026-07-21 (spec 013).** Esa mitigación estaba enunciada y no implementada: `grep -rn TEMPLATE_VERSION` solo devolvía un test comprobando que el archivo existe. Detectable, sí; detectado, no. Además se cumplió el disparador de revisión de abajo —la spec 012 corrigió un fallo abierto de **corrección**, no de política: un `sed` codicioso que leía `approved` donde el archivo decía `Pendiente`— y la respuesta que este mismo registro nombra para ese caso es *«o al menos avise»*. `action.yml` ahora lee el sello y avisa cuando el workspace es anterior a la Action, sin tocar el código de salida y sin cambiar qué scripts se ejecutan. **La decisión no se revierte: se completa.**

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **La Action siempre usa sus propios scripts** | Cambia las reglas de validación de repos ajenos sin su consentimiento; rompe el sentido de fijar `@v1.7.0`; y deja sin efecto cualquier ajuste legítimo que el proyecto haya hecho a su copia |
| **Comparar versiones y fallar si el sidecar es viejo** | Convierte una diferencia de versión en un build roto: castiga al consumidor por no actualizar, que es justo la fricción que el sidecar evita |
| **Input `scripts: consumer \| action` para que elija** | Es la evolución natural si aparece demanda real; hoy añade superficie de API sin un caso de uso reportado |

## Consequences / Consecuencias

- Un sidecar obsoleto ejecuta reglas obsoletas en CI, y nadie se entera automáticamente. Es el costo aceptado.
- Un sidecar **manipulado** (por ejemplo un `check-sdd-gate.sh` reducido a `exit 0`) pasa en CI. La Action no es una defensa contra el propio equipo del repo: quien puede editar el CI puede quitar la Action entera. No se pretende que sea un control de seguridad.
- La actualización del sidecar es un acto explícito del consumidor: reinstalar refresca los scripts del framework (decidido el mismo día, ver `scripts/install-spec-sidecar.sh`).

**Cuándo revisar esta decisión**
- Si alguien reporta un CI en verde con una compuerta obsoleta y lo vive como un fallo del template, no de su sidecar.
- Si se añade una regla de compuerta que sea de **corrección** y no de política (por ejemplo, un fallo de seguridad en la validación): ahí sí conviene que la Action imponga su versión, o al menos avise.
- Si aparece demanda real del input `scripts:` — dos consumidores distintos pidiéndolo bastan.
- Si `TEMPLATE_VERSION` deja de escribirse o de leerse, porque entonces se pierde la mitigación que sostiene esta decisión.

## Related records / Registros relacionados

- `2026-03-14-compuerta-mecanica-y-consentimiento-antes-de-ejecutar.md` — por qué la compuerta se verifica por máquina.
