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
  "common.loading": "Cargando…",

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
  "canvas.specNotDeletable": "Las tarjetas de spec no se borran desde el grafo",
  "jump.title": "Ir a una spec",
  "jump.placeholder": "Escribe un número o parte del título…",
  "jump.empty": "Ninguna spec coincide.",
  "jump.hint": "↑↓ para moverte · Enter para abrir · Esc para cerrar",
  "consent.title": "Falta tu consentimiento",
  "consent.why": "Aprobar dice que la spec está lista. Consentir dice que autorizas empezar a implementarla. Son dos decisiones, y la compuerta pide las dos.",
  "consent.submit": "Autorizo empezar la implementación",
  "consent.busy": "Registrando…",
  "consent.done": "Consentimiento registrado. La compuerta ya lo ve.",
  "consent.summary": "El autor autorizó empezar la implementación de {spec} desde el builder",
  "canvas.specNotDeletableWhy": "Cada tarjeta es una carpeta real en specs/. Bórrala en disco si de verdad quieres eliminarla; las notas sí se borran aquí.",
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
  "topbar.view.canvas": "Grafo",
  "topbar.view.board": "Tablero",
  "topbar.presence.title": "{n} personas viendo este workspace",
  "topbar.undo": "Deshacer",
  "topbar.undo.title": "Deshacer (⌘Z / Ctrl+Z)",
  "topbar.redo": "Rehacer",
  "topbar.redo.title": "Rehacer (⇧⌘Z / Ctrl+Shift+Z)",
  "topbar.png": "PNG",
  "topbar.png.exporting": "Exportando…",
  "topbar.png.title": "Exporta el tablero como imagen",
  "topbar.reports": "Informes",
  "topbar.reports.busy": "Generando…",
  "topbar.reports.title": "Regenera STATUS.md y docs/roadmap desde specs/INDEX.md",
  "topbar.bitacora": "Bitácora",
  "topbar.bitacora.title": "Registra una decisión, daily log o handoff sin salir del canvas",
  "bitacora.aria": "Registrar entrada en la bitácora",
  "bitacora.title": "Registrar en la bitácora",
  "bitacora.note":
    "Cada entrada se escribe en la carpeta de bitácora del proyecto con las mismas reglas que por MCP o terminal — sin duplicados de formato.",
  "bitacora.kind": "Tipo de entrada",
  "bitacora.kind.decisiones": "Decisión",
  "bitacora.kind.handoffs": "Handoff",
  "bitacora.kind.diaria": "Daily log",
  "bitacora.kind.global": "Log global del proyecto",
  "bitacora.fileName": "Nombre de archivo (.md)",
  "bitacora.date": "Fecha",
  "bitacora.content": "Contenido (markdown)",
  "bitacora.contentPh.decisiones": "# Decisión\n\n## Contexto\n\n## Decisión\n\n## Alternativas descartadas\n\n## Cuándo revisarla",
  "bitacora.contentPh.handoffs": "# Handoff\n\n## Estado actual\n\n## Próximo paso",
  "bitacora.contentPh.diaria": "# Daily\n\n## Hecho hoy\n\n## Siguiente",
  "bitacora.contentPh.global": "Entrada para bitacora/global/PROJECT_LOG.md…",
  "bitacora.submit": "Guardar entrada",
  "bitacora.busy": "Guardando…",
  "bitacora.done": "Entrada registrada",
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
  "empty.title": "Todavía no hay ningún contrato en disco",
  "empty.body":
    "En SDD se empieza por la spec, no por el código. Una spec es una carpeta real — spec.md, plan.md, tasks.md — y es lo único que puede abrir la compuerta.",
  "empty.cta": "Crear la primera spec",
  "empty.describe": "Describir el proyecto",
  "empty.template": "Usar plantilla",
  "empty.terminal": "o desde la terminal",
  "loadError.title": "No se pudo cargar el tablero",
  "loadError.hint": "¿Está corriendo el servidor?",

  // Palette
  "palette.title": "Paleta",
  "palette.help": "Arrastra al grafo (o clic)",
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
  "tour.back": "Atrás",
  "tour.next": "Siguiente",
  "tour.finish": "Terminar",
  "tour.1.title": "El rail es tu proyecto entero",
  "tour.1.body":
    "Arriba, lo que puedes colocar en el grafo: Idea y Épica viven solo aquí; Spec escribe una carpeta real. Abajo, las specs del disco con su estado.",
  "tour.2.title": "2 · Crear una spec",
  "tour.2.body":
    "La tarjeta Spec crea una carpeta real specs/NNN-… con spec, plan y tareas — sin tocar la terminal.",
  "tour.3.title": "3 · Conectar tarjetas",
  "tour.3.body":
    "Arrastra desde el punto derecho de una tarjeta hasta otra para unirlas y elige el propósito de la unión (contiene, depende de, bloquea o relacionada).",
  "tour.4.title": "4 · Tareas y editor",
  "tour.4.body":
    "Haz clic en una tarjeta de spec para abrir el panel: marca tareas y edita cada sección de la spec con su propio formulario.",
  "tour.5.title": "5 · El gate",
  "tour.5.body":
    "La barra inferior te dice si puedes implementar: verde abierto, ámbar cerrado, rojo bloqueado — y la regla siempre a la vista. Pulsa «Validar ahora» para comprobarlo.",

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
  "assistant.proposeOne": "Proponer una spec",
  "assistant.proposeOne.ai": "La estructura tu agente conectado y la revisas antes de crearla",
  "assistant.proposeOne.local": "Borrador local de una sola spec; sin agente no hay IA de por medio",
  "assistant.proposeBoard": "Proponer board completo",
  "assistant.draftNote": "Borrador (aún sin guardar): renombra o quita specs antes de crear.",
  "assistant.keepOne": "Deja al menos una spec en el borrador",
  "assistant.regenerate": "regenerar",
  "assistant.regenerate.title": "Propone nombres alternativos",
  "assistant.create": "Crear en el board",
  "assistant.creating": "Creando…",
  "assistant.meta.one": "{specs} specs · 1 épica: {names}",
  "assistant.meta.many": "{specs} specs · {epics} épicas: {names}",
  "assistant.specNameAria": "Nombre de la spec {key}",
  "assistant.epicTag": "Épica",
  "assistant.agent.toggle": "🤖 ¿Tienes un agente IA?",
  "assistant.agent.note":
    "Pega este prompt en tu agente conectado al MCP sdd-mcp: generará el board con inteligencia real (specs con borrador incluido).",

  // Implement modal
  "implement.title": "Implementar con agente",
  "implement.aria": "Implementar {id} con agente",
  "implement.note":
    "Copia este prompt y pégalo en tu agente (Claude Code, Codex, Cursor…). Incluye el workspace, la spec aprobada y la compuerta SDD con consentimiento.",

  // Prompt box
  "prompt.copy": "Copiar prompt",
  "prompt.copied": "✓ Copiado",
  "prompt.manual": "Selecciona y copia (⌘C)",

  // Asistencia IA sin copy-paste (spec 031)
  "ai.assist": "Ampliar con IA",
  // Aviso de desfase de version (spec 029)
  "version.behind": "Tu proyecto usa SDD {installed} y el servidor es {server}",
  "version.driftOnly": "Hay archivos del framework que no coinciden con la version {server}",
  "version.stale": "{n} del framework a reparar",
  "version.missing": "{n} que faltan",
  "version.yours": "{n} tuyos que difieren (no se tocan)",
  "version.safe": "Repara lo del framework y nunca escribe tus archivos sin que lo pidas.",
  "ai.title": "Pedir al agente",
  "ai.instruction.ph": "Qué quieres que haga con este campo (ampliar, reescribir, proponer más…)",
  "ai.send": "Enviar al agente",
  "ai.sending": "Enviando…",
  "ai.pending": "Pendiente — esperando a que el agente la recoja",
  "ai.working": "En curso — {agent} está redactando",
  "ai.answered": "Propuesta del agente",
  "ai.accept": "Aceptar",
  "ai.applying": "Aplicando…",
  "ai.reject": "Rechazar",
  "ai.cancel": "Cancelar petición",
  "ai.again": "Pedir de nuevo",
  "ai.stalled": "estancada >10 min",
  "ai.agentOn": "agente: {agent}",
  "ai.noAgentShort": "sin agente",
  "ai.noAgent":
    "Ningún agente está escuchando la cola. Deja una sesión conectada al MCP atendiendo peticiones (sdd_next_request) o usa el prompt clásico:",
  "ai.queue.one": "IA: 1 petición",
  "ai.queue.many": "IA: {n} peticiones",
  "ai.queue.title": "Peticiones a la IA",
  "ai.queue.empty": "Sin peticiones activas.",
  "ai.status.pending": "pendiente",
  "ai.status.in_progress": "en curso",
  "ai.status.answered": "atendida — revisa la propuesta en su campo",
  "assistant.structure": "Estructurar con IA",
  "assistant.structure.waiting": "El agente está estructurando tu idea. La propuesta aparecerá aquí sola.",
  "assistant.structure.title": "Borrador propuesto por el agente",
  "assistant.structure.name": "Nombre de la spec",
  "assistant.structure.create": "Crear spec con estas secciones",
  "assistant.structure.parseError":
    "La propuesta del agente no se pudo interpretar como secciones. Recházala y pide de nuevo.",

  // Conectar agente (spec 032)
  "ai.connect": "Cómo conecto un agente",
  "cmdk.connect": "Conectar agente",
  "empty.connect": "Conectar un agente",
  "connect.tag": "CONECTAR AGENTE",
  "connect.title": "Conecta tu agente a este workspace",
  "connect.body":
    "Un comando registra el MCP en cada cliente que encuentre (Claude Code, Codex, Cursor, VS Code, Windsurf, Gemini, opencode) e instala la skill que atiende la cola. No sobrescribe tu configuración: la fusiona.",
  "connect.step1": "1 · Ejecuta esto en tu terminal",
  "connect.step1.hint":
    "Respeta lo que ya tengas configurado y se puede repetir sin efectos. Añade --dry-run para ver qué haría sin escribir nada.",
  "connect.step2": "2 · Pon al agente a atender la cola",
  "connect.manual": "Si prefieres hacerlo a mano, esto va en {file}:",
  "connect.footer":
    "Después de conectar, reinicia el cliente para que cargue el MCP. Mientras un agente consulte la cola, los botones «Ampliar con IA» funcionan solos.",

  // Spec sheet (drawer)
  "sheet.aria": "Detalle de la spec {id}",
  "sheet.tab.summary": "Resumen",
  "sheet.tab.edit": "Editar spec",
  "sheet.tab.approval": "Aprobación",
  "sheet.tab.relations": "Relaciones",
  "sheet.tab.review": "Revisión IA",

  // 🔎 Revisión de la spec por IA (spec 036)
  "review.tag": "REVISIÓN DE LA SPEC",
  "review.intro":
    "Una IA lee la spec y devuelve hallazgos anclados a su sección. No escribe nada: desde cada hallazgo saltas al campo y decides tú.",
  "review.ask": "Pedir revisión al agente",
  "review.asking": "Enviando…",
  "review.pending": "Pendiente — esperando a que el agente la recoja",
  "review.working": "En curso — {agent} está revisando",
  "review.noAgent":
    "No hay ningún agente atendiendo la cola. Copia el prompt, pégalo en la IA que uses (la que sea, aunque no tenga MCP) y trae su respuesta aquí abajo.",
  "review.paste": "Pega aquí la respuesta de tu IA",
  "review.paste.ph": "El JSON que devuelva, tal cual — con o sin vallas de código",
  "review.read": "Interpretar respuesta",
  "review.parseError":
    "Eso no se puede leer como una revisión. Pídesela otra vez recordándole que responda SOLO con el JSON del prompt.",
  "review.clean": "Sin hallazgos: la IA no ve nada que corregir en esta spec.",
  "review.count.one": "1 hallazgo",
  "review.count.many": "{n} hallazgos",
  "review.dropped.one": "1 descartado: anclaba a una sección que no existe.",
  "review.dropped.many": "{n} descartados: anclaban a una sección que no existe.",
  "review.severity.blocker": "bloqueante",
  "review.severity.warning": "aviso",
  "review.severity.note": "nota",
  "review.fix": "Corregir",
  "review.fix.title": "Abre esta sección en el editor con la indicación ya escrita",
  "review.fix.instruction": "Corrige esto: {finding}. {why}",
  "review.again": "Revisar de nuevo",
  "sheet.loading": "Cargando…",
  "sheet.tasks": "Tareas",
  "sheet.tasks.count": "{done}/{total} hechas",
  "sheet.noTasks": "Sin tareas",
  "sheet.implement": "Implementar con agente",
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

  // Spec 028: puntaje + lint EARS en el drawer, y añadir tarea desde el canvas
  "sheet.score": "Puntaje de la spec",
  "sheet.ears.summary": "EARS: {ok}/{total} limpios",
  "sheet.addTask.ph": "Nueva tarea para esta spec…",
  "sheet.addTask.btn": "Añadir tarea",
  "sheet.addTask.adding": "Añadiendo…",

  // Status badges
  "status.approved": "Aprobada",
  "status.pending": "Pendiente",
  "status.done": "Hecha",
  "status.tasks": "{done}/{total} tareas",
  "status.open": "Abrir →",
  "status.gateErrors": "Errores del gate:",
  "status.depWarn": "Dependencias sin aprobar:",
  "status.drift": "Código cambiado tras la aprobación:",
  "status.driftTitle": "Deriva spec ↔ código",
  "status.driftClean": "Sin deriva desde la aprobación",
  "status.driftUnscoped": "Sin ámbito de archivos declarado",
  "status.driftUnknown": "Deriva no calculable",

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
  "editor.save": "Guardar secciones",
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
  "approval.submit": "Aprobar spec",
  "approval.update": "Actualizar aprobación",
  "approval.busy": "Escribiendo…",
  "approval.done": "Aprobación escrita en spec.md",

  // Relations tab
  "relations.incoming": "Entrantes",
  "relations.outgoing": "Salientes",
  "relations.none": "Esta spec no tiene uniones en el grafo.",
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

  // Notes
  "note.idea.new": "Idea nueva",
  "note.epic.new": "Épica nueva",
  "note.empty": "(vacío)",
  "note.editTitle": "Doble clic para editar",

  // Client-side errors
  "error.apiUnreachable":
    "No se pudo conectar con la API — arranca el servidor: SDD_PROJECT_ROOT=/ruta/a/tu/proyecto npm run mcp:http:start",
  "error.templatesNonEmpty":
    "Este workspace ya tiene specs; las plantillas solo se aplican en un workspace vacío.",
  "error.planPartial.none":
    "No se creó ninguna spec: falló «{name}». No se ha tocado nada — ni el disco ni el lienzo.",
  "error.planPartial.one":
    "Se creó 1 spec y luego falló «{name}». Lo creado se conserva y el lienzo ya lo refleja; revisa el error y vuelve a intentarlo solo con lo que falta.",
  "error.planPartial.many":
    "Se crearon {n} specs y luego falló «{name}». Lo creado se conserva y el lienzo ya lo refleja; revisa el error y vuelve a intentarlo solo con lo que falta.",

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
    "Idea es una nota libre y Épica agrupa specs: ambas viven solo en el grafo y no tocan el disco. Spec sí crea una carpeta real specs/NNN-… con spec.md, plan.md y tasks.md: es la unidad que se aprueba y la única que puede abrir el gate.",

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

  "help.score.title": "Puntaje 0-100, calculado en el servidor",
  "help.score.body":
    "Es el mismo scoreSpec que los agentes usan por MCP: archivos presentes, secciones de la spec, señales del plan, desglose de tareas, rationale en research e historial con fechas. Las notas dicen exactamente qué mejorar. El resumen EARS lintea los criterios de aceptación con la misma regla del editor guiado.",

  // Empty states + líneas de «por qué» en acciones importantes
  "empty.learn":
    "Un workspace vacío significa que aún no hay ningún contrato en disco. En SDD se empieza por la spec, no por el código: crea una, aunque sea pequeña.",
  "sheet.noTasks.hint":
    "El plan todavía no se ha bajado a tareas. Añade líneas «- [ ]» en tasks.md (o pídeselo a tu agente) para poder seguir el avance aquí.",
  "approval.why":
    "Esta firma queda escrita en spec.md y es lo que abre el gate para esta spec.",
  "edge.why": "«depende de» y «bloquea» son las únicas uniones que generan avisos de dependencia.",
  "sheet.issues.why":
    "Reparte el trabajo fuera del repo sin perder el hilo: cada issue enlaza a su spec.",

  // ── Rediseño 2a (spec 030) ────────────────────────────────────────────────
  // Franja 1 — identidad
  "identity.search": "Buscar spec, ejecutar acción…",
  "identity.liveSaved": "en vivo · guardado",
  "identity.more": "Más acciones",

  // Franja 2 — contexto
  "context.filter": "filtro",
  "context.pending": "pendientes",
  "context.warnings": "con avisos",
  "context.drift": "con deriva",
  "context.meta": "{n} specs · {e} uniones · zoom {z}%",
  "context.metaBoard": "{n} specs · {c} columnas",

  // Franja 4 — compuerta
  "gatebar.open": "gate: abierto",
  "gatebar.closed": "gate: cerrado",
  "gatebar.blocked": "gate: bloqueado",
  "gatebar.rule": "no hay código sin spec aprobada",
  "gatebar.detail": "{e} error · {w} avisos · {a}/{t} aprobadas",
  "gatebar.emptyDetail":
    "sin specs en disco — crea la primera para que la compuerta tenga algo que leer",
  "gatebar.whatsMissing": "Ver qué falta",
  "gatebar.noIssues": "La compuerta no tiene pendientes que mostrar.",

  // Franja 3 — rail
  "rail.add": "añadir",
  "rail.specsEmpty": "— sin specs en disco —",

  // Menú ⋯
  "menu.exportPng": "Exportar PNG",
  "menu.reports": "Regenerar informes",
  "menu.bitacora": "Bitácora",
  "menu.assistant": "Asistente",
  "menu.templates": "Plantillas",
  "menu.tour": "Tour",
  "menu.language": "Idioma",
  "menu.dashboard": "Dashboard",

  // Drawer
  "drawer.blocked.title": "Implementar está bloqueado",
  "drawer.blocked.rule": "No hay código sin spec aprobada y plan consistente.",
  "drawer.blocked.pending": "Esta spec sigue pendiente.",
  "drawer.blocked.dep": "Depende de {id}, que tampoco está aprobada.",
  "drawer.blocked.goApprove": "Ir a aprobación",
  "drawer.blocked.openDep": "Abrir {id}",
  "drawer.score.label": "puntaje",
  "drawer.score.target": "meta {n}",
  "drawer.score.ears": "EARS {clean}/{total} limpios",
  "drawer.tasks.collapse": "plegar",
  "drawer.tasks.expand": "desplegar",
  "drawer.issues.cta": "Crear {n} issues de las tareas pendientes",
  "drawer.spec.excerpt": "primeras {n} líneas",
  "drawer.sections.intro":
    "Se reemplaza solo la sección que guardas dentro de spec.md. El bloque de aprobación no se toca.",
  "drawer.sections.dirty": "{n} secciones modificadas",
  "drawer.sections.discard": "Descartar",
  "drawer.sections.save": "Guardar en spec.md",
  "drawer.ears.what": "qué es EARS",
  "drawer.ears.vague":
    "Sin disparador ni respuesta medible. «{words}» no se puede testear — di cuántos ms.",

  // Aprobación (rediseño)
  "approval.intro":
    "Aprobar escribe el bloque real en spec.md: estado, fecha de hoy, quién firma y la evidencia. Eso es lo que leen la compuerta, la CI y tu agente antes de permitir código.",
  "approval.dateHint": "se estampa hoy",
  "approval.byPlaceholder": "¿Quién firma?",
  "approval.evidencePlaceholder": "enlace al hilo, o la cita del OK",
  "approval.evidenceHint":
    "Sin evidencia el bloque queda firmado pero sin rastro de dónde salió el OK.",
  "approval.consent.tag": "segundo paso · falta",

  // Relaciones (rediseño)
  "relations.intro":
    "Las uniones viven en board.canvas, no en la spec. Solo «depende de» y «bloquea» generan avisos de dependencia.",
  "relations.warnBody":
    "Implementar {id} sería construir sobre un contrato sin firmar. Es un aviso, no un bloqueo.",
  "relations.typesTitle": "los cuatro tipos",

  // Sin conexión
  "loadError.nothingLost":
    "El grafo es una vista de tus archivos; sin el servidor no hay archivos que mostrar. Nada se ha perdido.",
  "loadError.startIt": "arráncalo así",
  "loadError.apiTag": "api inalcanzable",
  "loadError.newTitle": "El builder no encuentra el servidor",

  // Asistente (rediseño)
  "assistant.tag": "borrador de board",
  "assistant.newTitle": "Descríbeme el proyecto en una frase",
  "assistant.newBody":
    "Propongo idea, épicas y specs conectadas. Nada se escribe en disco hasta que aceptes.",
  "assistant.proposal": "propuesta · {specs} specs · {epics} épicas",
  "assistant.copyPrompt": "Copiar prompt para tu agente MCP",
  "assistant.createN.one": "Crear 1 spec en disco",
  "assistant.createN.many": "Crear {n} specs en disco",

  // Implementar (rediseño)
  "implement.tag": "implementar · {id}",
  "implement.newTitle": "La compuerta está abierta para esta spec",
  "implement.newBody":
    "Copia el prompt y pégalo en tu agente. Lleva el workspace, la spec aprobada y la regla de la compuerta.",
  "implement.pre.approved": "spec aprobada",
  "implement.pre.plan": "plan consistente",
  "implement.pre.consent": "consentimiento registrado",
  "implement.copyClose": "Copiar y cerrar",
  "implement.agents": "Claude Code · Codex · Cursor · cualquier agente MCP",

  // Plantillas (rediseño)
  "templates.notEmpty":
    "Este workspace ya tiene {n} specs. Las plantillas solo se aplican en uno vacío, para no mezclar dos árboles de decisiones.",

  // Bitácora (rediseño)
  "bitacora.markdown": "markdown · se guarda en disco",

  // ⌘K
  "cmdk.actions": "acciones",
  "cmdk.specs": "specs",
  "cmdk.foot": "↑↓ moverse · ↩ ejecutar · esc cerrar",
  "cmdk.approveOpen": "Aprobar la spec abierta",
  "cmdk.validate": "Validar la compuerta ahora",
  "cmdk.logDecision": "Registrar una decisión en la bitácora",
  "cmdk.reports": "Regenerar STATUS.md y el roadmap",
  "cmdk.exportPng": "Exportar el grafo como PNG",
  "cmdk.templates": "Abrir plantillas",
  "cmdk.assistant": "Abrir el asistente",
  "cmdk.tour": "Ver el tour de bienvenida",
  "cmdk.lang": "Cambiar idioma ({lang})",
  "cmdk.saveNow": "Guardar ahora",
  "cmdk.dashboard": "Ir al dashboard",

  // Kanban (rediseño)
  "kanban.dropHint": "arrastra un borrador aquí",
  "kanban.dropBody":
    "Se abre el formulario de aprobación: aprobar necesita quién firma y con qué evidencia.",

  // Tour (rediseño)
  "tour.step": "paso {n} / {total}"
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
  "common.loading": "Loading…",

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
  "canvas.specNotDeletable": "Spec cards can't be deleted from the graph",
  "jump.title": "Go to a spec",
  "jump.placeholder": "Type a number or part of the title…",
  "jump.empty": "No spec matches.",
  "jump.hint": "↑↓ to move · Enter to open · Esc to close",
  "consent.title": "Your consent is missing",
  "consent.why": "Approving says the spec is ready. Consenting says you authorise starting the implementation. Two decisions, and the gate asks for both.",
  "consent.submit": "I authorise starting implementation",
  "consent.busy": "Recording…",
  "consent.done": "Consent recorded. The gate can see it now.",
  "consent.summary": "The author authorised starting the implementation of {spec} from the builder",
  "canvas.specNotDeletableWhy": "Each card is a real folder under specs/. Delete it on disk if you really mean to remove it; notes can be deleted here.",
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
  "topbar.view.canvas": "Graph",
  "topbar.view.board": "Board",
  "topbar.presence.title": "{n} people viewing this workspace",
  "topbar.undo": "Undo",
  "topbar.undo.title": "Undo (⌘Z / Ctrl+Z)",
  "topbar.redo": "Redo",
  "topbar.redo.title": "Redo (⇧⌘Z / Ctrl+Shift+Z)",
  "topbar.png": "PNG",
  "topbar.png.exporting": "Exporting…",
  "topbar.png.title": "Exports the board as an image",
  "topbar.reports": "Reports",
  "topbar.reports.busy": "Generating…",
  "topbar.reports.title": "Regenerates STATUS.md and docs/roadmap from specs/INDEX.md",
  "topbar.bitacora": "Logbook",
  "topbar.bitacora.title": "Record a decision, daily log or handoff without leaving the canvas",
  "bitacora.aria": "Record a logbook entry",
  "bitacora.title": "Record in the logbook",
  "bitacora.note":
    "Every entry is written to the project's bitácora folder with the same rules as MCP or the terminal — no format drift.",
  "bitacora.kind": "Entry type",
  "bitacora.kind.decisiones": "Decision",
  "bitacora.kind.handoffs": "Handoff",
  "bitacora.kind.diaria": "Daily log",
  "bitacora.kind.global": "Global project log",
  "bitacora.fileName": "File name (.md)",
  "bitacora.date": "Date",
  "bitacora.content": "Content (markdown)",
  "bitacora.contentPh.decisiones": "# Decision\n\n## Context\n\n## Decision\n\n## Rejected alternatives\n\n## When to revisit",
  "bitacora.contentPh.handoffs": "# Handoff\n\n## Current state\n\n## Next step",
  "bitacora.contentPh.diaria": "# Daily\n\n## Done today\n\n## Next",
  "bitacora.contentPh.global": "Entry for bitacora/global/PROJECT_LOG.md…",
  "bitacora.submit": "Save entry",
  "bitacora.busy": "Saving…",
  "bitacora.done": "Entry recorded",
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
  "empty.title": "No contract on disk yet",
  "empty.body":
    "In SDD you start from the spec, not the code. A spec is a real folder — spec.md, plan.md, tasks.md — and it's the only thing that can open the gate.",
  "empty.cta": "Create the first spec",
  "empty.describe": "Describe the project",
  "empty.template": "Use a template",
  "empty.terminal": "or from the terminal",
  "loadError.title": "Could not load the board",
  "loadError.hint": "Is the server running?",

  // Palette
  "palette.title": "Palette",
  "palette.help": "Drag onto the graph (or click)",
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
  "tour.back": "Back",
  "tour.next": "Next",
  "tour.finish": "Finish",
  "tour.1.title": "The rail is your whole project",
  "tour.1.body":
    "Up top, what you can place on the graph: Idea and Epic live only here; Spec writes a real folder. Below, the specs on disk with their state.",
  "tour.2.title": "2 · Create a spec",
  "tour.2.body":
    "The Spec card creates a real specs/NNN-… folder with spec, plan and tasks — no terminal needed.",
  "tour.3.title": "3 · Connect cards",
  "tour.3.body":
    "Drag from a card's right handle to another card to connect them, then pick the connection's purpose (contains, depends on, blocks or related).",
  "tour.4.title": "4 · Tasks and editor",
  "tour.4.body":
    "Click a spec card to open the panel: tick tasks and edit every spec section with its own form.",
  "tour.5.title": "5 · The gate",
  "tour.5.body":
    "The bottom bar tells you whether you can implement: green open, amber closed, red blocked — with the rule always in sight. Press “Validate now” to check.",

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
  "assistant.proposeOne": "Propose one spec",
  "assistant.proposeOne.ai": "Your connected agent structures it and you review it before it is created",
  "assistant.proposeOne.local": "Local single-spec draft; with no agent there is no AI involved",
  "assistant.proposeBoard": "Propose full board",
  "assistant.draftNote": "Draft (not saved yet): rename or remove specs before creating.",
  "assistant.keepOne": "Keep at least one spec in the draft",
  "assistant.regenerate": "regenerate",
  "assistant.regenerate.title": "Proposes alternative names",
  "assistant.create": "Create on the board",
  "assistant.creating": "Creating…",
  "assistant.meta.one": "{specs} specs · 1 epic: {names}",
  "assistant.meta.many": "{specs} specs · {epics} epics: {names}",
  "assistant.specNameAria": "Spec name {key}",
  "assistant.epicTag": "Epic",
  "assistant.agent.toggle": "🤖 Have an AI agent?",
  "assistant.agent.note":
    "Paste this prompt into your agent connected to the sdd-mcp MCP: it will generate the board with real intelligence (specs with a draft included).",

  // Implement modal
  "implement.title": "Implement with agent",
  "implement.aria": "Implement {id} with an agent",
  "implement.note":
    "Copy this prompt and paste it into your agent (Claude Code, Codex, Cursor…). It includes the workspace, the approved spec and the SDD gate with consent.",

  // Prompt box
  "prompt.copy": "Copy prompt",
  "prompt.copied": "✓ Copied",
  "prompt.manual": "Select and copy (Ctrl+C)",

  // AI assistance without copy-paste (spec 031)
  "ai.assist": "Expand with AI",
  // Version drift notice (spec 029)
  "version.behind": "Your project uses SDD {installed} and the server is {server}",
  "version.driftOnly": "Some framework files do not match version {server}",
  "version.stale": "{n} framework files to repair",
  "version.missing": "{n} missing",
  "version.yours": "{n} of yours differ (left untouched)",
  "version.safe": "It repairs framework files and never writes yours unless you ask.",
  "ai.title": "Ask the agent",
  "ai.instruction.ph": "What should the agent do with this field (expand, rewrite, propose more…)",
  "ai.send": "Send to agent",
  "ai.sending": "Sending…",
  "ai.pending": "Pending — waiting for the agent to claim it",
  "ai.working": "In progress — {agent} is drafting",
  "ai.answered": "Agent's proposal",
  "ai.accept": "Accept",
  "ai.applying": "Applying…",
  "ai.reject": "Reject",
  "ai.cancel": "Cancel request",
  "ai.again": "Ask again",
  "ai.stalled": "stalled >10 min",
  "ai.agentOn": "agent: {agent}",
  "ai.noAgentShort": "no agent",
  "ai.noAgent":
    "No agent is listening to the queue. Keep an MCP-connected session serving requests (sdd_next_request) or use the classic prompt:",
  "ai.queue.one": "AI: 1 request",
  "ai.queue.many": "AI: {n} requests",
  "ai.queue.title": "AI requests",
  "ai.queue.empty": "No active requests.",
  "ai.status.pending": "pending",
  "ai.status.in_progress": "in progress",
  "ai.status.answered": "answered — review the proposal in its field",
  "assistant.structure": "Structure with AI",
  "assistant.structure.waiting": "The agent is structuring your idea. The proposal will appear here on its own.",
  "assistant.structure.title": "Draft proposed by the agent",
  "assistant.structure.name": "Spec name",
  "assistant.structure.create": "Create spec with these sections",
  "assistant.structure.parseError":
    "The agent's proposal could not be parsed as sections. Reject it and ask again.",

  // Connect agent (spec 032)
  "ai.connect": "How do I connect an agent",
  "cmdk.connect": "Connect agent",
  "empty.connect": "Connect an agent",
  "connect.tag": "CONNECT AGENT",
  "connect.title": "Connect your agent to this workspace",
  "connect.body":
    "One command registers the MCP in every client it finds (Claude Code, Codex, Cursor, VS Code, Windsurf, Gemini, opencode) and installs the skill that serves the queue. It does not overwrite your config: it merges into it.",
  "connect.step1": "1 · Run this in your terminal",
  "connect.step1.hint":
    "It respects whatever you already configured and is safe to re-run. Add --dry-run to see what it would do without writing anything.",
  "connect.step2": "2 · Put the agent to serve the queue",
  "connect.manual": "If you prefer doing it by hand, this goes in {file}:",
  "connect.footer":
    "After connecting, restart the client so it loads the MCP. While an agent polls the queue, the \"Expand with AI\" buttons work on their own.",

  // Spec sheet (drawer)
  "sheet.aria": "Spec {id} detail",
  "sheet.tab.summary": "Summary",
  "sheet.tab.edit": "Edit spec",
  "sheet.tab.approval": "Approval",
  "sheet.tab.relations": "Relations",
  "sheet.tab.review": "AI review",

  // 🔎 AI review of the spec (spec 036)
  "review.tag": "SPEC REVIEW",
  "review.intro":
    "An AI reads the spec and returns findings anchored to their section. It writes nothing: each finding takes you to the field and you decide.",
  "review.ask": "Ask the agent for a review",
  "review.asking": "Sending…",
  "review.pending": "Pending — waiting for the agent to claim it",
  "review.working": "In progress — {agent} is reviewing",
  "review.noAgent":
    "No agent is serving the queue. Copy the prompt, paste it into whichever AI you use (any of them, even without MCP) and bring its answer back down here.",
  "review.paste": "Paste your AI's answer here",
  "review.paste.ph": "Whatever JSON it returns, as is — with or without code fences",
  "review.read": "Read the answer",
  "review.parseError":
    "That cannot be read as a review. Ask again, reminding it to reply ONLY with the JSON from the prompt.",
  "review.clean": "No findings: the AI sees nothing to fix in this spec.",
  "review.count.one": "1 finding",
  "review.count.many": "{n} findings",
  "review.dropped.one": "1 dropped: it anchored to a section that does not exist.",
  "review.dropped.many": "{n} dropped: they anchored to a section that does not exist.",
  "review.severity.blocker": "blocker",
  "review.severity.warning": "warning",
  "review.severity.note": "note",
  "review.fix": "Fix",
  "review.fix.title": "Opens this section in the editor with the instruction already written",
  "review.fix.instruction": "Fix this: {finding}. {why}",
  "review.again": "Review again",
  "sheet.loading": "Loading…",
  "sheet.tasks": "Tasks",
  "sheet.tasks.count": "{done}/{total} done",
  "sheet.noTasks": "No tasks",
  "sheet.implement": "Implement with agent",
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

  // Spec 028: score + EARS lint in the drawer, and add-task from the canvas
  "sheet.score": "Spec score",
  "sheet.ears.summary": "EARS: {ok}/{total} clean",
  "sheet.addTask.ph": "New task for this spec…",
  "sheet.addTask.btn": "Add task",
  "sheet.addTask.adding": "Adding…",

  // Status badges
  "status.approved": "Approved",
  "status.pending": "Pending",
  "status.done": "Done",
  "status.tasks": "{done}/{total} tasks",
  "status.open": "Open →",
  "status.gateErrors": "Gate errors:",
  "status.depWarn": "Unapproved dependencies:",
  "status.drift": "Code changed after approval:",
  "status.driftTitle": "Spec ↔ code drift",
  "status.driftClean": "No drift since approval",
  "status.driftUnscoped": "No file scope declared",
  "status.driftUnknown": "Drift not computable",

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
  "editor.save": "Save sections",
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
  "approval.submit": "Approve spec",
  "approval.update": "Update approval",
  "approval.busy": "Writing…",
  "approval.done": "Approval written into spec.md",

  // Relations tab
  "relations.incoming": "Incoming",
  "relations.outgoing": "Outgoing",
  "relations.none": "This spec has no links in the graph.",
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

  // Notes
  "note.idea.new": "New idea",
  "note.epic.new": "New epic",
  "note.empty": "(empty)",
  "note.editTitle": "Double-click to edit",

  // Client-side errors
  "error.apiUnreachable":
    "Could not reach the API — start the server: SDD_PROJECT_ROOT=/path/to/your/project npm run mcp:http:start",
  "error.templatesNonEmpty":
    "This workspace already has specs; templates only apply to an empty workspace.",
  "error.planPartial.none":
    "Not a single spec was created: \"{name}\" failed. Nothing was touched — neither the disk nor the board.",
  "error.planPartial.one":
    "1 spec was created and then \"{name}\" failed. What was created is kept and the board already shows it; check the error and retry with the rest only.",
  "error.planPartial.many":
    "{n} specs were created and then \"{name}\" failed. What was created is kept and the board already shows it; check the error and retry with the rest only.",

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
    "Idea is a free note and Epic groups specs: both live only in the graph and never touch disk. Spec does create a real specs/NNN-… folder with spec.md, plan.md and tasks.md: it is the unit you approve and the only one that can open the gate.",

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

  "help.score.title": "0-100 score, computed on the server",
  "help.score.body":
    "The same scoreSpec agents use over MCP: required files, spec sections, plan signals, task breakdown, research rationale and dated history. The notes say exactly what to improve. The EARS summary lints the acceptance criteria with the same rule as the guided editor.",

  // Empty states + the "why" line on important actions
  "empty.learn":
    "An empty workspace means there is no contract on disk yet. In SDD you start with the spec, not the code: create one, however small.",
  "sheet.noTasks.hint":
    "The plan has not been broken down into tasks yet. Add “- [ ]” lines to tasks.md (or ask your agent to) so progress shows up here.",
  "approval.why":
    "This signature gets written into spec.md, and it is what opens the gate for this spec.",
  "edge.why": "“depends on” and “blocks” are the only connections that raise dependency warnings.",
  "sheet.issues.why":
    "Hand the work out beyond the repo without losing track of it: every issue links back to its spec.",

  // ── Redesign 2a (spec 030) ────────────────────────────────────────────────
  "identity.search": "Search specs, run an action…",
  "identity.liveSaved": "live · saved",
  "identity.more": "More actions",

  "context.filter": "filter",
  "context.pending": "pending",
  "context.warnings": "with warnings",
  "context.drift": "with drift",
  "context.meta": "{n} specs · {e} links · zoom {z}%",
  "context.metaBoard": "{n} specs · {c} columns",

  "gatebar.open": "gate: open",
  "gatebar.closed": "gate: closed",
  "gatebar.blocked": "gate: blocked",
  "gatebar.rule": "no code without an approved spec",
  "gatebar.detail": "{e} error · {w} warnings · {a}/{t} approved",
  "gatebar.emptyDetail":
    "no specs on disk — create the first one so the gate has something to read",
  "gatebar.whatsMissing": "See what's missing",
  "gatebar.noIssues": "The gate has nothing pending to show.",

  "rail.add": "add",
  "rail.specsEmpty": "— no specs on disk —",

  "menu.exportPng": "Export PNG",
  "menu.reports": "Regenerate reports",
  "menu.bitacora": "Logbook",
  "menu.assistant": "Assistant",
  "menu.templates": "Templates",
  "menu.tour": "Tour",
  "menu.language": "Language",
  "menu.dashboard": "Dashboard",

  "drawer.blocked.title": "Implementing is blocked",
  "drawer.blocked.rule": "No code without an approved spec and a consistent plan.",
  "drawer.blocked.pending": "This spec is still pending.",
  "drawer.blocked.dep": "It depends on {id}, which isn't approved either.",
  "drawer.blocked.goApprove": "Go to approval",
  "drawer.blocked.openDep": "Open {id}",
  "drawer.score.label": "score",
  "drawer.score.target": "target {n}",
  "drawer.score.ears": "EARS {clean}/{total} clean",
  "drawer.tasks.collapse": "collapse",
  "drawer.tasks.expand": "expand",
  "drawer.issues.cta": "Create {n} issues from the open tasks",
  "drawer.spec.excerpt": "first {n} lines",
  "drawer.sections.intro":
    "Only the section you save is replaced inside spec.md. The approval block is left alone.",
  "drawer.sections.dirty": "{n} sections changed",
  "drawer.sections.discard": "Discard",
  "drawer.sections.save": "Save into spec.md",
  "drawer.ears.what": "what is EARS",
  "drawer.ears.vague":
    "No trigger and no measurable response. «{words}» can't be tested — say how many ms.",

  "approval.intro":
    "Approving writes the real block into spec.md: status, today's date, who signs and the evidence. That's what the gate, CI and your agent read before allowing any code.",
  "approval.dateHint": "stamped today",
  "approval.byPlaceholder": "Who signs?",
  "approval.evidencePlaceholder": "link to the thread, or quote the OK",
  "approval.evidenceHint":
    "Without evidence the block is signed but leaves no trace of where the OK came from.",
  "approval.consent.tag": "second step · missing",

  "relations.intro":
    "Links live in board.canvas, not in the spec. Only «depends on» and «blocks» raise dependency warnings.",
  "relations.warnBody":
    "Implementing {id} would build on an unsigned contract. It's a warning, not a block.",
  "relations.typesTitle": "the four types",

  "loadError.nothingLost":
    "The graph is a view of your files; without the server there are no files to show. Nothing was lost.",
  "loadError.startIt": "start it like this",
  "loadError.apiTag": "api unreachable",
  "loadError.newTitle": "The builder can't find the server",

  "assistant.tag": "board draft",
  "assistant.newTitle": "Describe the project in one sentence",
  "assistant.newBody":
    "I'll propose an idea, epics and connected specs. Nothing is written to disk until you accept.",
  "assistant.proposal": "proposal · {specs} specs · {epics} epics",
  "assistant.copyPrompt": "Copy the prompt for your MCP agent",
  "assistant.createN.one": "Create 1 spec on disk",
  "assistant.createN.many": "Create {n} specs on disk",

  "implement.tag": "implement · {id}",
  "implement.newTitle": "The gate is open for this spec",
  "implement.newBody":
    "Copy the prompt and paste it into your agent. It carries the workspace, the approved spec and the gate rule.",
  "implement.pre.approved": "spec approved",
  "implement.pre.plan": "plan consistent",
  "implement.pre.consent": "consent recorded",
  "implement.copyClose": "Copy and close",
  "implement.agents": "Claude Code · Codex · Cursor · any MCP agent",

  "templates.notEmpty":
    "This workspace already has {n} specs. Templates only apply to an empty one, so two decision trees don't get mixed.",

  "bitacora.markdown": "markdown · saved to disk",

  "cmdk.actions": "actions",
  "cmdk.specs": "specs",
  "cmdk.foot": "↑↓ move · ↩ run · esc close",
  "cmdk.approveOpen": "Approve the open spec",
  "cmdk.validate": "Validate the gate now",
  "cmdk.logDecision": "Log a decision in the bitácora",
  "cmdk.reports": "Regenerate STATUS.md and the roadmap",
  "cmdk.exportPng": "Export the graph as PNG",
  "cmdk.templates": "Open templates",
  "cmdk.assistant": "Open the assistant",
  "cmdk.tour": "Show the welcome tour",
  "cmdk.lang": "Switch language ({lang})",
  "cmdk.saveNow": "Save now",
  "cmdk.dashboard": "Go to the dashboard",

  "kanban.dropHint": "drag a draft here",
  "kanban.dropBody":
    "The approval form opens: approving needs who signs and with what evidence.",

  "tour.step": "step {n} / {total}"
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
