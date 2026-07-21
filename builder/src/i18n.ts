// Real i18n for the SDD Builder (spec 010, R1). One language at a time — no
// more simultaneous "Guardar / Save" labels anywhere in the UI. Lightweight
// on purpose: a flat ES/EN dictionary + a zustand store (detection from
// navigator.language, persisted switcher in the TopBar) and a `useT()` hook.
// Server failures arrive as machine codes (see packages/sdd-mcp/src/github.ts)
// and are rendered from the `error.code.*` entries below, so no API error
// reaches the UI as a bilingual "es / en" string either.

import { create } from "zustand";

export type Lang = "es" | "en";

const STORAGE_KEY = "sdd-builder-lang";

export function detectLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "es" || stored === "en") return stored;
  } catch {
    // Private mode etc. — fall through to the navigator.
  }
  return typeof navigator !== "undefined" && /^es\b/i.test(navigator.language ?? "") ? "es" : "en";
}

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useI18nStore = create<I18nStore>()((set) => ({
  lang: detectLang(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Non-fatal: the choice simply won't survive a reload.
    }
    set({ lang });
  }
}));

// Keep <html lang> honest for screen readers and hyphenation.
if (typeof document !== "undefined") {
  document.documentElement.lang = useI18nStore.getState().lang;
  useI18nStore.subscribe((state) => {
    document.documentElement.lang = state.lang;
  });
}

type Dict = Record<string, string>;

