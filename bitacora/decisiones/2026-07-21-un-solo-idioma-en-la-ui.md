# Decisión clave - La UI del producto muestra un solo idioma a la vez / Key decision - One language at a time in the product UI

## Date / Fecha

2026-07-21

## Context / Contexto

Hasta esta fecha la UI del builder llevaba **EN y ES juntos en la misma etiqueta** ("Guardar / Save"). No era un descuido: era una obligación escrita en varias specs y una convención heredada de la documentación.

El detonante es feedback de uso real, no una preferencia de diseño inferida. La evidencia de aprobación de la spec 010 recoge la frase del autor tal cual (`specs/010-builder-v5-pro-ux/spec.md:9`):

> «idioma es/en según corresponda (no labels dobles "que se ve horrible")»

Eso se convirtió en criterio EARS de la misma spec (`specs/010-builder-v5-pro-ux/spec.md:18`): detectar el idioma con switcher persistente y mostrar **todos** los textos solo en ese idioma.

## Decision / Decisión

El builder —y a continuación `/dashboard`— abandona las etiquetas bilingües simultáneas y adopta **i18n real**:

- Diccionario plano es/en en `builder/src/i18n.ts` (+ store zustand, `useT()`/`translate()`).
- Detección por `navigator.language` (`builder/src/i18n.ts:21`), switcher ES|EN en la TopBar persistido en `localStorage` (`builder/src/i18n.ts:12,33`), `<html lang>` sincronizado.
- Cero textos bilingües simultáneos en toda la UI: tour, paleta, modales, sheet, kanban, toasts, tooltips, aria-labels, plantillas, asistente y prompts copiables.
- El dashboard aplica la misma regla server-side con `resolveDashboardLang` (`packages/sdd-mcp/src/dashboard.ts:162`): `?lang` → `Accept-Language` → `es` por defecto; además degrada el estado crudo de `spec.md` a tooltip para no dejar un badge en español en la página en inglés (commit `9ff2ecb`).

**Qué revierte, y hasta dónde** (esta distinción es el corazón del registro):

Revierte un criterio EARS que varias specs imponían como obligación —`specs/002-interactive-onboarding/spec.md:30` y `specs/003-distribution-and-tutor/spec.md:27` («EL SISTEMA DEBERÁ mantener bilingüe (EN/ES) todo artefacto de cara al usuario») y `specs/006-visual-spec-builder/spec.md:30` («EL SISTEMA DEBERÁ ser bilingüe EN/ES en la UI»)— y también la convención de presentación que el template arrastraba desde el commit `1bd9006` (2026-03-14, *"docs: normalize all EN/ES guides with bilingual, tips, and visual sections"*).

El alcance de la reversión es **solo la UI del producto**. La documentación sigue siendo bilingüe **por artefacto**: `docs/en/` y `docs/es/` mantienen 52 guías cada uno, una por idioma. Es decir: se abandona *"bilingüe en la misma etiqueta"*, se mantiene *"bilingüe por artefacto"*.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Mantener labels dobles en cada control** (el estado previo) | Rechazada por el autor por apariencia: «que se ve horrible». Es la única alternativa que quedó registrada en la evidencia de aprobación |
| **Un solo idioma fijo (solo EN o solo ES)** | No aparece discutida en la evidencia. No la registramos como alternativa evaluada: sería reconstrucción inventada |

## Consequences / Consecuencias

**A favor**
- La UI deja de duplicar cada etiqueta: menos ruido visual en controles, tooltips y prompts copiables.
- El idioma pasa a ser un dato del usuario (navegador + preferencia guardada), no una constante del código.
- `/dashboard` y builder comparten la misma preferencia almacenada, así que no se contradicen entre sí.

**Costos aceptados**
- **Limitación honesta, registrada y no ocultada**: `specs/010-builder-v5-pro-ux/history.md` lo dice tal cual — *«los errores que vienen del SERVIDOR (API/MCP) siguen bilingües»*. El mismo aviso está en el encabezado del módulo (`builder/src/i18n.ts:5-6`). La reversión es **parcial y consciente**.
- Tres specs previas (002, 003, 006) quedan con un criterio EARS que ya no describe el sistema. No se reescribieron: este registro es la anotación de esa divergencia.
- Cada texto nuevo de UI ahora exige dos entradas en el diccionario; olvidar una se ve como una cadena suelta en el idioma equivocado.

**Vigencia**
- **Vigente.** Ningún registro posterior la supersede.
- Commits: `aff7340` (2026-07-21 09:50:55 -0500, builder) y `9ff2ecb` (2026-07-21 10:44:59 -0500, misma regla aplicada a `/dashboard`).
- Ejecución confirmada en `specs/010-builder-v5-pro-ux/history.md`, bloque «2026-07-21 (implementación)», R1.

**Cuándo revisar esta decisión**
- Si se localizan los errores de la API/MCP: entonces desaparece la única excepción viva y esta decisión pasa de "parcial" a "completa" — conviene actualizar el registro y el comentario de `builder/src/i18n.ts`.
- Si entra un tercer idioma: el diccionario plano en un solo archivo deja de escalar y habría que revisar el mecanismo (no la decisión de fondo).
- Si se reescriben las specs 002, 003 o 006: hay que corregir allí el criterio EARS de bilingüismo en UI y enlazar este registro, o la contradicción se vuelve permanente.
- Si aparece evidencia de uso real de que usuarios bilingües necesitan ver ambos idiomas a la vez en algún control concreto (p. ej. términos SDD sin traducción consolidada), revisar como excepción acotada, nunca como vuelta al label doble global.
