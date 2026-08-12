# Change history / Historial de cambios

| Date / Fecha | Change type / Tipo de cambio | Summary / Resumen | Files impacted / Archivos impactados | Owner / Responsable |
|---|---|---|---|---|
| 2026-08-08 | Scope / Alcance | Borrador inicial tras la pregunta del propietario «cómo actualizo la versión en un proyecto», y su petición de que actualizar sea fácil y corrompa lo menos posible. Todo el contexto se midió contra los paquetes publicados en npm 2.3.0 y contra el entorno real del propietario, no se supuso: el andamiador aborta sobre un sidecar existente, `sdd_install_sidecar` sí actualiza pero no tiene nombre, cuatro archivos del sidecar cambiaron desde la v1.5.1 y nunca llegan a proyectos existentes, y el `.mcp.json` de este repositorio sirve 21 herramientas en vez de 35 por no fijar `@latest`. El propietario eligió avisar antes de tocar archivos propios (frente a sobrescribir con respaldo o solo reportar) y las cuatro puertas de entrada. Bundle creado manualmente desde `specs/_template` porque `new-spec.sh` y `sdd-core` bloquean la raíz del template (misma vía que las specs 022-028). | `spec.md`, `plan.md`, `tasks.md`, `research.md` | Juan Carlos Alvarez Lagos / Claude |

- 2026-08-12 — Aprobada (evidencia: instrucción explícita del usuario) e
  implementada, T1-T11. Antes de aprobar se añadió la evidencia **D6** medida
  al publicar la 2.4.0: el pin exacto de `sdd-mcp` sobre `sdd-core` hizo que
  npm bajara el 2.3.0 del registro en vez del tarball local, y el paquete
  instalado moría al arrancar. De ahí salió **R9**, la guardia del pin, que es
  la misma familia de defecto que D4 pero en la puerta del mantenedor. También
  se anotó que **R7 ya estaba resuelto** en el commit `014a349`.
  Construido: `sidecar-files.ts` (clasificación única, sincronizada con el
  instalador por prueba), `upgrade.ts` (`readSidecarVersion`, `compareSidecar`,
  `upgradeSidecar`), tools `sdd_upgrade` y `sdd_check_version` (37 → 39),
  verbo `sdd-mcp upgrade` con `--dry-run`/`--apply`, `GET /api/version` y la
  franja `VersionNotice` en el lienzo, redirección del andamiador y guía 52
  ES/EN enlazada desde QUICKSTART y ambos README.
  Pruebas: 121 sdd-core (17 de upgrade, 5 de clasificación, 3 de integridad de
  release), 21 sdd-mcp, 47 builder; ambos smoke tests en verde.
  Verificación E2E real: sidecar instalado, marcador bajado a 2.2.1, gate
  manipulado con `exit 0 # TAMPERED` y política editada a mano → `--dry-run` no
  escribió nada, la aplicación reparó el gate (ejecutable incluido), dejó la
  política y la spec del usuario intactas, movió el marcador a 2.4.0, la
  segunda pasada no tocó nada, y `--apply sdd.policy.yaml` adoptó la versión
  nueva solo cuando se pidió por nombre.
  Hallazgo colateral: una prueba intermitente destapó un bug real de la spec
  031 — los ids de la cola usaban `Date.now()` como prefijo, así que dos
  peticiones creadas en el mismo milisegundo empataban y el orden FIFO caía en
  el sufijo aleatorio. Corregido con un sello monotónico y una prueba de 50
  peticiones seguidas.