// ES is the source of truth for the key set. `en` below is typed as
// `Record<keyof typeof es, string>`, so a key added here without its English
// twin (or a typo in either) is a `tsc` error, exactly like the dashboard dict.
const es = {
  // Common
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "common.back": "← Volver",
  "common.retry": "Reintentar",
  "common.remove": "Quitar",
  "common.moveUp": "Subir",
  "common.moveDown": "Bajar",

  // Top bar
  "topbar.save.saved": "Guardado",
  "topbar.save.dirty": "Sin guardar",
  "topbar.save.saving": "Guardando…",
  "topbar.save.error": "Error al guardar",
  "topbar.live.on": "En vivo",
  "topbar.live.off": "Sin conexión en vivo",
  "topbar.live.title.on": "Los cambios en disco se reflejan solos",
  "topbar.live.title.off": "Reconectando con /api/events…",
  "topbar.gate.loading": "Gate…",
  "topbar.gate.open": "Gate abierto",
  "topbar.gate.closed": "Gate cerrado",
  "topbar.gate.blocked": "Gate bloqueado",
  "dash.reason.blocked": "Hay errores que arreglar antes de nada. Implementación bloqueada.",
  "gate.posture.checked": "Comprobado: política, estructura de specs, estado de aprobación, consentimiento por spec y dependencias.",
  "gate.posture.notChecked": "NO comprobado: si el código del proyecto corresponde a una spec aprobada.",
  "topbar.gate.checking": "Comprobando el gate…",
  "topbar.gate.stats": "{errors} errores · {warnings} avisos · {approved}/{total} specs aprobadas",
  "topbar.gate.depTitle": "Dependencias sin aprobar:",
  "topbar.gate.validate": "Validar ahora",
  "topbar.gate.validating": "Validando…",
  "topbar.gate.validateTitle": "Ejecuta la validación real del proyecto",
  "topbar.view.label": "Vista",
  "topbar.view.canvas": "Lienzo",
  "topbar.view.board": "Tablero",
  "topbar.presence.title": "{n} personas viendo este workspace",
  "topbar.undo": "Deshacer",
  "topbar.undo.title": "Deshacer (⌘Z / Ctrl+Z)",
  "topbar.redo": "Rehacer",
  "topbar.redo.title": "Rehacer (⇧⌘Z / Ctrl+Shift+Z)",
  "topbar.png": "PNG",
  "topbar.png.exporting": "Exportando…",
  "topbar.png.title": "Exporta el tablero como imagen",
  "topbar.assistant": "Asistente",
  "topbar.assistant.title": "Describe tu proyecto y genera un borrador de board",
  "topbar.templates": "Plantillas",
  "topbar.tour": "Ver el tour de bienvenida",
  "topbar.tour.title": "Tour de bienvenida",
  "topbar.saveBtn": "Guardar",
  "topbar.lang": "Idioma",
  "topbar.workspace": "Workspace",

  // Banners + app shell
  "banner.workspaceChanged": "El workspace del servidor cambió — recarga",
  "banner.reload": "Recargar",
  "app.loading": "Cargando el tablero…",
  "empty.title": "Tu lienzo está vacío",
  "empty.body": "Arrastra 💡 Idea o 📦 Épica para pensar, o 📋 Spec para crear tu primera spec real.",
  "empty.cta": "📋 Crear la primera spec",
  "loadError.title": "No se pudo cargar el tablero",
  "loadError.hint": "¿Está corriendo el servidor?",

  // Palette
  "palette.title": "Paleta",
  "palette.help": "Arrastra al lienzo (o clic)",
  "palette.idea": "Idea",
  "palette.idea.hint": "Nota libre",
  "palette.epic": "Épica",
  "palette.epic.hint": "Agrupa specs",
  "palette.spec": "Spec",
  "palette.spec.hint": "Crea una specs/NNN-… real",
  "palette.foot1": "Al crear una unión eliges su propósito; doble clic para cambiarlo",
  "palette.foot2": "Supr/Backspace borra la selección",

  // Welcome tour
  "tour.aria": "Tour de bienvenida",
  "tour.close": "Cerrar el tour",
  "tour.dontShow": "No mostrar de nuevo",
  "tour.back": "← Atrás",
  "tour.next": "Siguiente →",
  "tour.finish": "Terminar",
  "tour.1.title": "1 · La paleta",
  "tour.1.body": "Arrastra 💡 Idea, 📦 Épica o 📋 Spec desde aquí al lienzo (o haz clic).",
  "tour.2.title": "2 · Crear una spec",
  "tour.2.body":
    "La tarjeta 📋 Spec crea una carpeta real specs/NNN-… con spec, plan y tareas — sin tocar la terminal.",
  "tour.3.title": "3 · Conectar tarjetas",
  "tour.3.body":
    "Arrastra desde el punto derecho de una tarjeta hasta otra para unirlas y elige el propósito de la unión (contiene, depende de, bloquea o relacionada).",
  "tour.4.title": "4 · Tareas y editor",
  "tour.4.body":
    "Haz clic en una tarjeta de spec para abrir el panel: marca tareas y edita cada sección de la spec con su propio formulario.",
  "tour.5.title": "5 · El gate",
  "tour.5.body":
    "El semáforo del gate te dice si puedes implementar: 🟢 abierto, 🔴 cerrado. Pulsa «Validar ahora» para comprobarlo.",

  // New spec modal
  "newSpec.title": "Nueva spec",
  "newSpec.name": "Nombre",
  "newSpec.namePh": "p. ej. checkout",
  "newSpec.owner": "Owner (opcional)",
  "newSpec.ownerPh": "Nombre",
  "newSpec.note": "Se creará la carpeta real {dir} con spec, plan, tasks e history.",
  "newSpec.create": "Crear",
  "newSpec.creating": "Creando…",

  // Template gallery
  "gallery.title": "Plantillas",
  "gallery.note": "Cada plantilla crea specs reales ({dir}) y un tablero conectado.",
  "gallery.hasSpecs":
    "Este workspace ya tiene specs; las plantillas solo se aplican en un workspace vacío.",
  "gallery.meta.one": "{specs} specs · 1 épica",
  "gallery.meta.many": "{specs} specs · {epics} épicas",
  "gallery.use": "Usar",
  "gallery.applying": "Aplicando…",

  // ✨ Assistant
  "assistant.title": "✨ Descríbeme tu proyecto",
  "assistant.intro":
    "Escribe tu proyecto en una frase o párrafo y te propongo un borrador de board: idea, épicas y specs conectadas. Nada se guarda hasta que aceptes.",
  "assistant.ph": "p. ej. una tienda online de plantas con pagos y panel de administración",
  "assistant.propose": "✨ Proponer borrador",
  "assistant.draftNote": "Borrador (aún sin guardar): renombra o quita specs antes de crear.",
  "assistant.hasSpecs":
    "Este workspace ya tiene specs; el asistente solo se aplica en un workspace vacío.",
  "assistant.keepOne": "Deja al menos una spec en el borrador",
  "assistant.regenerate": "↺ Regenerar",
  "assistant.regenerate.title": "Propone nombres alternativos",
  "assistant.create": "✅ Crear en el board",
  "assistant.creating": "Creando…",
  "assistant.meta.one": "{specs} specs · 1 épica: {names}",
  "assistant.meta.many": "{specs} specs · {epics} épicas: {names}",
  "assistant.specNameAria": "Nombre de la spec {key}",
  "assistant.epicTag": "Épica",
  "assistant.agent.toggle": "🤖 ¿Tienes un agente IA?",
  "assistant.agent.note":
    "Pega este prompt en tu agente conectado al MCP sdd-mcp: generará el board con inteligencia real (specs con borrador incluido).",

  // Implement modal
  "implement.title": "🤖 Implementar con agente",
  "implement.aria": "Implementar {id} con agente",
  "implement.note":
    "Copia este prompt y pégalo en tu agente (Claude Code, Codex, Cursor…). Incluye el workspace, la spec aprobada y la compuerta SDD con consentimiento.",

  // Prompt box
  "prompt.copy": "📋 Copiar prompt",
  "prompt.copied": "✓ Copiado",
  "prompt.manual": "⚠ Selecciona y copia (⌘C)",

  // Spec sheet (drawer)
  "sheet.aria": "Detalle de la spec {id}",
  "sheet.tab.summary": "Resumen",
  "sheet.tab.edit": "Editar spec",
  "sheet.tab.approval": "Aprobación",
  "sheet.tab.relations": "Relaciones",
  "sheet.loading": "Cargando…",
  "sheet.tasks": "Tareas",
  "sheet.noTasks": "Sin tareas",
  "sheet.implement": "🤖 Implementar con agente",
  "sheet.implement.ready": "Prepara el prompt exacto para tu agente",
  "sheet.hardStop":
    "No hay código sin spec aprobada y plan consistente — aprueba la spec primero.",
  "sheet.excerpt": "spec.md (extracto)",
  "sheet.excerptNote":
    "Usa la pestaña «Editar spec» para los formularios por sección; el contenido largo se edita en tu editor.",
  "sheet.issues": "Issues de GitHub",
  "sheet.issues.btn": "Crear issues",
  "sheet.issues.creating": "Creando issues…",
  "sheet.issues.noPending": "No hay tareas pendientes",
  "sheet.issues.tooltip":
    "Un issue por tarea pendiente vía gh CLI; los títulos existentes se saltan",
  "sheet.issues.hint": "Requiere un repo git con remote y gh CLI autenticado.",
  "sheet.issues.summary": "{created} creadas · {skipped} saltadas · {failed} fallidas",

  // Status badges
  "status.approved": "Aprobada",
  "status.pending": "Pendiente",
  "status.done": "Hecha",
  "status.tasks": "{done}/{total} tareas",
  "status.open": "Abrir →",
  "status.gateErrors": "Errores del gate:",
  "status.depWarn": "Dependencias sin aprobar:",

  // Guided section editor
  "editor.note":
    "Escribe en lenguaje natural; el builder reemplaza solo la sección guardada dentro de spec.md — la aprobación no se toca.",
  "editor.story": "Historia de usuario",
  "editor.story.ph": "Como [rol], quiero [acción], para [beneficio].",
  "editor.scenarios": "Escenarios de aceptación",
  "editor.scenarios.ph": "Dado ..., cuando ..., entonces ...",
  "editor.scenarios.add": "Añadir escenario",
  "editor.criteria": "Criterios EARS",
  "editor.criteria.add": "Añadir criterio",
  "editor.requirements": "Requisitos",
  "editor.requirements.ph": "Requisito concreto y verificable",
  "editor.requirements.add": "Añadir requisito",
  "editor.properties": "Propiedades de la spec",
  "editor.properties.hint":
    "Propiedades universales que un test property-based podría verificar (puente a specs ejecutables).",
  "editor.properties.ph": "Para toda entrada X, EL SISTEMA DEBERÁ …",
  "editor.properties.add": "Añadir propiedad",
  "editor.success": "Criterios de éxito",
  "editor.success.ph": "Qué debe ser cierto para dar la spec por lograda",
  "editor.success.add": "Añadir criterio",
  "editor.outOfScope": "Fuera de alcance",
  "editor.outOfScope.ph": "Lo que esta spec NO cubre",
  "editor.save": "💾 Guardar secciones",
  "editor.saving": "Guardando…",
  "editor.saved.one": "Guardado en spec.md (1 sección)",
  "editor.saved.many": "Guardado en spec.md ({n} secciones)",
  "editor.atLeastOne": "Escribe al menos una sección",
  "ears.pattern": "Patrón EARS: CUANDO/SI/MIENTRAS … EL SISTEMA DEBERÁ …",
  "ears.vague": "Palabra vaga sin número medible: {words}",

  // Approval tab
  "approval.note":
    "Aprobar escribe el bloque real en spec.md: estado, fecha de hoy, aprobador y evidencia.",
  "approval.status": "Estado",
  "approval.date": "Fecha de aprobación",
  "approval.dateToday": "Se estampará la fecha de hoy al aprobar",
  "approval.approver": "Aprobado por",
  "approval.approverPh": "¿Quién aprueba?",
  "approval.evidence": "Evidencia (enlace o cita corta)",
  "approval.evidencePh": "p. ej. enlace al hilo o cita del OK",
  "approval.submit": "✅ Aprobar spec",
  "approval.update": "💾 Actualizar aprobación",
  "approval.busy": "Escribiendo…",
  "approval.done": "Aprobación escrita en spec.md",

  // Relations tab
  "relations.incoming": "Entrantes",
  "relations.outgoing": "Salientes",
  "relations.none": "Esta spec no tiene uniones en el lienzo.",
  "relations.delete": "Eliminar unión",
  "relations.typeAria": "Tipo de unión",
  "relations.note": "Las uniones viven en board.canvas; el tipo se guarda como etiqueta canónica.",

  // Edge purpose picker
  "edge.kind.related": "relacionada",
  "edge.kind.depends": "depende de",
  "edge.kind.blocks": "bloquea",
  "edge.kind.contains": "contiene",
  "edge.kind.custom": "otra etiqueta…",
  "edge.customPh": "etiqueta",
  "edge.chipTitle": "Doble clic para cambiar el propósito de la unión",
  "edge.pickerAria": "Propósito de la unión",

  // Kanban
  "kanban.col.draft": "Borrador · Pendiente",
  "kanban.col.approved": "Aprobada",
  "kanban.col.done": "Hecha",
  "kanban.empty": "— vacío —",
  "kanban.toast": "🔒 La aprobación se hace en la spec",
  "kanban.openSpec": "Abrir spec",

  // Notes
  "note.idea.new": "💡 Idea nueva",
  "note.epic.new": "📦 Épica nueva",
  "note.empty": "(vacío)",
  "note.editTitle": "Doble clic para editar",

  // Client-side errors
  "error.apiUnreachable":
    "No se pudo conectar con la API — arranca el servidor: SDD_PROJECT_ROOT=/ruta/a/tu/proyecto npm run mcp:http:start",
  "error.templatesNonEmpty":
    "Este workspace ya tiene specs; las plantillas solo se aplican en un workspace vacío.",

  // Server errors with a machine code (packages/sdd-mcp/src/github.ts).
  // The server sends the code, the UI picks the language — spec 010, R1: no
  // double labels anywhere, including errors.
  "error.code.GH_NO_REPO":
    "Este workspace no es un repositorio git — ejecuta: git init && git remote add origin <url>",
  "error.code.GH_NO_REMOTE": "El repositorio git no tiene remote — ejecuta: git remote add origin <url>",
  "error.code.GH_NOT_INSTALLED":
    "gh CLI no está instalado — instálalo desde https://cli.github.com y luego ejecuta: gh auth login",
  "error.code.GH_CLI_FAILED": "gh CLI falló al ejecutarse.",
  "error.code.GH_NOT_AUTHED": "gh no está autenticado — ejecuta: gh auth login",
  "error.code.GH_REPO_VIEW_FAILED": "No se pudo resolver el repositorio GitHub desde el remote.",
  "error.code.GH_BAD_OUTPUT":
    "Respuesta inesperada de gh repo view — actualiza gh: https://cli.github.com",
  "error.code.GH_ISSUE_LIST_FAILED": "No se pudieron listar los issues existentes en GitHub.",

  // ── Capa educativa (help.*) ────────────────────────────────────────────────
  // Cada concepto SDD que la interfaz muestra se explica donde aparece, y cada
  // explicación termina en la guía que lo cubre entero.
  "help.aria": "Ayuda: {topic}",
  "help.learnMore": "Guía completa →",

  "help.palette.title": "Idea, Épica y Spec",
  "help.palette.body":
    "💡 Idea es una nota libre y 📦 Épica agrupa specs: ambas viven solo en el lienzo y no tocan el disco. 📋 Spec sí crea una carpeta real specs/NNN-… con spec.md, plan.md y tasks.md: es la unidad que se aprueba y la única que puede abrir el gate.",

  "help.gate.title": "El gate: la regla de oro",
  "help.gate.body":
    "No hay código sin spec aprobada y plan consistente. El gate lee tus archivos y responde una sola pregunta: ¿ya se puede implementar? 🟢 abierto = sí; 🔴 cerrado = falta algo. Falla cerrado a propósito: ante la duda, bloquea.",
  "help.gate.openLead": "Está abierto: las specs aprobadas y sus planes son consistentes.",
  "help.gate.closedLead": "Que aquí se bloquee no es un fallo de la herramienta: es la regla de oro haciendo su trabajo. Ahora mismo falta:",
  "help.gate.missing.errors": "{n} error(es) de validación — pulsa «Validar ahora» y míralos en el Dashboard.",
  "help.gate.missing.pending": "{n} spec(s) sin aprobar — ábrela y usa la pestaña «Aprobación».",
  "help.gate.missing.unknown": "Revisa los mensajes del validador en el Dashboard.",

  "help.approval.title": "Qué significa «aprobada»",
  "help.approval.body":
    "Aprobar escribe en spec.md el bloque de estado: Aprobado, la fecha de hoy, quién aprueba y la evidencia. Ese bloque es lo que leen el gate, la CI y tu agente antes de permitir código. Sin él, la spec cuenta como pendiente.",

  "help.ears.title": "Criterios EARS",
  "help.ears.body":
    "EARS es una plantilla de frase: CUANDO/SI/MIENTRAS … EL SISTEMA DEBERÁ …. Te obliga a decir el disparador y una respuesta medible, así cada criterio se traduce en un test.",

  "help.relations.title": "Tipos de unión",
  "help.relations.body":
    "«contiene» = una épica agrupa a la spec. «depende de» = esta spec necesita la otra antes. «bloquea» = al revés, esta frena a la otra. «relacionada» = solo contexto. Solo «depende de» y «bloquea» generan avisos de dependencia.",

  "help.dep.title": "Aviso de dependencia",
  "help.dep.body":
    "Una spec aprobada depende de otra que aún no lo está: implementarla sería construir sobre un contrato sin firmar. Es un aviso, no un bloqueo — el gate sigue abierto. Aprueba la dependencia o corrige el tipo de unión.",

  "help.tasks.title": "Las tareas viven en tasks.md",
  "help.tasks.body":
    "Cada casilla es una línea «- [ ]» del tasks.md de esta spec. Marcarla reescribe el archivo en disco al momento y quien tenga el board abierto lo ve. No hay base de datos: el repositorio es el estado.",

  "help.issues.title": "Tareas → issues de GitHub",
  "help.issues.body":
    "Crea un issue por cada tarea pendiente, con enlace de vuelta a la spec. Es idempotente: los títulos que ya existen se saltan. La casilla en tasks.md sigue siendo la fuente de verdad.",

  // Empty states + líneas de «por qué» en acciones importantes
  "empty.learn":
    "Un workspace vacío significa que aún no hay ningún contrato en disco. En SDD se empieza por la spec, no por el código: crea una, aunque sea pequeña.",
  "sheet.noTasks.hint":
    "El plan todavía no se ha bajado a tareas. Añade líneas «- [ ]» en tasks.md (o pídeselo a tu agente) para poder seguir el avance aquí.",
  "approval.why":
    "Esta firma queda escrita en spec.md y es lo que abre el gate para esta spec.",
  "edge.why": "«depende de» y «bloquea» son las únicas uniones que generan avisos de dependencia.",
  "sheet.issues.why":
    "Reparte el trabajo fuera del repo sin perder el hilo: cada issue enlaza a su spec."
};

