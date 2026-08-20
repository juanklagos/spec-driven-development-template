# Historial 031 - Asistencia IA sin copy-paste

- 2026-08-12 (implementación + verificación) — Fases 1-4 completadas.
  Pruebas: sdd-core 80/80, sdd-mcp 14/14 (incluye SSE `kind: request` <2 s y
  rutas REST), builder 47/47 (diff, reglas de presencia/estancamiento con
  reloj inyectado, contrato de montajes R4b); smoke test MCP con 37 tools.
  Verificación end-to-end en navegador contra `www/demo-rediseno` con el
  agente simulado vía el core real: escenario 1 (petición → claim →
  propuesta → diff) ✓, escenario 2 mitad Aceptar (escritura de la sección
  vía PUT sections, tarjeta y campo actualizados en vivo) ✓ — Rechazar
  verificado a nivel core/REST, no en navegador; escenario 3 (braindump →
  spec 005 creada con las 4 secciones y estado Pendiente) ✓; escenario 4
  (sin agente → aviso inmediato + prompt clásico) ✓; escenario 5
  (`sdd_next_request` con contexto completo, sin tocar specs/) ✓. Artefactos
  de prueba del workspace demo eliminados tras la verificación. Ajuste
  durante la implementación: el trigger del popover no usa `asChild` porque
  el Button de la UI no reenvía refs (mismo patrón que GateStatusBar).
  Decisión registrada:
  `bitacora/decisiones/2026-08-12-cola-de-peticiones-ia-el-agente-propone-el-humano-escribe.md`.

- 2026-08-12 — Aprobada por Juan Carlos Alvarez Lagos; consentimiento
  registrado; gate abierto. Corrección factual al iniciar implementación:
  R6 y el escenario 1 citaban `sdd_board_connect` como señal de presencia
  del agente, pero esa herramienta conecta tarjetas del tablero
  (packages/sdd-mcp/src/server.ts:450), no sesiones. La presencia se define
  ahora por la última consulta a la cola (`sdd_next_request` en los últimos
  5 minutos). Mismo comportamiento observable; cambia solo la señal.

- 2026-08-11 (2) — Ampliación de alcance a petición del usuario: la asistencia
  IA cubre TODO campo editable de contenido (7 secciones de spec.md, tareas,
  notas del lienzo, entradas de bitácora), no solo secciones. El tipo
  `draft-section` se generaliza a `draft-field` con objetivo tipado. Nuevo
  R4b: los campos de aprobación/consentimiento quedan explícitamente
  excluidos — siguen siendo entrada humana exclusiva porque son la firma del
  gate. Racional: "la IA puede ampliar las ideas del usuario", pero la
  aprobación no es una idea ampliable.
- 2026-08-11 — Creación del borrador. Origen: conversación sobre fricción del
  flujo copy-first (AssistantWizard/ImplementModal generan prompts que el
  usuario copia a la terminal). Se eligieron las tres funciones más cómodas
  para el usuario: cola de peticiones al agente (mata el copy-paste),
  borrador IA por sección con diff aceptar/rechazar, y braindump → spec
  estructurada. Fuera de alcance deliberado: chat embebido (Agent SDK),
  presencia rica del agente, multi-agente — esta spec construye el canal
  sobre el que se montarían. Decisión clave registrada en el plan: el agente
  propone, solo el humano escribe (la aceptación usa las rutas existentes;
  el gate no cambia).
- 2026-08-20 — Evidencia de aprobación reescrita: registra qué se aprobó y contra qué fuente, sin transcribir el chat. No cambia qué se aprobó, quién ni cuándo (spec 037).
