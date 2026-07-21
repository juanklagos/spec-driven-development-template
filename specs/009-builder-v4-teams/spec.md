# Especificación 009 - builder-v4-teams (SDD Builder v4: equipos)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-20`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-20 — el autor respondió "hazlo todos" a los paquetes propuestos en `idea/IDEAS_BUILDER_V2_2026-07-20.md`. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como equipo que usa SDD, queremos vista kanban, dependencias con significado, issues de GitHub desde las tarjetas y saber quién está mirando el board, para coordinar trabajo real sobre las mismas specs.

## Criterios de aceptación (EARS)

- CUANDO el usuario cambie a vista Kanban, EL SISTEMA DEBERÁ agrupar las specs por estado (Borrador/Aprobada/Hecha) desde los .md reales, con la misma data del canvas y sin duplicar estado.
- CUANDO una unión se marque como "bloquea/depende de", EL SISTEMA DEBERÁ persistir el tipo en board.canvas y el chequeo de gate del builder DEBERÁ avisar (warning visual) si una spec aprobada depende de una no aprobada.
- CUANDO el usuario pulse "Crear issues" en una tarjeta, EL SISTEMA DEBERÁ generar un issue de GitHub por tarea pendiente vía gh CLI (si está autenticado), con títulos trazables al spec id, e informar resultado por tarea.
- CUANDO haya más de un cliente conectado, EL SISTEMA DEBERÁ mostrar presencia (contador/avatars anónimos) vía el hub SSE existente.
- EL SISTEMA DEBERÁ ser bilingüe EN/ES y degradar con gracia sin gh o sin conexión.

## Requisitos

- R1 Vista Kanban (toggle lienzo↔columnas; drag entre columnas NO cambia aprobación — solo lectura de estado en v1 con CTA al botón Aprobar).
- R2 Edges tipados (depende de/bloquea/relacionada) + warning de dependencias en el semáforo del gate del builder.
- R3 Tasks→issues por tarjeta (endpoint que usa gh CLI; idempotencia básica por título).
- R4 Presencia ligera por SSE (join/leave, contador en TopBar).
- R5 Docs: guía 51 sección equipos; CHANGELOG.

## Fuera de alcance

Locks duros de edición, auth multiusuario, sincronización remota entre máquinas.

## Criterios de éxito

Builds/typecheck/mcp:test verdes; kanban y canvas consistentes; issues creados en repo de prueba o simulados con gh --dry-run documentado; presencia visible con 2 pestañas.
