# Plan 013 - Integridad de la compuerta

## Resumen

Cuatro arreglos independientes, ninguno con funcionalidad nueva. Se pueden entregar en cualquier
orden y cada uno es reversible por separado. El de la Action es el único con criterio de diseño real;
los otros tres son corrección.

## Contexto técnico

**El aviso de la Action.** La decisión del 2026-07-21 se apoya en `TEMPLATE_VERSION`, que hoy se
escribe y no lee nadie. Implementarla significa leerlo en `action.yml` y comparar contra la versión de
la propia Action. Tres estados: igual (silencio), workspace más viejo (aviso con ambas versiones y el
comando), ilegible o ausente (aviso de que no se puede determinar). Nunca cambia el código de salida.

Comparar versiones en bash sin `sort -V` —que no está garantizado en macOS— se resuelve con
`sort -t. -k1,1n -k2,2n -k3,3n`, que funciona en ambos y evita depender de GNU coreutils.

**La raíz del proyecto.** `git rev-parse --show-toplevel` resuelve worktrees y submódulos y devuelve
la ruta canónica. Hay que conservar el camino sin git: la función también sirve en directorios que no
son repositorios, y ahí el comportamiento actual —subir hasta encontrar marcadores— sigue siendo el
correcto.

**El `.gitignore`.** Una función en `scripts/lib/sdd-gitignore.sh`, idempotente, que añade solo las
entradas que falten y nunca reescribe el archivo. Los dos andamiadores la sourcean, igual que ya
hacen con `sdd-attribution.sh`. Ese es el patrón que este repo ya eligió y no hay motivo para otro.

**El INDEX.** `install-spec-sidecar.sh` ya escribe uno limpio; `init-project.sh` copia el del
framework. Se alinea el segundo con el primero.

## Fases de implementación

1. **`sdd_project_root` con `git rev-parse`**, conservando el camino sin git. Es la base sobre la que
   se apoyan los demás y la que la spec 014 va a cargar.
2. **`scripts/lib/sdd-gitignore.sh`** con `sdd_ensure_gitignore`, y los dos andamiadores sourceándola.
3. **`init-project.sh`**: INDEX limpio en vez del del framework.
4. **`action.yml`**: lectura del sello, comparación y aviso. Va la última porque es la que corre en el
   CI de otras personas y conviene tenerla sobre una base ya verificada.
5. **Cobertura** de los cuatro en `scripts/test-mcp-integration.mjs`, cada una probada fallando contra
   el código anterior.

## Dependencias

- Ninguna externa.
- La spec 014 depende de la fase 1: su detector resuelve rutas contra la raíz del proyecto.

## Hitos

- **H1** — raíz correcta en worktree y submódulo (fase 1).
- **H2** — andamiadores dejan el destino bien (fases 2 y 3).
- **H3** — la mitigación de la decisión del 2026-07-21 existe de verdad (fase 4).

## Riesgos

- **Cambiar la Action afecta al CI de terceros.** Mitigación: el aviso nunca altera el código de
  salida, y el camino sin sello sigue funcionando exactamente igual que hoy.
- **`git rev-parse` puede devolver una raíz distinta a la esperada** en un repo anidado. Mitigación:
  solo se usa cuando el directorio está dentro de un repositorio; en cualquier otro caso, el
  comportamiento actual se conserva intacto.
- **Escribir en el `.gitignore` del usuario es tocar un archivo suyo.** Mitigación: solo se añade lo
  que falta, bajo un encabezado identificable, sin reordenar ni borrar nada.
