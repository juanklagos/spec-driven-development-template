# Especificación 013 - Integridad de la compuerta: que las mitigaciones existan de verdad

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-21`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-21 — el autor respondió *«arregla todo nivel senior con solid, quiero dejar todo listo»* al informe de estado que enumeraba estos cuatro defectos verificados. Consentimiento en `.sdd/user-consent.log`.

## Contexto

Cuatro defectos verificados uno por uno contra el código. Ninguno es funcionalidad nueva: los cuatro
son cosas que el repositorio ya afirma o da por hechas, y que no lo están.

**1. La mitigación que sostiene una decisión escrita no está implementada.**
`bitacora/decisiones/2026-07-21-action-usa-los-scripts-del-consumidor.md:21` acepta que la Action
ejecute los scripts del consumidor, y declara como mitigación: *«el instalador ahora estampa
`spec/.sdd/TEMPLATE_VERSION`, así que un sidecar viejo es detectable aunque no se refresque solo»*.

`install-spec-sidecar.sh:195` lo escribe. **Nadie lo lee.** `grep -rn TEMPLATE_VERSION` solo devuelve
un test que comprueba que el archivo existe. Detectable en principio, detectado por nadie.

Y el disparador de revisión que el propio registro define acaba de cumplirse (`:39`): *«Si se añade
una regla de compuerta que sea de corrección y no de política […] ahí sí conviene que la Action
imponga su versión, o al menos avise»*. La spec 012 arregló un fallo abierto de corrección: un
consumidor con sidecar anterior a la 2.1.0 ejecuta el extractor con el `sed` codicioso y recibe un
verde falso sobre una spec sin aprobar.

Esta spec **no revierte** aquella decisión. Su razón sigue siendo válida: quien puede editar el CI
puede quitar la Action entera, así que nunca fue una frontera de seguridad, y un `uses: ...@main` que
cambiara las reglas de un repo ajeno sería peor. Lo que hace es implementar la mitigación que el
registro dice que ya existe.

**2. `sdd_project_root` no funciona en worktrees ni en submódulos.**
`scripts/lib/sdd-root.sh:139` usa `[ -d "$sdd_root/.git" ]`. En un worktree de git y en un submódulo,
`.git` es un **archivo** con un puntero, no un directorio, así que la función devuelve la raíz
equivocada en silencio. Hoy afecta poco; el detector de la 014 lo convierte en carga estructural.

**3. Ningún andamiador escribe un `.gitignore` en el proyecto destino.**
Verificado sobre los tres. Toda suposición del tipo «ese archivo está ignorado» es falsa fuera de este
repositorio.

**4. `init-project.sh` copia el `INDEX.md` del framework**, con filas de specs que no existen en el
proyecto del usuario. `install-spec-sidecar.sh` ya lo arregló en su lado; el otro andamiador no.

## Historia de usuario principal

Como persona que instaló este framework hace dos versiones, quiero que la herramienta me avise cuando
mi copia local ya no comprueba lo que la versión actual comprueba, para no confiar en un verde que
solo significa que mi copia es vieja.

## Escenarios de aceptación

1. Dado un sidecar instalado desde una versión anterior a la actual, cuando la Action corre sobre él,
   entonces avisa nombrando ambas versiones y el comando de actualización, y **no** falla el build.
2. Dado un sidecar sin `TEMPLATE_VERSION` —instalado antes de que existiera el sello—, cuando la
   Action corre, entonces avisa de que no puede determinar la versión, y no falla.
3. Dado un sidecar de la versión actual, cuando la Action corre, entonces no aparece ningún aviso.
4. Dado un repositorio en un worktree de git, cuando un script resuelve la raíz del proyecto, entonces
   devuelve la misma raíz que devolvería en un clon normal.
5. Dado un proyecto sin `.gitignore`, cuando instalo el sidecar, entonces recibo uno con las entradas
   que el framework necesita; y si ya tenía uno, se le añaden sin borrar lo suyo.
6. Dado un proyecto recién creado con `init-project.sh`, cuando abro `specs/INDEX.md`, entonces no
   contiene filas de specs que no existen.

## Criterios de aceptación (formato EARS) / Acceptance criteria (EARS format)

- CUANDO la Action detecte que la versión sellada del workspace es anterior a la suya, EL SISTEMA
  DEBERÁ emitir un aviso que nombre ambas versiones y el comando de actualización.
- EL SISTEMA NO DEBERÁ fallar el build por una diferencia de versión: convertirla en un build roto
  castiga al consumidor por no actualizar, que es la fricción que el sidecar existe para evitar.
- SI el sello de versión no existe o no es legible, ENTONCES EL SISTEMA DEBERÁ avisar de que no puede
  determinar la versión y continuar.
- EL SISTEMA DEBERÁ seguir ejecutando los scripts del consumidor cuando existan, sin cambio alguno.
- EL SISTEMA DEBERÁ resolver la raíz del proyecto correctamente cuando `.git` sea un archivo y no un
  directorio.
- CUANDO un andamiador instale en un proyecto, EL SISTEMA DEBERÁ asegurar las entradas de `.gitignore`
  que el framework necesita, preservando el contenido previo.
- EL SISTEMA NO DEBERÁ escribir en el proyecto del usuario un índice de specs que no le pertenecen.

## Requisitos

- Ninguna decisión registrada se revierte. La 013 implementa la mitigación de la decisión del
  2026-07-21 sobre los scripts del consumidor; no cambia qué scripts se ejecutan.
- Toda comparación de versiones es informativa. Los códigos de salida de la Action no cambian.
- Cada arreglo vive en una función con una sola responsabilidad, en `scripts/lib/`, sourceada por
  quien la necesite. Nada duplicado entre andamiadores.
- Compatible con bash 3.2 (macOS) y con Linux.

## Fuera de alcance / Out of scope

- El detector de código: spec 014.
- Un input `scripts: consumer | action` en la Action. El registro del 2026-07-21 lo dejó para cuando
  haya demanda real de dos consumidores distintos; sigue sin haberla.
- Fallar el build por sidecar viejo. El propio registro lo rechazó por motivos que no han cambiado.

## Ámbito de archivos / File scope

- `action.yml` — lectura del sello de versión y aviso
- `scripts/lib/sdd-root.sh` — resolución de raíz con `git rev-parse`
- `scripts/lib/sdd-gitignore.sh` — entradas de `.gitignore`, función única
- `scripts/install-spec-sidecar.sh` — usa la función de `.gitignore`
- `scripts/init-project.sh` — usa la función de `.gitignore`; deja de copiar el INDEX del framework
- `scripts/test-mcp-integration.mjs` — cobertura de los cuatro

## Propiedades de la spec / Spec properties

- Para todo workspace, la raíz resuelta DEBERÁ ser la misma en un clon, un worktree y un submódulo.
- Para toda diferencia de versión, la Action DEBERÁ avisar y NUNCA cambiar su código de salida.
- Para todo `.gitignore` preexistente, sus líneas DEBERÁN seguir presentes después de instalar.

## Criterios de éxito

- Un sidecar de la 2.0.0 corriendo la Action de la 2.1.0 recibe un aviso que nombra el motivo por el
  que actualizar importa.
- `TEMPLATE_VERSION` pasa de escribirse y no leerse, a sostener de verdad la decisión que lo invoca.
- Los tres andamiadores dejan el proyecto del usuario con un `.gitignore` correcto y sin specs ajenas.
