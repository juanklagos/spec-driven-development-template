# Especificación 007 - builder-v2-easy (SDD Builder v2: fácil)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-20`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-20 — el autor respondió "hazlo todos" a los paquetes propuestos en `idea/IDEAS_BUILDER_V2_2026-07-20.md`. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como principiante de vibe coding, quiero que el builder me guíe y me dé feedback visual del gate sin conocer markdown ni terminal, para completar el flujo SDD entero desde el lienzo.

## Criterios de aceptación (EARS)

- CUANDO el board cargue, EL SISTEMA DEBERÁ mostrar un chip vivo del estado del gate (verde/rojo) y un botón "Validar ahora" que ejecute la validación real y pinte errores como badges sobre la tarjeta afectada.
- CUANDO el usuario pulse "Aprobar spec" y confirme, EL SISTEMA DEBERÁ escribir la sección de aprobación real (estado/fecha/aprobador) en spec.md.
- CUANDO sea la primera visita, EL SISTEMA DEBERÁ ofrecer un tour de 5 pasos (paleta→crear→conectar→tareas→gate) descartable y re-lanzable.
- CUANDO el usuario elija una plantilla de la galería, EL SISTEMA DEBERÁ crear las specs reales y el layout conectado en un workspace con specs vacías.
- CUANDO el usuario edite la spec con el editor guiado, EL SISTEMA DEBERÁ escribir secciones (historia, escenarios, criterios EARS con autocompletado, fuera de alcance) quirúrgicamente sin destruir contenido ajeno.
- EL SISTEMA DEBERÁ soportar deshacer/rehacer de operaciones de canvas y exportar el board a PNG.
- EL SISTEMA DEBERÁ ser bilingüe EN/ES.

## Requisitos

- R1 Semáforo del gate + validar ahora (API: endpoint gate/validate reutilizando sdd-core checkGate/validateProject; badges por tarjeta).
- R2 Botón "Aprobar spec" (API + core: escritura quirúrgica de la sección de aprobación).
- R3 Tour de bienvenida (localStorage, 5 pasos, bilingüe).
- R4 Galería de plantillas (App web, API/Backend, E-commerce, SaaS) → crea specs reales + edges; basadas en la guía 27.
- R5 Editor guiado de spec.md en el drawer (secciones + autocompletado EARS).
- R6 Undo/redo de canvas + export PNG.

## Fuera de alcance

Asistente IA, kanban, dependencias semánticas, issues, presencia (specs 008/009).

## Criterios de éxito

Builds y typecheck verdes; mcp:test verde; smoke REST sin regresión; flujo completo verificable en navegador contra sandbox.
