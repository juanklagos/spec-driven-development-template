# Decisión importante - El registro se corrige en el árbol de trabajo, no en el historial de git

## Date / Fecha

2026-08-20 — decidida en la sesión de la spec 037, antes de tocar el
repositorio (`specs/037-evidencia-de-aprobacion-profesional/`).

## Context / Contexto

El propietario detectó que el repositorio registraba como evidencia formal de
aprobación la transcripción literal de lo que él escribía en el chat: «hazlo»,
«dale», «arranca», «aprobada y hazle con todo nivel senior con solid». Pidió
corregirlo y, en la misma instrucción, que se corrigiera «en el historial de
git, no quiero que nadie vea eso».

Medido el mismo día antes de responder:

- 12 mensajes de commit contienen transcripciones.
- 121 de 258 commits tocan los archivos afectados.
- El primer commit afectado es `933c982` (2026-03-18): reescribir alcanzaría
  al 47% del historial.
- Hay 25 tags publicados que cambiarían de SHA, incluido `v2.6.0`, al que
  apunta la entrada publicada en el registro oficial de MCP.
- El repositorio es público, con 12 estrellas y 1 fork.

## Decision / Decisión

**Se corrige el árbol de trabajo y la plantilla. El historial de git no se
reescribe.**

## Alternatives considered / Alternativas consideradas

1. **Reescribir los 121 commits con `filter-repo` y forzar el push.**
   Descartada. No lograría el objetivo: el fork conserva el historial anterior
   de forma permanente, GitHub sigue sirviendo los commits huérfanos por su
   SHA, y cualquier clon existente lo mantiene. Sería una operación
   irreversible a cambio de una limpieza incompleta.
2. **Reescribir solo los 12 mensajes de commit.** Descartada por la misma
   razón de fondo, y porque igualmente reasigna SHAs desde marzo y obliga al
   force-push con todo su coste.
3. **La adoptada**: corregir el registro vivo —specs, bitácora, log de
   consentimiento— y la plantilla que inducía la práctica.

## Consequences / Consecuencias

- El repositorio queda profesional desde hoy en todo lo que alguien lee: las
  specs, la bitácora y el log de consentimiento.
- El historial conserva las transcripciones. Se asume: son coloquialismos del
  propietario aprobando su propio trabajo, descuidados pero no comprometedores.
- Los 25 tags, las publicaciones de npm y la entrada del registro MCP siguen
  apuntando a commits válidos. Nadie que haya clonado necesita hacer nada.
- Queda constancia de que la corrección fue de forma: ninguna fecha, aprobador
  ni alcance se alteró. Cambiar la sustancia habría sido falsear un registro de
  auditoría, no corregir su redacción.

Hubo además una consideración de oportunidad: la decisión se tomó un día
después de una acusación pública, sin fundamento y ya verificada como falsa, de
que el proyecto contenía una puerta trasera. Reescribir cinco meses de
historial y forzar el push en ese momento se leería como encubrimiento, y el
coste reputacional superaría con creces al de unos coloquialismos en la
bitácora.

## When to revisit / Cuándo revisar esta decisión

- Si alguna vez se cuela en el historial un secreto real —credencial, token,
  clave— la aritmética cambia por completo: ahí la reescritura sí es
  obligatoria, y además urgente, acompañada de la rotación del secreto.
- Si el repositorio dejara de ser público y no tuviera forks ni clones
  externos, el coste de reescribir bajaría lo suficiente como para reconsiderar
  esta decisión por motivos estéticos.
