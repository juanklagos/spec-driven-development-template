# Especificación 010 - builder-v5-pro-ux

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-21`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-21 — el autor pidió: cada sección del template editable en su propio form, uniones con propósito, idioma es/en según corresponda (no labels dobles "que se ve horrible"), y shadcn para UI moderna. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como usuario del builder, quiero editar CADA sección del template de spec en su propio formulario ordenado, en MI idioma (no bilingüe simultáneo), con una UI moderna (shadcn), y que las uniones entre tarjetas tengan propósito visible, para construir specs completas sin tocar markdown.

## Criterios de aceptación (EARS)

- CUANDO el usuario abra el builder, EL SISTEMA DEBERÁ detectar el idioma (navegador, con switcher ES/EN persistente) y mostrar TODOS los textos solo en ese idioma.
- CUANDO el usuario edite una spec, EL SISTEMA DEBERÁ ofrecer un formulario por CADA sección del template (aprobación con sus 4 campos, historia, escenarios, criterios EARS, requisitos, propiedades, criterios de éxito, fuera de alcance) con escritura quirúrgica por sección.
- CUANDO el usuario cree una unión, EL SISTEMA DEBERÁ pedir/mostrar su propósito (depende de/bloquea/contiene/relacionada) con color e icono distintivos, y el detalle de una tarjeta DEBERÁ listar sus relaciones entrantes/salientes.
- EL SISTEMA DEBERÁ usar shadcn/ui (+Tailwind) manteniendo dark/light y sin romper React Flow ni las features existentes (tour, kanban, asistente, gate, undo, PNG, SSE).
- EL SISTEMA DEBERÁ conservar los .md como fuente de verdad y todas las APIs/tools existentes sin cambios de contrato.

## Requisitos

- R1 i18n real: diccionario es/en, detección + switcher en TopBar, cero labels dobles en toda la UI (incl. tour, toasts, errores).
- R2 Editor completo por secciones: extender updateSpecSections (sdd-core) a todas las secciones del template (incl. requisitos como lista, propiedades, criterios de éxito) + form de aprobación que use approveSpec/campos; tabs o acordeón ordenado en el drawer (o página de detalle).
- R3 Uniones con propósito: selector al crear (no solo doble clic después), iconos+colores por tipo, panel de relaciones en el drawer, "contiene" para épica→spec.
- R4 Migración visual a shadcn/ui + Tailwind v4 en builder/ (Button, Dialog, Tabs, Drawer/Sheet, Badge, Tooltip, Toast, Select, Accordion), estética nítida, dark/light.
- R5 Docs: sección "Conecta tu agente (Claude Code/Codex/Gemini/ChatGPT)" en guía 51 EN/ES con los comandos exactos por cliente.

## Fuera de alcance

- Cambios de API/contratos; edición de plan.md/tasks.md por forms (siguiente iteración); reescritura del sitio.

## Criterios de éxito

- Builds/typecheck/mcp:test verdes; features previas intactas (smoke navegador); UI en un solo idioma a la vez; screenshots nuevos de verificación.
