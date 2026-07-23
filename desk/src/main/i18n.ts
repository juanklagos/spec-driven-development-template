// Native-chrome strings for SDD Desk — one language at a time, like the rest
// of the project. The builder window has its own switcher for its own UI; this
// dictionary only covers what Electron draws: menus, dialogs, errors.
//
// A flat record of ids keeps the two languages side by side, so a missing
// translation is visible while editing instead of at runtime.

export type Lang = "es" | "en";

export const LANGS: readonly Lang[] = ["es", "en"];

export function isLang(value: unknown): value is Lang {
  return value === "es" || value === "en";
}

type Dictionary = Record<Lang, string>;

const STRINGS = {
  "app.name": { es: "SDD Desk", en: "SDD Desk" },

  "menu.file": { es: "Archivo", en: "File" },
  "menu.openProject": { es: "Abrir proyecto…", en: "Open project…" },
  "menu.revealProject": { es: "Mostrar el proyecto en el sistema", en: "Reveal project in file manager" },
  "menu.copyMcpUrl": { es: "Copiar la URL MCP", en: "Copy the MCP URL" },
  "menu.showConnection": { es: "Conectar un agente…", en: "Connect an agent…" },
  "menu.quit": { es: "Salir", en: "Quit" },

  "menu.view": { es: "Ver", en: "View" },
  "menu.reload": { es: "Recargar", en: "Reload" },
  "menu.toggleDevTools": { es: "Herramientas de desarrollo", en: "Developer tools" },
  "menu.resetZoom": { es: "Tamaño original", en: "Actual size" },
  "menu.zoomIn": { es: "Acercar", en: "Zoom in" },
  "menu.zoomOut": { es: "Alejar", en: "Zoom out" },
  "menu.fullScreen": { es: "Pantalla completa", en: "Toggle full screen" },

  "menu.language": { es: "Idioma", en: "Language" },
  "menu.spanish": { es: "Español", en: "Spanish" },
  "menu.english": { es: "Inglés", en: "English" },

  "menu.edit": { es: "Edición", en: "Edit" },
  "menu.undo": { es: "Deshacer", en: "Undo" },
  "menu.redo": { es: "Rehacer", en: "Redo" },
  "menu.cut": { es: "Cortar", en: "Cut" },
  "menu.copy": { es: "Copiar", en: "Copy" },
  "menu.paste": { es: "Pegar", en: "Paste" },
  "menu.selectAll": { es: "Seleccionar todo", en: "Select all" },

  "menu.window": { es: "Ventana", en: "Window" },
  "menu.minimize": { es: "Minimizar", en: "Minimize" },
  "menu.close": { es: "Cerrar", en: "Close" },

  "picker.title": { es: "Elige la carpeta de tu proyecto SDD", en: "Choose your SDD project folder" },
  "picker.button": { es: "Abrir este proyecto", en: "Open this project" },

  "invalid.title": { es: "Esa carpeta no es un proyecto SDD", en: "That folder is not an SDD project" },
  "invalid.body": {
    es:
      "Un proyecto SDD tiene una carpeta specs/ o un sidecar spec/specs/.\n\n" +
      "Puedes crear uno con:\n  npx @juanklagos/create-sdd-project@latest .",
    en:
      "An SDD project has a specs/ folder or a spec/specs/ sidecar.\n\n" +
      "You can create one with:\n  npx @juanklagos/create-sdd-project@latest ."
  },
  "invalid.retry": { es: "Elegir otra carpeta", en: "Choose another folder" },
  "invalid.quit": { es: "Salir", en: "Quit" },

  "connection.title": { es: "Conectar un agente a esta ventana", en: "Connect an agent to this window" },
  "connection.body": {
    es:
      "Esta aplicación ya es el servidor MCP de tu proyecto. Apunta tu agente a esta URL " +
      "y trabajará sobre el mismo workspace que estás viendo:",
    en:
      "This application is already your project's MCP server. Point your agent at this URL " +
      "and it will work on the very workspace you are looking at:"
  },
  "connection.copyUrl": { es: "Copiar la URL", en: "Copy the URL" },
  "connection.copyConfig": { es: "Copiar la configuración", en: "Copy the config" },
  "connection.close": { es: "Cerrar", en: "Close" },

  "startup.failed.title": { es: "No se pudo iniciar el servidor SDD", en: "Could not start the SDD server" },

  "window.title": { es: "SDD Desk", en: "SDD Desk" }
} as const satisfies Record<string, Dictionary>;

export type StringId = keyof typeof STRINGS;

export interface Translator {
  readonly lang: Lang;
  (id: StringId): string;
}

/** A translator bound to one language, so call sites never pass it around. */
export function createTranslator(lang: Lang): Translator {
  const translate = ((id: StringId) => STRINGS[id][lang]) as Translator;
  return Object.defineProperty(translate, "lang", { value: lang, enumerable: true }) as Translator;
}

/** The OS locale, narrowed to the two languages this project speaks. */
export function detectLang(locale: string | undefined): Lang {
  return locale?.toLowerCase().startsWith("es") ? "es" : "en";
}
