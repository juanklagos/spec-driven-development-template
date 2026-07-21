# Especificación 008 - builder-v3-ai (SDD Builder v3: IA)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-20`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-20 — el autor respondió "hazlo todos" a los paquetes propuestos en `idea/IDEAS_BUILDER_V2_2026-07-20.md`. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como usuario de vibe coding, quiero describir mi proyecto en una frase y ver nacer el board completo (idea→épicas→specs conectadas), y luego lanzar la implementación de una spec aprobada a mi agente, para ir de idea a código sin salir del flujo visual.

## Criterios de aceptación (EARS)

- CUANDO el usuario describa su proyecto en el asistente ✨, EL SISTEMA DEBERÁ generar un plan de tarjetas (idea, épicas como notas, specs reales conectadas) y presentarlo como borrador aceptable/regenerable antes de escribir en disco.
- CUANDO el usuario acepte el borrador, EL SISTEMA DEBERÁ crear las specs reales vía sdd-core y persistir nodos y uniones en board.canvas.
- CUANDO el usuario pulse "Implementar con agente" en una spec aprobada, EL SISTEMA DEBERÁ preparar el prompt exacto (gate + spec activa) y copiarlo/lanzarlo para Claude Code; si la spec no está aprobada, DEBERÁ negarse mostrando el hard stop.
- CUANDO el usuario escriba criterios en el editor guiado, EL SISTEMA DEBERÁ lint-ear EARS en vivo (patrón CUANDO/WHEN + DEBERÁ/SHALL, palabras vagas) con sugerencias no bloqueantes.
- EL SISTEMA DEBERÁ funcionar sin API key propia: la generación IA se delega al agente del usuario vía las tools MCP (sdd_board_*) con un prompt orquestador documentado, y el asistente de la UI DEBERÁ ofrecer modo plantilla+heurística cuando no haya agente conectado.

## Requisitos

- R1 Asistente ✨ "Descríbeme tu proyecto" (UI wizard + generación por heurística local de épicas/specs, y prompt orquestador para agentes vía MCP documentado en guía 51).
- R2 Botón "Implementar con agente" (respeta gate; prompt precargado copiable + deep link si existe).
- R3 Lint EARS en vivo en el editor guiado (regex compartida con sdd-core; bilingüe).
- R4 Docs: guía 51 sección "flujo IA completo"; /sdd:new menciona el asistente.

## Fuera de alcance

Llamadas directas del server a APIs de LLM (sin keys); MCP App embebida (Fase 3 de spec 006).

## Criterios de éxito

Builds/typecheck/mcp:test verdes; asistente genera board real en sandbox; botón implementar bloquea specs no aprobadas.
