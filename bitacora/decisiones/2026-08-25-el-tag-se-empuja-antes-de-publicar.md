# Decisión importante - El tag se empuja antes de publicar en npm

## Date / Fecha

2026-08-25 — decidida en la sesión de la spec 040, durante la revisión del
borrador y antes de implementarlo
(`specs/040-instalador-fija-la-version/`).

## Context / Contexto

`create-sdd-project` clonaba la rama por defecto del repositorio, mientras
`sdd-mcp upgrade` comparaba lo instalado contra el payload embebido en
`@juanklagos/sdd-core`, que se construye desde el árbol publicado. Dos fuentes
bajo el mismo número de versión: todo lo commiteado entre dos releases llegaba
a los proyectos de los usuarios sin existir en ningún paquete publicado, y el
diagnóstico de actualización lo reportaba después como archivos editados **por
ellos**.

Medido el 2026-08-25, antes de decidir:

- Cronología de la v2.6.0 (`git log` y `npm view @juanklagos/sdd-core time`):
  release commit `4c313a4` a las 14:47:58 UTC, publicación en npm a las
  14:57:12, y el primer commit posterior que toca `specs/_template/spec.md`
  (`df2aa57`, spec 037) a las 15:26:41. **La ventana se abre 29 minutos después
  de publicar**, con el trabajo normal de la misma tarde.
- `v2.6.0` apunta a `4c313a4`, el propio commit de release: el árbol del tag es
  el mismo desde el que el `prepack` construyó el payload. Por eso fijar el tag
  cierra la divergencia de raíz.
- `RELEASING.md` publicaba en npm en el §6 y empujaba el tag en el §7, en ese
  orden.

La spec 040 resuelve la ref por la versión del propio paquete. Con el orden
anterior intacto, ese arreglo quedaba desactivado: entre el `npm publish` y el
`git push --tags` el paquete ya es instalable y su tag todavía no existe en el
remoto, así que toda instalación hecha en esa ventana caería al fallback —la
rama por defecto, es decir HEAD— que es exactamente el defecto que la spec
cierra. El borrador de la spec afirmaba «esta spec no cambia el proceso de
release»; la revisión demostró que esa afirmación era falsa y que sostenerla
habría entregado un arreglo inerte.

## Decision / Decisión

**El tag se empuja antes de `npm publish`.** `RELEASING.md` invierte sus pasos
§6 y §7: primero `git tag vX.Y.Z && git push origin main --tags`, después las
tres publicaciones de npm.

## Alternatives considered / Alternativas consideradas

1. **Dejar `RELEASING.md` como estaba y confiar en que la ventana es corta.**
   Descartada. La ventana es de minutos, pero es exactamente el momento de
   máxima probabilidad de instalación: `@latest` ya resuelve a la versión nueva
   y el anuncio del release es lo que trae gente a instalar.
2. **Añadir una nota al §7 recordando empujar el tag pronto.** Descartada. Una
   nota no cambia el orden en que se ejecutan los comandos, y el documento
   existe precisamente porque el orden se olvida.
3. **Que el instalador reintente contra la rama por defecto sin avisar cuando
   el tag falte.** Descartada por la decisión 2 de la spec: un fallback
   silencioso es el defecto original con otro nombre.
4. **La adoptada**: invertir los dos pasos, con el fallback conservado y
   anunciado para los casos legítimos (desarrollo local, réplicas sin tags).

## Consequences / Consecuencias

- Se rompe a conciencia la regla con la que abre `RELEASING.md` —«todo va antes
  de `npm publish`, porque npm no deja despublicar»—. Los dos errores no son
  del mismo tipo: un tag empujado de más se borra con
  `git push origin :refs/tags/vX.Y.Z`; una versión de npm publicada se queda
  pública para siempre. Se acepta el error reversible para eliminar el
  irreversible.
- El riesgo residual es la ventana entre el push del tag y el `npm publish`. En
  ella no hay nada instalable todavía, así que no afecta a ningún usuario.
- La verificación del §4 —instalar los tarballs «como un desconocido»— corre
  antes de que el tag exista, por diseño: el tag no se empuja hasta que la
  compuerta del §5 pasa. Por eso ese comando lleva ahora `--ref main`
  explícito, en vez de imprimir una advertencia de fallback en cada release
  hasta que nadie la lea.
- Las instalaciones anteriores a la v2.7.0 conservan la divergencia hasta que
  se reinstalen o se actualicen. La acción correcta en ellas es no aplicar
  nada: su archivo es el más nuevo.

## Verification / Verificación

Medido el 2026-08-25 con el arreglo puesto, misma máquina y mismo
`sdd-mcp@2.6.0` en los dos casos:

| Instalación | `sdd-mcp upgrade --dry-run` |
|---|---|
| desde el tag `v2.6.0` (comportamiento nuevo) | «Ya está al día: no hay nada que hacer» |
| desde `main` con `--ref` (comportamiento viejo) | `specs/_template/spec.md` reportado como divergente |

El `diff -rq` entre ambas instalaciones devuelve exactamente un archivo de
contenido distinto, `specs/_template/spec.md`, más el sello `installed_at` de
`.sdd/TEMPLATE_VERSION`.

## When to revisit / Cuándo revisar esta decisión

- Si el release deja de hacerse a mano y pasa a un flujo automatizado que
  publique tag y npm en la misma transacción, el orden deja de importar y esta
  decisión pierde su motivo.
- Si alguna vez un tag se empuja con un árbol equivocado y hay que borrarlo del
  remoto, conviene comprobar que el coste real de esa reversión sigue siendo el
  que aquí se asume.
- Si `create-sdd-project` dejara de clonar el repositorio —por ejemplo, si el
  contenido pasara a viajar dentro del propio paquete npm— desaparecería la
  dependencia del tag y con ella esta decisión.
