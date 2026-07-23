// The native menu, built from actions the composition root supplies.
//
// Nothing here knows how to open a project, copy a URL or restart a server: it
// knows which labels exist, what they are called in two languages, and which
// action each one triggers. Adding an entry is adding a descriptor; changing
// what an entry does never touches this file.

import { Menu, type MenuItemConstructorOptions } from "electron";
import type { Lang, Translator } from "./i18n.js";

export interface MenuActions {
  openProject: () => void;
  revealProject: () => void;
  copyMcpUrl: () => void;
  showConnection: () => void;
  setLang: (lang: Lang) => void;
}

export interface MenuState {
  /** Entries that act on a project stay disabled until there is one. */
  hasWorkspace: boolean;
}

const IS_MAC = process.platform === "darwin";

export function buildMenu(t: Translator, actions: MenuActions, state: MenuState): Menu {
  const projectItems: MenuItemConstructorOptions[] = [
    {
      label: t("menu.openProject"),
      accelerator: "CmdOrCtrl+O",
      click: actions.openProject
    },
    {
      label: t("menu.revealProject"),
      enabled: state.hasWorkspace,
      click: actions.revealProject
    },
    { type: "separator" },
    {
      label: t("menu.showConnection"),
      enabled: state.hasWorkspace,
      click: actions.showConnection
    },
    {
      label: t("menu.copyMcpUrl"),
      accelerator: "CmdOrCtrl+Shift+C",
      enabled: state.hasWorkspace,
      click: actions.copyMcpUrl
    }
  ];

  const languageSubmenu: MenuItemConstructorOptions[] = [
    {
      label: t("menu.spanish"),
      type: "radio",
      checked: t.lang === "es",
      click: () => actions.setLang("es")
    },
    {
      label: t("menu.english"),
      type: "radio",
      checked: t.lang === "en",
      click: () => actions.setLang("en")
    }
  ];

  const template: MenuItemConstructorOptions[] = [];

  if (IS_MAC) {
    // The first menu is the application menu on macOS, and its roles carry
    // behaviour the OS expects (Services, Hide Others, About). Only the labels
    // are ours.
    template.push({
      label: t("app.name"),
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit", label: t("menu.quit") }
      ]
    });
  }

  template.push({
    label: t("menu.file"),
    submenu: IS_MAC ? projectItems : [...projectItems, { type: "separator" }, { role: "quit", label: t("menu.quit") }]
  });

  template.push({
    label: t("menu.edit"),
    submenu: [
      { role: "undo", label: t("menu.undo") },
      { role: "redo", label: t("menu.redo") },
      { type: "separator" },
      { role: "cut", label: t("menu.cut") },
      { role: "copy", label: t("menu.copy") },
      { role: "paste", label: t("menu.paste") },
      { role: "selectAll", label: t("menu.selectAll") }
    ]
  });

  template.push({
    label: t("menu.view"),
    submenu: [
      { role: "reload", label: t("menu.reload") },
      { role: "toggleDevTools", label: t("menu.toggleDevTools") },
      { type: "separator" },
      { role: "resetZoom", label: t("menu.resetZoom") },
      { role: "zoomIn", label: t("menu.zoomIn") },
      { role: "zoomOut", label: t("menu.zoomOut") },
      { type: "separator" },
      { role: "togglefullscreen", label: t("menu.fullScreen") },
      { type: "separator" },
      { label: t("menu.language"), submenu: languageSubmenu }
    ]
  });

  template.push({
    label: t("menu.window"),
    submenu: [
      { role: "minimize", label: t("menu.minimize") },
      { role: "close", label: t("menu.close") }
    ]
  });

  return Menu.buildFromTemplate(template);
}

export function applyMenu(t: Translator, actions: MenuActions, state: MenuState): void {
  Menu.setApplicationMenu(buildMenu(t, actions, state));
}
