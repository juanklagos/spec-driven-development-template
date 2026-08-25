# Especificación 040 - El instalador entrega la versión que dice entregar

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-25`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobado en sesión del 2026-08-25 contra este `spec.md` en su versión revisada de esa misma fecha: alcance completo, las cuatro fases del plan. Incluye explícitamente la inversión de §6 (publicar en npm) y §7 (tag) de `RELEASING.md` y el `--ref main` en la verificación del §4, que la revisión previa identificó como necesarios para que el arreglo no quede desactivado por el propio proceso de release. Quedan fuera, por decisión de la propia spec: el texto de `sdd-mcp upgrade` (decisión 5), la guarda de `scripts/new-spec.sh` (research §R9) y el que la compuerta avise en lugar de bloquear (research §R11).

## Objetivo

Que instalar con `create-sdd-project@X.Y.Z` entregue exactamente el mismo
contenido que `@juanklagos/sdd-core@X.Y.Z` lleva dentro. Hoy no coincide: el
instalador clona HEAD y el actualizador compara contra el tag, así que todo lo
que se commitea entre dos releases llega a los proyectos de los usuarios sin
existir en ningún paquete publicado. `sdd-mcp upgrade` lo reporta después como
si el usuario hubiera editado esos archivos.

## Historia de usuario principal

Como persona que instaló SDD en un proyecto real y meses después ejecuta
`sdd-mcp upgrade --dry-run`, quiero que los archivos que yo no he tocado no
aparezcan como míos y divergentes, para no tener que auditar el framework para
decidir si aplicar una actualización que en realidad es un retroceso.

## Contexto (medido, no supuesto)

Leído en el repositorio y en los registros públicos el 2026-08-25:

- **El instalador clona HEAD, sin fijar tag.**
  `packages/create-sdd-project/index.mjs:100` ejecuta
  `execFileSync("git", ["clone", "--depth", "1", REPO, tmp])`. No hay `--branch`
  ni ninguna resolución de versión, aunque el propio paquete se versiona junto
  con el repositorio y conoce su número en su `package.json`.

- **El actualizador compara contra el tag.** `sdd-mcp upgrade` contrasta el
  sidecar instalado con el payload embebido en `@juanklagos/sdd-core`, que
  corresponde a la publicación, no a HEAD.

- **La ventana se abre a los 29 minutos de publicar.** Cronología de la
  v2.6.0, con `git log` y `npm view @juanklagos/sdd-core time --json`:

  | Evento | Hora (UTC) |
  |---|---|
  | `4c313a4 chore(release): v2.6.0` | 2026-08-20 14:47:58 |
  | `sdd-core@2.6.0` publicado en npm | 2026-08-20 14:57:12 |
  | `df2aa57` modifica `specs/_template/spec.md` (spec 037) | 2026-08-20 15:26:41 |
  | `34c2901` builder (spec 038) | 2026-08-20 15:36 |
  | `1756603` builder (spec 039) | 2026-08-20 16:20 |

  No es un descuido puntual. Es el trabajo normal continuando la misma tarde
  del release, y por tanto se repetirá en cada uno.

- **El payload no está roto y no es la causa.**
  `git ls-files packages/sdd-core/framework` devuelve 0 archivos: no se
  versiona, se genera en el release desde el repositorio
  (`scripts/build-framework-payload.mjs:18`). En HEAD, `specs/_template/spec.md`
  y su copia en el payload local coinciden. El fallo está exclusivamente en qué
  ref clona el instalador.

- **Efecto observado en un proyecto real.** El-MERDN instaló el sidecar el
  2026-08-25 con `create-sdd-project@2.6.0`. El `--dry-run` posterior reportó:

  ```
  TUYO, intacto / yours, untouched  specs/_template/spec.md
  Estos archivos son TUYOS y difieren de la versión nueva.
  ```

  El archivo es byte a byte idéntico al del clon que hizo el instalador. Nadie
  lo editó. De 72 archivos de framework comparados, es la única divergencia.

- **El mensaje invierte la realidad.** Lo que el usuario tiene es la versión
  *más nueva* —la sección de evidencia de aprobación con sus instrucciones, que
  introdujo la spec 037—. Lo que el diagnóstico llama "la versión nueva" es la
  línea única anterior. Ejecutar `--apply` revertiría la spec 037 dentro del
  proyecto del usuario, y lo haría precisamente sobre el campo que
  `scripts/check-sdd-gate.sh` exige para abrir la compuerta.

- **El coste de no arreglarlo es silencioso.** No falla ningún build, ningún
  test y ningún gate. Solo produce un aviso recurrente que un usuario razonable
  resuelve aplicando lo que la herramienta llama "nuevo".

## Decisiones que esta spec fija

1. **El instalador clona la ref que corresponde a su propia versión**, leída de
   su `package.json`, no la rama por defecto.

2. **El fallback es explícito y se anuncia.** Si el tag no existe —desarrollo
   local, versión aún no publicada, réplica sin tags— el instalador cae a la
   rama por defecto e **imprime** que lo hizo y por qué. Un fallback silencioso
   reintroduce exactamente el problema que esta spec cierra.

3. **Un `--ref <git-ref>` explícito manda sobre todo lo anterior**, para poder
   instalar desde una rama en pruebas sin editar el paquete.

4. **Esta spec cambia el orden del release, y tiene que hacerlo.**
   `RELEASING.md` publica hoy en npm (§6) y empuja el tag después (§7). Con la
   resolución por tag, ese orden abre en cada release una ventana en la que
   `create-sdd-project@X.Y.Z` ya es instalable desde npm y `vX.Y.Z` todavía no
   existe en el remoto: toda instalación hecha en esa ventana cae al fallback,
   es decir a HEAD, es decir al defecto que esta spec cierra. Los dos pasos se
   invierten: el tag se empuja antes de `npm publish`.

   La contrapartida se asume a conciencia. El `> [!WARNING]` de `RELEASING.md`
   coloca todo antes de `npm publish` porque npm no deja despublicar. Un tag
   empujado por error se borra del remoto
   (`git push origin :refs/tags/vX.Y.Z`); una versión npm publicada, no. El
   riesgo que se acepta es reversible; el que se elimina no lo es.

   Lo que no cambia: no se prohíbe commitear después de publicar. Se elimina la
   consecuencia de hacerlo.

5. **Esta spec no modifica el texto de `sdd-mcp upgrade`.** Que el mensaje
   atribuya al usuario una divergencia que no causó es un defecto real, pero
   separable: con esta spec aplicada deja de dispararse en el caso normal. Si
   se quiere corregir el texto, va en su propia spec.

6. **La verificación previa del §4 declara su ref.** El paso 4 de
   `RELEASING.md` instala el tarball recién empaquetado antes de que el tag
   exista, y así debe seguir siendo: el tag no se empuja hasta que la compuerta
   del §5 pasa. Ese comando pasa `--ref main` explícito, para que la
   verificación previa al release siga ejercitando un clonado por ref declarada
   en lugar de imprimir una advertencia de fallback en cada publicación.

## Escenarios de aceptación

1. Dado que `create-sdd-project` declara la versión `2.7.0` y el tag `v2.7.0`
   existe en el remoto, cuando alguien instala un sidecar, entonces el contenido
   instalado procede de `v2.7.0` y no de HEAD.

2. Dado un sidecar instalado con `create-sdd-project@X.Y.Z`, cuando se ejecuta
   `sdd-mcp upgrade --dry-run` contra `sdd-mcp@X.Y.Z` sin haber editado nada,
   entonces no se reporta ningún archivo como divergente.

3. Dado que el tag correspondiente no existe en el remoto, cuando alguien
   instala, entonces la instalación se completa desde la rama por defecto y la
   salida dice explícitamente qué ref se usó y por qué no se usó el tag.

4. Dado `--ref feature/algo`, cuando alguien instala, entonces se clona esa ref
   y la salida la nombra.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO se invoque el instalador sin `--ref`, EL SISTEMA DEBERÁ clonar el tag
  `v<version>` correspondiente a la versión declarada en el `package.json` del
  propio instalador.
- CUANDO el instalador clone cualquier ref, EL SISTEMA DEBERÁ imprimir en la
  salida el nombre exacto de la ref utilizada, antes de copiar archivos.
- SI el tag `v<version>` no existe en el remoto, ENTONCES EL SISTEMA DEBERÁ
  continuar desde la rama por defecto e imprimir una advertencia que nombre el
  tag ausente y la ref usada en su lugar.
- SI se pasa `--ref <git-ref>`, ENTONCES EL SISTEMA DEBERÁ clonar esa ref e
  ignorar la resolución por versión.
- SI la ref indicada por `--ref` no existe, ENTONCES EL SISTEMA DEBERÁ fallar
  con un mensaje que la nombre, sin caer a ninguna otra ref.

## Requisitos

- Sin dependencias nuevas: el paquete es zero-dependency y debe seguir siéndolo.
- El instalador debe leer su propia versión en tiempo de ejecución, no tenerla
  incrustada como literal, para no añadir un noveno sitio a la lista de bump de
  `RELEASING.md` §1.
- El comportamiento debe ser idéntico en modo `sidecar` y en modo `full`.
- La comprobación de existencia del tag debe hacerse contra el remoto y sin
  clonar el repositorio dos veces.

## Ámbito de archivos / File scope

- `packages/create-sdd-project/index.mjs` — resolución de ref y clonado
- `packages/create-sdd-project/README.md` — documentar `--ref`
- `RELEASING.md` — invertir §6 (publicar) y §7 (tag), y declarar `--ref` en el
  comando de verificación del §4

## Criterios de éxito

- Instalar con una versión publicada y ejecutar `sdd-mcp upgrade --dry-run`
  inmediatamente después devuelve cero archivos divergentes.
- La salida del instalador siempre dice de qué ref procede lo instalado.
- El orden documentado del release no deja ninguna ventana en la que una versión
  publicada en npm no tenga su tag en el remoto.
- `RELEASING.md` no gana ningún paso manual nuevo: los que ya tenía cambian de
  orden y uno de ellos gana un flag.
