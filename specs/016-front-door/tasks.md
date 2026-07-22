# Tareas 016 - La puerta de entrada

## H1 — La compuerta deja de certificar aprobaciones ajenas

- [x] **T1a** `!<prefix>.sdd/TEMPLATE_VERSION` en las reglas de ignorado.
- [x] **T1b** `init-project.sh` escribe el sello, que hoy no escribe en absoluto.
- [x] **T1c** El aviso compara la marca de tiempo del consentimiento contra `installed_at`.
- [x] **T1d** Sin sello legible: silencio. El propio template no se acusa.
- [x] **T1e** Probado con una copia real del repositorio: avisa. Y en el template: calla.

## H2 — Los comandos de la documentación funcionan

- [x] **T2a** `|| true` en la tubería de `validate-sdd.sh`, y en la copia del payload.
- [x] **T2b** `sdd_write_empty_idea` y `sdd_write_empty_project_log` en `sdd-scaffold.sh`.
- [x] **T2c** Los dos andamiadores las usan en vez de copiar las mías.
- [x] **T2d** Probado: proyecto nuevo sin una sola línea del template.

## H3 — La portada muestra un flujo que termina bien

- [x] **T3a** `demo.tape` andamia antes de ejecutar y trabaja dentro del proyecto creado.
- [ ] **T3b** Regeneración por CI y revisión de un fotograma tardío.

## Verificación de cierre

- [x] Los cuatro scripts SDD en 0 errores.
- [x] `npm run mcp:test` y `npm run mcp:pack:smoke` en verde.
- [x] Copia del template: la compuerta avisa. Template: calla.
- [x] Validación completa sobre un workspace con la idea sin rellenar.
