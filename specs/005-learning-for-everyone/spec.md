# Especificación 005 - learning-for-everyone

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-17`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-17 — "necesito que las ejecutes todas... que cualquiera pueda aprender, de no desarrolladores hasta avanzados". Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como persona de cualquier nivel (no programador, dev, avanzado), quiero que la documentación y el aprendizaje estén organizados por nivel con señales claras, y un curso interactivo guiado, para aprender SDD sin perderme entre 51 guías.

## Criterios de aceptación (EARS)

- CUANDO un visitante abra el sitio, EL SISTEMA DEBERÁ mostrar cada guía con su nivel (Básico/Intermedio/Avanzado/Referencia) visible en la navegación.
- CUANDO un alumno entre a la landing, EL SISTEMA DEBERÁ ofrecer rutas explícitas por audiencia con su primer enlace.
- CUANDO un alumno abra el curso interactivo, EL SISTEMA DEBERÁ guiarlo paso a paso con verificación automática por Actions (formato GitHub Skills).

## Requisitos

- R1. Badges de nivel por guía en el sidebar del sitio (mapa número→nivel en el sync, bilingüe).
- R2. Landing del sitio con rutas por nivel enlazadas (13/14/15).
- R3. Curso interactivo formato GitHub Skills en repo aparte `juanklagos/aprende-sdd` (plantilla, bilingüe, 4 pasos con workflows que verifican el avance), enlazado desde README y sitio.
- R4. Trazabilidad y validación estándar.

## Fuera de alcance

- Reescritura editorial de las 102 guías (el nivelado se logra con la capa de navegación + tutor existente).
- Publicaciones npm/Registry/Marketplace (autor).

## Criterios de éxito

- Sitio construye en verde con badges; curso publicado y accesible; validaciones SDD en 0 errores.
