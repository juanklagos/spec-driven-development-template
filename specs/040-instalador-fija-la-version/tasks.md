# Tareas 040 - El instalador entrega la versión que dice entregar

## Fase 1 — Resolución de ref

- [x] Leer la versión propia en `index.mjs` desde su `package.json` vía `import.meta.url`, sin dependencias nuevas
- [x] Añadir `--ref <git-ref>` al parser de flags existente y a la salida de `--help`
- [x] Comprobar existencia del tag con `git ls-remote --tags <REPO> refs/tags/v<version>`, evaluando la salida y no el código de retorno
- [x] Pasar `--branch <ref>` al `git clone` de `index.mjs:100`
- [x] Imprimir siempre la ref utilizada antes de copiar archivos
- [x] Imprimir advertencia nombrando el tag ausente y la ref usada cuando se cae a la rama por defecto
- [x] Fallar con mensaje explícito, sin fallback, cuando la ref de `--ref` no existe

## Fase 2 — Verificación end-to-end

- [x] Instalar en directorio temporal con el paquete local apuntando a un tag publicado
- [x] Comparar el sidecar instalado contra el payload de `@juanklagos/sdd-core` de esa misma versión — hecho con el `--dry-run`, que conoce el mapeo de variantes; un `diff` ingenuo cae en la trampa del §R4 y sobre-reporta 16 archivos que solo están templatizados en la instalación
- [x] Contrastar instalación-desde-tag contra instalación-desde-`main`: la única diferencia de contenido es `specs/_template/spec.md`
- [x] Ejecutar `sdd-mcp upgrade --dry-run` sobre esa instalación y comprobar cero archivos divergentes
- [x] Confirmar que `package.json` viaja junto a `index.mjs` en el tarball (`npm pack` y revisar rutas)

## Fase 3 — Los tres caminos

- [x] Camino tag existente: verifica ref usada y contenido
- [x] Camino tag ausente (versión inventada): verifica que completa, que usa rama por defecto y que lo advierte
- [x] Camino `--ref` a rama existente: verifica que la clona y la nombra
- [x] Camino `--ref` a ref inexistente: verifica que falla sin caer a otra ref
- [x] Repetir el camino principal en modo `full`, no solo en `sidecar`

## Fase 4 — Proceso de release y documentación

- [x] Invertir §6 (publicar en npm) y §7 (tag) en `RELEASING.md`: el tag se empuja primero
- [x] Explicar en `RELEASING.md` por qué el orden importa ahora y cómo se deshace un tag empujado por error (`git push origin :refs/tags/vX.Y.Z`)
- [x] Añadir `--ref main` al comando de verificación del §4, que corre antes de que el tag exista
- [x] Comprobar que el `grep` de verificación del §1 y el resto de pasos siguen siendo correctos tras la renumeración
- [x] Documentar `--ref` en `packages/create-sdd-project/README.md`
- [x] Registrar en `bitacora/decisiones/` la inversión del orden de release, con la cronología medida de la v2.6.0 y el riesgo aceptado
- [x] Actualizar `history.md` de esta spec con lo implementado y lo verificado

## Fuera de alcance (no hacer en esta spec)

- [ ] ~~Corregir el texto de `sdd-mcp upgrade` que atribuye la divergencia al usuario~~ — spec aparte
- [ ] ~~Prohibir commits posteriores a publicar~~ — decisión 4 de la spec: se elimina la consecuencia, no la práctica
- [ ] ~~Arreglar que `scripts/new-spec.sh` no pueda crear specs en la raíz del framework~~ — hallazgo colateral, research.md §R9
- [ ] ~~Que la compuerta bloquee en vez de avisar cuando una spec está Pendiente~~ — hallazgo colateral, research.md §R11
- [ ] ~~Versionar el payload de `sdd-core`~~ — no es la causa, verificado
