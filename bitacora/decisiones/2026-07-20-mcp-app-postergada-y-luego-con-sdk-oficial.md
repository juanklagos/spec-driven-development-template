# Decisión clave - Posponer la MCP App hasta que el estándar dejara de moverse, y luego construirla con el SDK oficial / Key decision - Postpone the MCP App until the standard froze, then use the official SDK

## Date / Fecha

2026-07-20

Nota de fecha: el commit `296824a` («feat(mcp-app): SDD board inside AI clients (spec 006 phase 3, SEP-1865)») tiene **fecha de autor 2026-07-20 21:48:34 -0500**, pero `bitacora/diaria/2026-07-21.md:22` lo archiva bajo el 21 y el bloque de `specs/006-visual-spec-builder/history.md:40` se titula «2026-07-21». Fue trabajo de noche que cruzó al día de bitácora siguiente. Aquí manda la fecha de git.

## Context / Contexto

La UI embebida en clientes MCP (MCP Apps, SEP-1865) apareció como opción desde el ciclo de la spec 004 y se fue difiriendo dos veces:

1. **2026-07-17** — queda fuera de alcance de la spec 004: *«MCP Apps (SEP-1865) como UI embebida en clientes: se pospone hasta que el SDK esté maduro; el dashboard HTTP cubre la necesidad hoy»* (`specs/004-site-dashboard-community/spec.md:40`, introducido por `4d5ab1a`, 2026-07-17 11:14:57 -0500; ver también `specs/004-site-dashboard-community/history.md`, bloque 2026-07-17).
2. **2026-07-20** — con la Fase 2 de la spec 006 en `main`, se registra una «decisión senior» aprobada por el autor: *«posponer la Fase 3 (MCP App) hasta después del 2026-07-28 (publicación de la spec MCP final) para no construir sobre un estándar en movimiento; ejecutar ahora la Fase 4 (guía 51 + release v1.6.0)»* (`specs/006-visual-spec-builder/history.md:36-38`; eco en `bitacora/diaria/2026-07-20.md:59`).

La premisa de ambos aplazamientos era la misma: **el estándar y el SDK todavía se movían**.

## Decision / Decisión

Unas **12 horas después** de registrar la pospuesta, y **antes de escribir código**, se verificó el estado real del estándar. La premisa resultó falsa (`specs/006-visual-spec-builder/history.md:42`):

- La spec MCP del 2026-07-28 es una **release candidate congelada desde el 2026-05-21** (ventana de validación de 10 semanas).
- MCP Apps (SEP-1865) tiene **revisión estable propia del 2026-01-26** — *«es decir, la superficie que usamos ya no está en movimiento»*.
- El SDK oficial `@modelcontextprotocol/ext-apps@1.7.4` llevaba publicado desde el **2026-06-05**, con 34 releases desde 2025-12.

Decisión registrada en esa misma entrada: **«implementar con el SDK oficial, no aproximar el patrón a mano»**. Se construyó el recurso `ui://sdd/board.html` (`packages/sdd-mcp/src/app-ui.ts`) y la tool `sdd_board_app` (`packages/sdd-mcp/src/app.ts:104`), componiendo `getBoardView` + `getGateSummary` de `sdd-core` (`app.ts:30,122`) — la misma capa que ya alimenta `/builder` y la API REST. Eso forzó el bump del peer `@modelcontextprotocol/sdk ^1.27.1 → ^1.29.0` (hoy visible en `packages/sdd-mcp/package.json:19-20`).

Es decir: **la decisión de posponer se revirtió por evidencia, no por impaciencia** — y la evidencia se buscó justo antes de codificar, que es cuando debía haberse buscado la primera vez.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Aproximar el patrón MCP Apps a mano**, sin el SDK | Con el SDK oficial publicado y la superficie estable desde el 2026-01-26, escribir el bridge a mano solo añade una superficie propia que mantener contra un estándar ajeno |
| **Construir la Fase 3 antes** (p. ej. en la spec 004) | En ese momento el RC aún no estaba congelado (la congelación es del 2026-05-21) y el dashboard HTTP ya cubría la necesidad |
| **Seguir esperando al 2026-07-28** | La razón de esperar era que el texto podía cambiar; verificado que estaba congelado, esperar solo retrasaba valor sin reducir riesgo |

## Consequences / Consecuencias

**A favor**
- El board de SDD (tarjetas, grafo, semáforo de compuerta) vive dentro de los clientes de IA sin salir a un navegador.
- Cero código de dominio duplicado: la App consume la misma capa `sdd-core` que el builder y la API.

**Costo aceptado, con su propio disparador de reversión**
- Los recursos `ui://` deben ser autocontenidos y los scripts inline no pueden importar bare specifiers. Por eso el bundle del bridge oficial (~330 KB) se **inyecta inline en read-time**, reescribiendo su único `export{…}` final a un global: `inlineEsmExports` en `packages/sdd-mcp/src/app.ts:56` — exportada y cubierta por test, y diseñada para **fallar ruidosamente si el bundle cambia de forma** (`app.ts:61,75`). Debe retirarse si el SDK publica un bundle IIFE/global oficial.
- `packages/sdd-mcp/src/app-ui.ts:1-11` documenta el HTML autocontenido: sin CDNs, sin peticiones externas, sin template literals ni la secuencia `</script`.
- Techo adicional del canal: la CSP por defecto de la vista es `connect-src 'none'` — *la vista no puede hablar con el server HTTP local ni con el stream SSE; todo va y vuelve por `tools/call`* (`idea/EVALUACION_DESKTOP_2026-07-21.md:144`, sección «Fase 4 — Reencuadrar el MCP App que ya enviaste»).

**Hasta dónde llega la verificación**
- La interacción host↔iframe se verificó **por protocolo y estándar, no dentro de un cliente de producción** (`specs/006-visual-spec-builder/history.md:46`).

**Lo que no se pudo reconstruir**
- No hay evidencia en el repo de **por qué no se verificó el estado del estándar antes de decidir posponer** el 2026-07-20. La history registra la decisión y su reversión, no la deliberación intermedia. No se inventa aquí una explicación.

**Estado**
- Vigente. Ningún registro posterior la reemplaza; `bitacora/decisiones/2026-07-21-no-app-escritorio.md` la complementa (reencuadra la MCP App como canal de distribución, no como sustituto del builder).

**Cuándo revisar esta decisión**

Revisión agendada para el **2026-07-28**, con la lista fechada que dejó `specs/006-visual-spec-builder/history.md:46`:

1. Confirmar en el texto final de la spec que `_meta.ui.resourceUri`, `ui://` y `text/html;profile=mcp-app` quedaron tal cual, y subir `ext-apps` si publican versión final.
2. Si el SDK publica un bundle IIFE/global oficial para inline, **retirar `inlineEsmExports`**.
3. Probar en un host real con soporte de Apps (Claude) cuando esté disponible en este entorno.

Además, revisar antes de esa fecha si:
- `inlineEsmExports` falla en CI: significa que el bundle upstream cambió de forma y la técnica ya no aplica.
- La restricción `connect-src 'none'` bloquea una función que el board necesite de verdad (p. ej. sync en vivo dentro del cliente): ahí el canal MCP App deja de ser suficiente y hay que decidir de nuevo.
