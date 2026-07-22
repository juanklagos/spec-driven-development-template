# Especificación 016 - La puerta de entrada: que los primeros cinco comandos funcionen

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-22`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-22 — el autor respondió *«siga, cubra todo lo que falte»*. El barrido de 84 agentes que siguió confirmó 71 hallazgos, y esta spec cubre los que un desconocido encuentra en sus primeros cinco minutos. Consentimiento en `.sdd/user-consent.log`.

## Contexto

Un barrido de siete auditorías con verificación adversarial devolvió un veredicto claro: **el motor
está bien, la puerta de entrada está rota.** Casi nada falló en `sdd-core`, en la lógica de la
compuerta ni en el protocolo MCP. Todo se concentra en los primeros cinco minutos y en documentación
que se quedó atrás.

Lo verificado a mano antes de escribir esto, y dos son trabajo de ayer que no funciona:

**1. `validate-sdd.sh` se corta a media ejecución, en silencio.** Con un `IDEA_GENERAL.md` casi vacío,
el `grep -vE` de `scripts/validate-sdd.sh:59-62` no selecciona nada, y bajo `set -euo pipefail` eso
aborta el script: imprime ocho líneas y termina sin resumen y sin error. Es el segundo comando que
QUICKSTART manda ejecutar, y el archivo viaja **byte a byte** dentro del paquete npm publicado.

**2. Los andamiadores copian mi idea y mi bitácora dentro del proyecto del usuario.** Verificado:
`spec/idea/IDEA_GENERAL.md` de un proyecto recién creado contiene dos menciones a «Spec-Driven
Development Template», y su `PROJECT_LOG.md` llega con 81 líneas de historia ajena.

**3. El aviso de consentimiento heredado no se dispara en el caso para el que se construyó.** La
spec 012 añadió una guardia, y la diseñé para un workspace con **cero** specs aprobadas. Pero una
copia del template trae las specs **y** su registro de consentimiento juntos, así que no hay líneas
huérfanas y la guardia calla. Reproducido: una copia con las 15 specs reporta
`Compuerta: ABIERTA — 15 spec(s) aprobada(s) y consentida(s)`, cero avisos. **La primera ejecución de
la compuerta de un recién llegado certifica mis aprobaciones como suyas**, que es exactamente la
única garantía que este proyecto vende.

**4. El sello de versión de la spec 013 nunca llega al repositorio del consumidor.** Las reglas de
`.gitignore` que escribí ayer ignoran `.sdd/*` y solo exceptúan `user-consent.log`, así que
`TEMPLATE_VERSION` queda fuera de git. Y `init-project.sh` no lo escribe en absoluto. El chequeo de
sidecar obsoleto de `action.yml` —la mitigación entera de la spec 013— es código muerto, y además
emite un aviso falso permanente en el CI de todo consumidor.

**5. El GIF de portada muestra el primer comando fallando.** `demo.tape:14` ejecuta `new-spec.sh` en
la raíz del repositorio, donde el propio script se niega por diseño. El workflow de release
re-commitea ese fallo en cada versión.

## Historia de usuario principal

Como alguien que llega al repositorio por primera vez, quiero que los comandos que la documentación
me manda ejecutar funcionen, y que mi proyecto empiece vacío y no con el contenido de otra persona.

## Escenarios de aceptación

1. Dado un workspace recién instalado con la idea sin rellenar, cuando ejecuto la validación,
   entonces termina e imprime su resumen.
2. Dado un proyecto recién andamiado, cuando abro su archivo de idea y su bitácora global, entonces
   están vacíos y listos para mí.
3. Dada una copia del template con sus specs y su registro de consentimiento, cuando ejecuto la
   compuerta, entonces me avisa de que esas aprobaciones no son mías.
4. Dado el propio repositorio del template, cuando ejecuto la compuerta, entonces ese aviso no
   aparece.
5. Dado un sidecar instalado, cuando lo versiono, entonces el sello de versión entra en git.
6. Dado el GIF de la portada, cuando lo veo, entonces muestra el flujo completando, no un error.

## Criterios de aceptación (formato EARS) / Acceptance criteria (EARS format)

- EL SISTEMA NO DEBERÁ abortar una validación por un archivo de idea vacío.
- CUANDO un andamiador cree un proyecto, EL SISTEMA DEBERÁ dejar el archivo de idea y la bitácora
  global vacíos y listos para el usuario.
- CUANDO un workspace contenga consentimientos anteriores a su propia instalación, EL SISTEMA DEBERÁ
  avisar de que esas aprobaciones no son del usuario.
- SI no se puede determinar cuándo se instaló el workspace, ENTONCES EL SISTEMA NO DEBERÁ avisar: el
  repositorio del propio template no tiene sello y no debe acusarse a sí mismo.
- EL SISTEMA DEBERÁ dejar el sello de versión fuera de las reglas de ignorado, y escribirlo desde
  todos los andamiadores.
- EL SISTEMA DEBERÁ mostrar en su demostración un flujo que termina bien.

## Requisitos

- Los arreglos de script van en la fuente y en su copia del payload de npm, que hoy son idénticas.
- El aviso de consentimiento heredado nunca falla el build: es un aviso.
- Todo texto nuevo existe en español e inglés.

## Fuera de alcance / Out of scope

- Los hallazgos cosméticos del barrido (rutas temporales en una captura, textos de guías desfasadas).
- Reescribir `START_HERE_NON_TECH.md`, que necesita una pasada editorial propia.

## Ámbito de archivos / File scope

- `scripts/validate-sdd.sh` — la tubería que aborta
- `scripts/lib/sdd-scaffold.sh` — idea y bitácora vacías, `TEMPLATE_VERSION` fuera del ignorado
- `scripts/install-spec-sidecar.sh` — usar las funciones nuevas
- `scripts/init-project.sh` — usarlas y escribir el sello
- `scripts/check-sdd-gate.sh` — el aviso que sí se dispara
- `demo.tape` — andamiar antes de ejecutar
- `scripts/test-mcp-integration.mjs` — cobertura

## Propiedades de la spec / Spec properties

- Para todo workspace recién creado, la validación DEBERÁ terminar con resumen.
- Para toda copia del template, la compuerta DEBERÁ avisar del consentimiento ajeno.
- Para el propio template, ese aviso NO DEBERÁ aparecer.

## Criterios de éxito

- Los cinco primeros comandos de la documentación funcionan en un directorio limpio.
- Un proyecto nuevo no contiene una sola línea del template.
