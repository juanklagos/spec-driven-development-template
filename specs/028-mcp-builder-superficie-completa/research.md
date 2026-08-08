# Investigación 028 - superficie completa MCP + builder

## Pregunta

¿Qué capacidades del núcleo y de los scripts siguen inalcanzables para un
agente solo-MCP o un usuario solo-canvas, y cómo exponerlas sin duplicar
lógica?

## Hallazgos (auditoría 2026-08-08, sesión de chat)

- Inventario MCP: 28 herramientas en `server.ts` (21 → 28 en la spec 027).
  REST del Builder: `/api/events`, `/api/board` (GET/PUT), `/api/gate`,
  `/api/spec` (POST), `/api/spec/:id` (GET), `/api/spec/:id/tasks` (PUT,
  solo toggle), `/api/spec/:id/approve`, `/api/spec/:id/consent`,
  `/api/spec/:id/sections` (PUT), `/api/spec/:id/issues` (POST).
- Mapa de huecos (capacidad → dónde existe → dónde falta):
  - Chequeo de política → `checkPolicy` en core + bash → falta herramienta MCP
    independiente (solo viaja dentro del gate).
  - Descubrimiento legado → `scripts/legacy-discovery.sh` (requiere `rg`) →
    falta en MCP y en cualquier superficie sin bash.
  - Escritura de documento → `writeSpecDocument` en core → falta herramienta
    MCP (solo lectura + secciones estructuradas).
  - Renombrar/eliminar/reordenar tareas → en ningún sitio → falta en core,
    MCP y REST (la REST solo alterna hechas; ni siquiera puede añadir).
  - Cambiar estado/prioridad en INDEX → en ningún sitio (solo append) → falta
    en core, MCP y REST; hoy es edición manual.
  - Puntaje de spec → `scoreSpec` en core + `sdd_score_spec` (027) → falta en
    REST y en la UI (el drawer no lo muestra).
  - Bitácora leer/escribir → core completo (027 + writers) → falta REST y UI.
  - Regenerar STATUS/roadmap → core + MCP → falta REST y UI.

## Decisiones derivadas de los hallazgos

- **Port TS para legado, no execFile**: `legacy-discovery.sh` depende de `rg`,
  inasumible en máquinas npm/Desk — misma regla que llevó a portar
  `score-spec.sh` en la 027 (decisión
  `2026-07-23-mcp-score-port-y-sidecar-execfile.md`).
- **7 herramientas MCP explícitas** en vez de meta-herramientas con
  subcomandos: es el estilo del servidor (cada operación con su nombre y
  schema), y el smoke test pinea la superficie.
- **Toda ruta REST nueva delega en core**: la cabecera de `api.ts` lo exige
  («no board logic lives in the transport»); el Builder y las herramientas MCP
  no pueden divergir porque comparten función.
- **El resumen EARS del drawer reutiliza `builder/src/ears.ts`** (spec 008),
  no el endpoint de core: el lint ya vive en el frontend por diseño y unificar
  las dos copias es trabajo de otra spec.
