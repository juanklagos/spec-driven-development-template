# Tareas 013 - Integridad de la compuerta

Cada tarea es independiente y reversible por separado. T4 la última: corre en el CI de otras personas.

## H1 — La raíz del proyecto

- [x] **T1a** Prueba primero: resolver la raíz desde un worktree de git y desde un submódulo debe dar
      la misma ruta que desde un clon normal. Debe fallar contra el código actual.
- [x] **T1b** `sdd_project_root` detecta `.git` como archivo o directorio vía `sdd_is_git_root` (ver
      desviación en history.md: `git rev-parse` habría cambiado qué raíz se devuelve).

## H2 — Lo que los andamiadores dejan en el proyecto ajeno

- [x] **T2a** `scripts/lib/sdd-scaffold.sh` con `sdd_ensure_gitignore` (ver desviación en history.md): idempotente, añade solo lo
      que falta, bajo un encabezado identificable, sin reordenar ni borrar nada del usuario.
- [x] **T2b** `install-spec-sidecar.sh` e `init-project.sh` la sourcean y la llaman. Copiada al
      destino junto a las otras libs, y añadida al payload de npm.
- [x] **T2c** `init-project.sh` deja de copiar el `INDEX.md` del framework y escribe uno limpio, como
      ya hace el instalador de sidecar.
- [x] **T2d** Prueba: instalar sobre un proyecto con `.gitignore` propio conserva sus líneas; sobre
      uno sin él, lo crea; instalar dos veces no duplica entradas. El INDEX del destino no contiene
      specs ajenas.

## H3 — La mitigación de la decisión del 2026-07-21

- [x] **T3a** Lectura del sello en `action.yml` y comparación con la versión de la propia Action.
      Comparación portable: `sort -t. -k1,1n -k2,2n -k3,3n`, no `sort -V`.
- [x] **T3b** Tres estados: igual → silencio; workspace más viejo → aviso con ambas versiones y el
      comando de actualización; ausente o ilegible → aviso de que no se puede determinar.
- [x] **T3c** El código de salida de la Action no cambia en ninguno de los tres. Verificado.
- [x] **T3d** La resolución de scripts sigue exactamente igual: el consumidor gana cuando los tiene.
      La decisión del 2026-07-21 no se revierte, se completa.
- [x] **T3e** Actualizar esa decisión con una nota: la mitigación que declaraba pasa de enunciada a
      implementada, con fecha.

## H4 — Cierre

- [x] **T4a** Cobertura de los cuatro arreglos en `scripts/test-mcp-integration.mjs`, cada una
      verificada fallando contra el código anterior.
- [x] **T4b** Registro de decisión si aparece alguna elección real durante la implementación.
- [x] **T4c** CHANGELOG.

## Verificación de cierre

- [x] Los cuatro scripts SDD en 0 errores.
- [x] `npm run mcp:test` y `npm run mcp:pack:smoke` en verde.
- [x] Andamiadores probados en sandbox sobre un proyecto ajeno con `.gitignore` propio.
- [x] La Action probada en los tres estados de versión.