const en: Record<keyof typeof es, string> = {
  // Common
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.back": "← Back",
  "common.retry": "Retry",
  "common.remove": "Remove",
  "common.moveUp": "Move up",
  "common.moveDown": "Move down",

  // Top bar
  "topbar.save.saved": "Saved",
  "topbar.save.dirty": "Unsaved",
  "topbar.save.saving": "Saving…",
  "topbar.save.error": "Save error",
  "topbar.live.on": "Live",
  "topbar.live.off": "Live off",
  "topbar.live.title.on": "Disk changes sync automatically",
  "topbar.live.title.off": "Reconnecting to /api/events…",
  "topbar.gate.loading": "Gate…",
  "topbar.gate.open": "Gate open",
  "topbar.gate.closed": "Gate closed",
  "topbar.gate.blocked": "Gate blocked",
  "dash.reason.blocked": "There are errors to fix first. Implementation blocked.",
  "gate.posture.checked": "Checked: policy, spec structure, approval status, per-spec consent and dependencies.",
  "gate.posture.notChecked": "NOT checked: whether the project code corresponds to an approved spec.",
  "topbar.gate.checking": "Checking the gate…",
  "topbar.gate.stats": "{errors} errors · {warnings} warnings · {approved}/{total} specs approved",
  "topbar.gate.depTitle": "Unapproved dependencies:",
  "topbar.gate.validate": "Validate now",
  "topbar.gate.validating": "Validating…",
  "topbar.gate.validateTitle": "Runs the real project validation",
  "topbar.view.label": "View",
  "topbar.view.canvas": "Canvas",
  "topbar.view.board": "Board",
  "topbar.presence.title": "{n} people viewing this workspace",
  "topbar.undo": "Undo",
  "topbar.undo.title": "Undo (⌘Z / Ctrl+Z)",
  "topbar.redo": "Redo",
  "topbar.redo.title": "Redo (⇧⌘Z / Ctrl+Shift+Z)",
  "topbar.png": "PNG",
  "topbar.png.exporting": "Exporting…",
  "topbar.png.title": "Exports the board as an image",
  "topbar.assistant": "Assistant",
  "topbar.assistant.title": "Describe your project and generate a draft board",
  "topbar.templates": "Templates",
  "topbar.tour": "Show the welcome tour",
  "topbar.tour.title": "Welcome tour",
  "topbar.saveBtn": "Save",
  "topbar.lang": "Language",
  "topbar.workspace": "Workspace",

  // Banners + app shell
  "banner.workspaceChanged": "Server workspace changed — reload",
  "banner.reload": "Reload",
  "app.loading": "Loading the board…",
  "empty.title": "Your canvas is empty",
  "empty.body": "Drag 💡 Idea or 📦 Epic to think, or 📋 Spec to create your first real spec.",
  "empty.cta": "📋 Create the first spec",
  "loadError.title": "Could not load the board",
  "loadError.hint": "Is the server running?",

  // Palette
  "palette.title": "Palette",
  "palette.help": "Drag onto the canvas (or click)",
  "palette.idea": "Idea",
  "palette.idea.hint": "Free note",
  "palette.epic": "Epic",
  "palette.epic.hint": "Groups specs",
  "palette.spec": "Spec",
  "palette.spec.hint": "Creates a real specs/NNN-…",
  "palette.foot1": "Creating a connection asks for its purpose; double-click to change it",
  "palette.foot2": "Delete/Backspace removes the selection",

  // Welcome tour
  "tour.aria": "Welcome tour",
  "tour.close": "Close the tour",
  "tour.dontShow": "Don't show again",
  "tour.back": "← Back",
  "tour.next": "Next →",
  "tour.finish": "Finish",
  "tour.1.title": "1 · The palette",
  "tour.1.body": "Drag 💡 Idea, 📦 Epic or 📋 Spec from here onto the canvas (or click).",
  "tour.2.title": "2 · Create a spec",
  "tour.2.body":
    "The 📋 Spec card creates a real specs/NNN-… folder with spec, plan and tasks — no terminal needed.",
  "tour.3.title": "3 · Connect cards",
  "tour.3.body":
    "Drag from a card's right handle to another card to connect them, then pick the connection's purpose (contains, depends on, blocks or related).",
  "tour.4.title": "4 · Tasks and editor",
  "tour.4.body":
    "Click a spec card to open the panel: tick tasks and edit every spec section with its own form.",
  "tour.5.title": "5 · The gate",
  "tour.5.body":
    "The gate semaphore tells you whether you can implement: 🟢 open, 🔴 closed. Press “Validate now” to check.",

  // New spec modal
  "newSpec.title": "New spec",
  "newSpec.name": "Name",
  "newSpec.namePh": "e.g. checkout",
  "newSpec.owner": "Owner (optional)",
  "newSpec.ownerPh": "Name",
  "newSpec.note": "The real {dir} folder will be created with spec, plan, tasks and history.",
  "newSpec.create": "Create",
  "newSpec.creating": "Creating…",

  // Template gallery
  "gallery.title": "Templates",
  "gallery.note": "Each template creates real specs ({dir}) and a connected board.",
  "gallery.hasSpecs":
    "This workspace already has specs; templates only apply to an empty workspace.",
  "gallery.meta.one": "{specs} specs · 1 epic",
  "gallery.meta.many": "{specs} specs · {epics} epics",
  "gallery.use": "Use",
  "gallery.applying": "Applying…",

  // ✨ Assistant
  "assistant.title": "✨ Describe your project",
  "assistant.intro":
    "Write your project in a sentence or a paragraph and I'll propose a draft board: idea, epics and connected specs. Nothing is saved until you accept.",
  "assistant.ph": "e.g. an online plant store with payments and an admin panel",
  "assistant.propose": "✨ Propose draft",
  "assistant.draftNote": "Draft (not saved yet): rename or remove specs before creating.",
  "assistant.hasSpecs":
    "This workspace already has specs; the assistant only applies to an empty workspace.",
  "assistant.keepOne": "Keep at least one spec in the draft",
  "assistant.regenerate": "↺ Regenerate",
  "assistant.regenerate.title": "Proposes alternative names",
  "assistant.create": "✅ Create on the board",
  "assistant.creating": "Creating…",
  "assistant.meta.one": "{specs} specs · 1 epic: {names}",
  "assistant.meta.many": "{specs} specs · {epics} epics: {names}",
  "assistant.specNameAria": "Spec name {key}",
  "assistant.epicTag": "Epic",
  "assistant.agent.toggle": "🤖 Have an AI agent?",
  "assistant.agent.note":
    "Paste this prompt into your agent connected to the sdd-mcp MCP: it will generate the board with real intelligence (specs with a draft included).",

  // Implement modal
  "implement.title": "🤖 Implement with agent",
  "implement.aria": "Implement {id} with an agent",
  "implement.note":
    "Copy this prompt and paste it into your agent (Claude Code, Codex, Cursor…). It includes the workspace, the approved spec and the SDD gate with consent.",

  // Prompt box
  "prompt.copy": "📋 Copy prompt",
  "prompt.copied": "✓ Copied",
  "prompt.manual": "⚠ Select and copy (Ctrl+C)",

  // Spec sheet (drawer)
  "sheet.aria": "Spec {id} detail",
  "sheet.tab.summary": "Summary",
  "sheet.tab.edit": "Edit spec",
  "sheet.tab.approval": "Approval",
  "sheet.tab.relations": "Relations",
  "sheet.loading": "Loading…",
  "sheet.tasks": "Tasks",
  "sheet.noTasks": "No tasks",
  "sheet.implement": "🤖 Implement with agent",
  "sheet.implement.ready": "Prepares the exact prompt for your agent",
  "sheet.hardStop": "No code before approved spec and consistent plan — approve the spec first.",
  "sheet.excerpt": "spec.md (excerpt)",
  "sheet.excerptNote":
    "Use the “Edit spec” tab for the per-section forms; long-form content is edited in your editor.",
  "sheet.issues": "GitHub issues",
  "sheet.issues.btn": "Create issues",
  "sheet.issues.creating": "Creating issues…",
  "sheet.issues.noPending": "No pending tasks",
  "sheet.issues.tooltip": "One issue per pending task via the gh CLI; existing titles are skipped",
  "sheet.issues.hint": "Requires a git repo with a remote and an authenticated gh CLI.",
  "sheet.issues.summary": "{created} created · {skipped} skipped · {failed} failed",

  // Status badges
  "status.approved": "Approved",
  "status.pending": "Pending",
  "status.done": "Done",
  "status.tasks": "{done}/{total} tasks",
  "status.open": "Open →",
  "status.gateErrors": "Gate errors:",
  "status.depWarn": "Unapproved dependencies:",

  // Guided section editor
  "editor.note":
    "Write in plain language; the builder replaces only the saved section inside spec.md — approval is never touched.",
  "editor.story": "User story",
  "editor.story.ph": "As a [role], I want [action], so that [benefit].",
  "editor.scenarios": "Acceptance scenarios",
  "editor.scenarios.ph": "Given ..., when ..., then ...",
  "editor.scenarios.add": "Add scenario",
  "editor.criteria": "EARS criteria",
  "editor.criteria.add": "Add criterion",
  "editor.requirements": "Requirements",
  "editor.requirements.ph": "Concrete, verifiable requirement",
  "editor.requirements.add": "Add requirement",
  "editor.properties": "Spec properties",
  "editor.properties.hint":
    "Universal properties a property-based test could verify (bridge to executable specs).",
  "editor.properties.ph": "For every input X, THE SYSTEM SHALL …",
  "editor.properties.add": "Add property",
  "editor.success": "Success criteria",
  "editor.success.ph": "What must be true to call this spec achieved",
  "editor.success.add": "Add criterion",
  "editor.outOfScope": "Out of scope",
  "editor.outOfScope.ph": "What this spec does NOT cover",
  "editor.save": "💾 Save sections",
  "editor.saving": "Saving…",
  "editor.saved.one": "Saved into spec.md (1 section)",
  "editor.saved.many": "Saved into spec.md ({n} sections)",
  "editor.atLeastOne": "Write at least one section",
  "ears.pattern": "EARS pattern: WHEN/IF/WHILE … THE SYSTEM SHALL …",
  "ears.vague": "Vague word without a measurable number: {words}",

  // Approval tab
  "approval.note":
    "Approving writes the real block into spec.md: status, today's date, approver and evidence.",
  "approval.status": "Status",
  "approval.date": "Approval date",
  "approval.dateToday": "Today's date will be stamped on approval",
  "approval.approver": "Approved by",
  "approval.approverPh": "Who approves?",
  "approval.evidence": "Evidence (link or short quote)",
  "approval.evidencePh": "e.g. a link to the thread or the OK quote",
  "approval.submit": "✅ Approve spec",
  "approval.update": "💾 Update approval",
  "approval.busy": "Writing…",
  "approval.done": "Approval written into spec.md",

  // Relations tab
  "relations.incoming": "Incoming",
  "relations.outgoing": "Outgoing",
  "relations.none": "This spec has no connections on the canvas.",
  "relations.delete": "Delete connection",
  "relations.typeAria": "Connection type",
  "relations.note": "Connections live in board.canvas; the type is stored as a canonical label.",

  // Edge purpose picker
  "edge.kind.related": "related",
  "edge.kind.depends": "depends on",
  "edge.kind.blocks": "blocks",
  "edge.kind.contains": "contains",
  "edge.kind.custom": "other label…",
  "edge.customPh": "label",
  "edge.chipTitle": "Double-click to change the connection's purpose",
  "edge.pickerAria": "Connection purpose",

  // Kanban
  "kanban.col.draft": "Draft · Pending",
  "kanban.col.approved": "Approved",
  "kanban.col.done": "Done",
  "kanban.empty": "— empty —",
  "kanban.toast": "🔒 Approval happens on the spec",
  "kanban.openSpec": "Open spec",

  // Notes
  "note.idea.new": "💡 New idea",
  "note.epic.new": "📦 New epic",
  "note.empty": "(empty)",
  "note.editTitle": "Double-click to edit",

  // Client-side errors
  "error.apiUnreachable":
    "Could not reach the API — start the server: SDD_PROJECT_ROOT=/path/to/your/project npm run mcp:http:start",
  "error.templatesNonEmpty":
    "This workspace already has specs; templates only apply to an empty workspace.",

  // Server errors with a machine code (packages/sdd-mcp/src/github.ts).
  "error.code.GH_NO_REPO":
    "This workspace is not a git repository — run: git init && git remote add origin <url>",
  "error.code.GH_NO_REMOTE": "The git repository has no remote — run: git remote add origin <url>",
  "error.code.GH_NOT_INSTALLED":
    "gh CLI is not installed — install it from https://cli.github.com, then run: gh auth login",
  "error.code.GH_CLI_FAILED": "The gh CLI failed to run.",
  "error.code.GH_NOT_AUTHED": "gh is not authenticated — run: gh auth login",
  "error.code.GH_REPO_VIEW_FAILED": "Could not resolve the GitHub repository from the remote.",
  "error.code.GH_BAD_OUTPUT": "Unexpected gh repo view response — update gh: https://cli.github.com",
  "error.code.GH_ISSUE_LIST_FAILED": "Could not list the existing GitHub issues.",

  // ── Teaching layer (help.*) ───────────────────────────────────────────────
  "help.aria": "Help: {topic}",
  "help.learnMore": "Full guide →",

  "help.palette.title": "Idea, Epic and Spec",
  "help.palette.body":
    "💡 Idea is a free note and 📦 Epic groups specs: both live on the canvas only and never touch disk. 📋 Spec does create a real specs/NNN-… folder with spec.md, plan.md and tasks.md: it is the unit you approve and the only one that can open the gate.",

  "help.gate.title": "The gate: the golden rule",
  "help.gate.body":
    "No code before an approved spec and a consistent plan. The gate reads your files and answers one question: can we implement yet? 🟢 open = yes; 🔴 closed = something is missing. It fails closed on purpose: when in doubt, it blocks.",
  "help.gate.openLead": "It is open: the approved specs and their plans are consistent.",
  "help.gate.closedLead": "Blocking here is the golden rule protecting your project, not a bug in the tool. Right now this is missing:",
  "help.gate.missing.errors": "{n} validation error(s) — press “Validate now” and read them on the Dashboard.",
  "help.gate.missing.pending": "{n} spec(s) not approved — open one and use the “Approval” tab.",
  "help.gate.missing.unknown": "Check the validator messages on the Dashboard.",

  "help.approval.title": "What “approved” means",
  "help.approval.body":
    "Approving writes the status block into spec.md: Approved, today's date, who approved and the evidence. That block is what the gate, CI and your agent read before any code is allowed. Without it, the spec counts as pending.",

  "help.ears.title": "EARS criteria",
  "help.ears.body":
    "EARS is a sentence template: WHEN/IF/WHILE … THE SYSTEM SHALL …. It forces you to state the trigger and a measurable response, so every criterion maps to a test.",

  "help.relations.title": "Connection types",
  "help.relations.body":
    "“contains” = an epic groups the spec. “depends on” = this spec needs the other one first. “blocks” = the other way round, this one holds the other back. “related” = context only. Only “depends on” and “blocks” raise dependency warnings.",

  "help.dep.title": "Dependency warning",
  "help.dep.body":
    "An approved spec depends on one that is not approved yet: implementing it would build on an unsigned contract. It is advisory, not a block — the gate stays open. Approve the dependency or fix the connection type.",

  "help.tasks.title": "Tasks live in tasks.md",
  "help.tasks.body":
    "Every checkbox is a “- [ ]” line in this spec's tasks.md. Ticking it rewrites the file on disk right away and anyone with the board open sees it. There is no database: the repository is the state.",

  "help.issues.title": "Tasks → GitHub issues",
  "help.issues.body":
    "Creates one issue per pending task, linking back to the spec. It is idempotent: titles that already exist are skipped. The checkbox in tasks.md stays the source of truth.",

  // Empty states + the "why" line on important actions
  "empty.learn":
    "An empty workspace means there is no contract on disk yet. In SDD you start with the spec, not the code: create one, however small.",
  "sheet.noTasks.hint":
    "The plan has not been broken down into tasks yet. Add “- [ ]” lines to tasks.md (or ask your agent to) so progress shows up here.",
  "approval.why":
    "This signature gets written into spec.md, and it is what opens the gate for this spec.",
  "edge.why": "“depends on” and “blocks” are the only connections that raise dependency warnings.",
  "sheet.issues.why":
    "Hand the work out beyond the repo without losing track of it: every issue links back to its spec."
};

