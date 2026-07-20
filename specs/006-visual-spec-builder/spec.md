# Especificación 006 - visual-spec-builder (SDD Builder)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-20`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): El autor pidió el builder visual ("arrastrar, soltar... tarjetas, con uniones... si no existe, que lo creemos") y eligió "Opción B: Ambiciosa" en la pregunta de alcance (2026-07-20). Investigación previa en `idea/PROPUESTA_BUILDER_2026-07-20.md`. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como persona que hace vibe coding (técnica o no), quiero construir mi proyecto SDD gráficamente — arrastrando tarjetas de Idea, Épica, Spec y Tareas, uniéndolas con conexiones y viendo las tareas de cada tarjeta — para que el builder genere y mantenga las specs markdown reales del template sin que yo tenga que escribir estructura a mano.

## Escenarios de aceptación

1. Dado un usuario con el template corriendo, cuando abre `http://127.0.0.1:3334/builder`, entonces ve un lienzo con las specs existentes como tarjetas y puede arrastrarlas libremente.
2. Dado el lienzo, cuando el usuario arrastra desde la paleta una tarjeta "Spec" y le pone título, entonces se crea la carpeta `specs/NNN-slug/` real con su bundle (spec/plan/tasks/history) vía sdd-core.
3. Dado una tarjeta de spec, cuando el usuario abre su detalle, entonces ve y edita las tareas (checkboxes) y los cambios se escriben en `tasks.md` real.
4. Dado el lienzo, cuando el usuario conecta dos tarjetas, entonces la unión se persiste en `specs/board.canvas` (formato JSON Canvas) sin tocar los .md.
5. (Fase 2) Dado un `tasks.md` editado externamente, cuando cambia en disco, entonces la tarjeta se actualiza sin recargar.
6. (Fase 3) Dado un cliente MCP con soporte MCP Apps, cuando invoca la vista del board, entonces ve el estado del lienzo dentro del cliente.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO el builder escriba en disco, EL SISTEMA DEBERÁ tratar los .md como fuente de verdad y editar quirúrgicamente (sin destruir contenido no gestionado).
- CUANDO se elimine `board.canvas`, EL SISTEMA DEBERÁ regenerar un layout por defecto sin pérdida de contenido de specs.
- CUANDO una escritura falle la validación, EL SISTEMA DEBERÁ responder con error claro y no dejar archivos a medias.
- EL SISTEMA DEBERÁ funcionar con el workspace resuelto igual que /dashboard (SDD_PROJECT_ROOT, autodetección, guard del template root).
- EL SISTEMA DEBERÁ ser bilingüe EN/ES en la UI.

## Requisitos

- R1 (Fase 1 — MVP): módulo `board` en `@juanklagos/sdd-core`: parse/serialize de `tasks.md` (checkboxes), lectura/escritura de `specs/board.canvas` (JSON Canvas), acceso seguro a documentos de spec (solo archivos conocidos dentro de specs/).
- R2 (Fase 1): API REST en el transporte HTTP de `sdd-mcp`: GET/PUT board, GET spec detail, PUT tasks, POST create spec (usa `createSpec` existente).
- R3 (Fase 1): frontend `builder/` (Vite + React + TS + @xyflow/react + @dnd-kit): canvas con tarjetas tipadas (Idea/Épica/Spec/Tareas), uniones, paleta drag-and-drop, panel de detalle con tareas; build estático servido en `/builder`.
- R4 (Fase 2): sync en vivo md→canvas (watcher + WebSocket/SSE) con reconciliación por IDs estables (carpetas NNN-slug).
- R5 (Fase 3): MCP App (SEP-1865) en sdd-mcp con vista del board para clientes compatibles.
- R6 (Fase 4): modo demo en el sitio (Pages) y documentación de usuario (guía nueva EN/ES).

## Fuera de alcance / Out of scope

- Multiusuario/colaboración en tiempo real; hosting SaaS; edición rica de spec.md completa en el canvas (v1 edita título+tareas; el contenido largo se abre en el editor del usuario).

## Criterios de éxito

- Flujo end-to-end verificado: crear tarjeta → carpeta spec real → editar tareas → gate scripts en verde.
- 3 scripts SDD, build y typecheck del monorepo en verde en cada fase.
