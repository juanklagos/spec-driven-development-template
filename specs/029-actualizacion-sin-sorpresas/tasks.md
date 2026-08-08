# Tareas 029 - actualizar SDD sin sorpresas

> Borrador creado el 2026-08-08 tras medir el estado real de la actualización
> contra los paquetes publicados en npm. Pendiente de aprobación.

- [ ] T1 (R1): clasificación de archivos del sidecar como fuente única en `sdd-core` (framework vs conservado), consumida también por `install-spec-sidecar.sh` + test que falle si el instalador copia un archivo que la clasificación no conoce.
- [ ] T2 (R1): `readSidecarVersion` + `compareSidecar` en `sdd-core` — lee `.sdd/TEMPLATE_VERSION`, compara con la versión del paquete y clasifica cada archivo en al día / framework a refrescar / conservado idéntico / conservado divergente. Sin escrituras + tests (sidecar viejo, al día, sin marcador, divergente).
- [ ] T3 (R2): `upgradeSidecar` en `sdd-core` — aplica lo del framework, no escribe lo conservado sin autorización explícita, modo de solo diagnóstico + tests de las 3 propiedades (preservación byte a byte, cero escrituras si está al día, idempotencia).
- [ ] T4 (R3): herramienta `sdd_upgrade` en `server.ts` + shapes en `schemas.ts`. Superficie 35 → 36.
- [ ] T5 (R4): bandera de actualización en `cli.ts` bajo el contrato de la spec 021 (nunca 0 bytes, argumento desconocido en voz alta).
- [ ] T6 (R5): endpoint REST de comparación + aviso de desfase en el Builder con la acción al lado.
- [ ] T7 (R6): `create-sdd-project` nombra el comando de actualización al encontrar `spec/` en vez de abortar a secas.
- [ ] T8 (R7): fijar `@latest` en `.mcp.json` de este repositorio y auditar el resto de comandos publicados.
- [ ] T9 (R2, R8): verificación — vitest en verde, typecheck/build, smoke stdio con el contrato nuevo, smoke HTTP, y E2E real (instalar sidecar viejo → editarlo → actualizar → framework reparado y contenido propio intacto).
- [ ] T10 (R8): guía de actualización ES/EN enlazada desde QUICKSTART y ambos README.