const DICTS: Record<Lang, Dict> = { es, en };

export type TFunction = (key: string, vars?: Record<string, string | number>) => string;

function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match
  );
}

/**
 * True when the dictionaries define `key`. `translate` falls back to the key
 * itself, so callers that build a key from server data (e.g. an error code)
 * must ask first or the UI would print "error.code.GH_SOMETHING_NEW".
 */
export function hasTranslation(key: string): boolean {
  return key in DICTS.en || key in DICTS.es;
}

/** Translate outside React (store, api client). Reads the current language. */
export function translate(key: string, vars?: Record<string, string | number>): string {
  const lang = useI18nStore.getState().lang;
  return format(DICTS[lang][key] ?? DICTS.en[key] ?? key, vars);
}

/** Current language outside React. */
export function currentLang(): Lang {
  return useI18nStore.getState().lang;
}

/** Hook: `const { t, lang } = useT()` — re-renders on language switch. */
export function useT(): { t: TFunction; lang: Lang; setLang: (lang: Lang) => void } {
  const lang = useI18nStore((s) => s.lang);
  const setLang = useI18nStore((s) => s.setLang);
  const t: TFunction = (key, vars) => format(DICTS[lang][key] ?? DICTS.en[key] ?? key, vars);
  return { t, lang, setLang };
}
