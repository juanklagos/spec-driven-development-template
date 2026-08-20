# History 004 - site-dashboard-community

## 2026-07-17

- Spec creada y aprobada como Nivel 3 del backlog; consentimiento registrado.
- Alcance: sitio Starlight, dashboard HTTP, comunidad, server.json. Curso GitHub Skills y publicaciones con cuentas quedan fuera (documentados como T10).
- Decisión: posponer MCP Apps embebido; el dashboard vive en el transporte HTTP existente de sdd-mcp.

## 2026-07-17 (cierre)

- Sitio: 155 páginas construidas (51+51 guías + landings + búsqueda Pagefind); Pages habilitado con build_type=workflow; hallazgo corregido: sintaxis de sidebar autogenerado cambió en Starlight 0.39.
- Dashboard: verificado el happy path contra un workspace sidecar real desechable (gate visible, conteo de aprobación, listado de specs) y la degradación elegante en el template root (guard de sdd-core).
- Discussions habilitadas vía API; server.json preparado para el registry (requiere publicar @juanklagos/sdd-mcp en npm primero).
- 2026-08-20 — Evidencia de aprobación reescrita: registra qué se aprobó y contra qué fuente, sin transcribir el chat. No cambia qué se aprobó, quién ni cuándo (spec 037).
