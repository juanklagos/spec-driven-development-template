# Investigación 013 - Integridad de la compuerta

Los cuatro hallazgos salieron del workflow de 17 agentes del 2026-07-21 sobre correlación
código-spec, y los verifiqué uno por uno contra el código antes de escribir esta spec.

## Hallazgos

### 1. `TEMPLATE_VERSION` se escribe y no lo lee nadie

```
$ grep -rn TEMPLATE_VERSION  (fuera del propio escritor)
packages/sdd-core/framework/scripts/test-mcp-integration.mjs:1434  ← solo comprueba que el archivo existe
```

`install-spec-sidecar.sh:195` lo estampa. La decisión del 2026-07-21 sobre los scripts del consumidor
lo invoca en su línea 21 como la mitigación que hace aceptable ejecutar los scripts del proyecto:
*«un sidecar viejo es detectable aunque no se refresque solo»*. Detectable, sí. Detectado, no.

Irónicamente, el comentario en `install-spec-sidecar.sh:176` documenta que alguien ya corrió ese mismo
`grep` y encontró cero resultados — y añadió el escritor sin añadir el lector.

### 2. El disparador de revisión de esa decisión se cumplió

La decisión lista en `:39`: *«Si se añade una regla de compuerta que sea de corrección y no de
política (por ejemplo, un fallo de seguridad en la validación): ahí sí conviene que la Action imponga
su versión, o al menos avise»*.

La spec 012 corrigió un fallo abierto: el `sed` codicioso que leía `approved` donde el archivo decía
`Pendiente`. Es corrección, no política. Un consumidor con sidecar anterior a 2.1.0 ejecuta el
extractor roto y recibe un verde falso.

La misma decisión ya había rechazado «comparar versiones y fallar si el sidecar es viejo» (`:28`),
por castigar al consumidor. La opción que queda, y que el propio registro nombra, es avisar.

### 3. `.git` no siempre es un directorio

`scripts/lib/sdd-root.sh:139` usa `[ -d "$sdd_root/.git" ]`. En un worktree de git y en un submódulo,
`.git` es un **archivo** de texto con una línea `gitdir: ...`. La condición falla y la función sigue
subiendo, devolviendo una raíz equivocada sin decir nada.

### 4. Ningún andamiador escribe `.gitignore` en el destino

```
$ grep -ln gitignore init-project.sh install-spec-sidecar.sh create-www-project.sh
(ninguno)
```

Cualquier diseño que asuma «ese archivo está ignorado» es falso fuera de este repositorio. Salió a la
luz al diseñar el detector de la 014, que quiere artefactos en `.sdd/` con excepciones `!`.

### 5. `init-project.sh` copia el INDEX del framework

`install-spec-sidecar.sh` ya escribe un INDEX limpio para workspaces nuevos —se arregló el 2026-07-21
tras encontrarlo verificando la spec 007—, pero el otro andamiador no recibió el mismo arreglo.

## Decisiones derivadas de los hallazgos

1. **No se revierte la decisión sobre los scripts del consumidor.** Su razón sigue en pie: quien puede
   editar el CI puede quitar la Action entera, así que nunca fue una frontera de seguridad; e imponer
   los scripts propios cambiaría las reglas de repos ajenos entre dos commits. Lo que se hace es
   implementar la mitigación que la decisión ya declara (hallazgos 1 y 2).
2. **El aviso nunca falla el build.** Ya rechazado explícitamente en el registro original, y las
   razones no han cambiado.
3. **Comparación de versiones portable**: `sort -t. -k1,1n -k2,2n -k3,3n` en vez de `sort -V`, que no
   está garantizado en macOS. La misma clase de trampa que la divergencia bash/TypeScript que este
   repo ya sufrió tres veces.
4. **La raíz se resuelve con `git rev-parse --show-toplevel`** solo cuando hay repositorio; el camino
   sin git se conserva intacto, porque la función también sirve en directorios que no son repos
   (hallazgo 3).
5. **Una función de `.gitignore` en `scripts/lib/`**, sourceada por los dos andamiadores, siguiendo el
   patrón que este repo ya eligió con `sdd-attribution.sh`. Nada duplicado (hallazgos 4 y 5).
