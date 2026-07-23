// Composition root: the only module that knows every other one exists.
//
// Everything below it is independent — the settings store never heard of
// Electron, the server host never heard of a window, the window never heard of
// a workspace picker. This file wires them, owns the app lifecycle, and is the
// one place to look for "what happens when".

import path from "node:path";
import { app, clipboard, shell, type BrowserWindow } from "electron";
import { appIconPath } from "./assets.js";
import { promptForWorkspace, showConnectionInfo, showStartupFailure } from "./dialogs.js";
import { createTranslator, detectLang, type Lang, type Translator } from "./i18n.js";
import { applyMenu } from "./menu.js";
import { createServerHost } from "./server-host.js";
import { createSettingsStore } from "./settings.js";
import { initUpdates } from "./updater.js";
import { isUsableWorkspace, workspaceLabel } from "./workspace.js";
import { createBuilderWindow, showWorkspace } from "./window.js";

// A second copy of the app would start a second server on a second port,
// pointed at the same files, and the two windows would fight over the board.
// `app.quit()` is asynchronous, so the rest of this module would otherwise run
// to completion in the losing instance — starting the very server the lock
// exists to prevent.
const IS_PRIMARY_INSTANCE = app.requestSingleInstanceLock();

// The app menu and the About panel derive from this; in development it would
// otherwise say "Electron".
app.setName("SDD Desk");

// And the settings folder is pinned explicitly, because setName does NOT move
// it. Electron resolves userData from the package name before this line runs,
// so a packaged build wrote to "sdd-desk" while the development build — where
// setName lands earlier in the startup order — wrote to "SDD Desk". Two
// locations for one file: the app remembered a different project depending on
// how it was launched, and only the packaged build showed it. Naming the path
// makes both builds agree by construction.
app.setPath("userData", path.join(app.getPath("appData"), "SDD Desk"));

const serverHost = createServerHost();
let window: BrowserWindow | null = null;
let translator: Translator = createTranslator("es");

async function main(): Promise<void> {
  await app.whenReady();

  // In development the Dock shows Electron's own icon, because there is no app
  // bundle yet. The packaged build gets it from the .icns and this is a no-op
  // there, but seeing the real mark while developing is how a wrong icon gets
  // noticed before it ships.
  const icon = appIconPath();
  if (icon !== null && app.dock) app.dock.setIcon(icon);

  const store = createSettingsStore(path.join(app.getPath("userData"), "settings.json"), {
    projectRoot: null,
    lang: detectLang(app.getLocale())
  });

  const settings = await store.read();
  translator = createTranslator(settings.lang);

  window = createBuilderWindow({
    allowedOrigin: () => serverHost.current()?.baseUrl ?? null,
    title: translator("window.title")
  });

  // Closing the window ends the app on every platform, macOS included. The
  // usual macOS convention (stay alive, no windows) would leave an HTTP server
  // and a filesystem watcher running behind an empty Dock icon.
  window.on("closed", () => {
    window = null;
    app.quit();
  });

  const refreshMenu = (): void =>
    applyMenu(translator, actions, { hasWorkspace: serverHost.current() !== null });

  /** Open a workspace end to end: server, window, title, menu, settings. */
  async function openWorkspace(projectRoot: string): Promise<void> {
    const server = await serverHost.open(projectRoot);
    await store.update({ projectRoot });
    if (window) {
      await showWorkspace(window, server.builderUrl, `${translator("app.name")} — ${workspaceLabel(projectRoot)}`);
    }
    refreshMenu();
  }

  const actions = {
    openProject: () => {
      void (async () => {
        const picked = await promptForWorkspace(translator, window);
        // Cancelling with a project already open means "never mind", not "quit".
        if (picked) await openWorkspace(picked);
      })();
    },

    revealProject: () => {
      const current = serverHost.current();
      if (current) shell.showItemInFolder(current.projectRoot);
    },

    copyMcpUrl: () => {
      const current = serverHost.current();
      if (current) clipboard.writeText(current.mcpUrl);
    },

    showConnection: () => {
      const current = serverHost.current();
      if (current) void showConnectionInfo(translator, current);
    },

    setLang: (lang: Lang) => {
      void (async () => {
        await store.update({ lang });
        translator = createTranslator(lang);
        const current = serverHost.current();
        if (window && current) {
          window.setTitle(`${translator("app.name")} — ${workspaceLabel(current.projectRoot)}`);
        }
        refreshMenu();
      })();
    }
  };

  refreshMenu();

  // The remembered project is a hint: it can have been renamed, deleted or
  // unmounted since the last run, so it is validated before being trusted.
  const remembered = (await isUsableWorkspace(settings.projectRoot)) ? settings.projectRoot : null;
  const projectRoot = remembered ?? (await promptForWorkspace(translator, window));

  if (!projectRoot) {
    // Declining the picker on a first run leaves nothing to show.
    app.quit();
    return;
  }

  await openWorkspace(projectRoot);

  // Last, and never blocking: the board is open before the app asks the network
  // anything. An update prompt is not worth a second of delay on startup.
  initUpdates(translator);
}

// The server outlives the window by design, so it is closed here rather than in
// the window's own teardown.
app.on("will-quit", (event) => {
  if (serverHost.current() === null) return;
  event.preventDefault();
  void serverHost.close().finally(() => app.quit());
});

if (IS_PRIMARY_INSTANCE) {
  main().catch((error) => {
    showStartupFailure(translator, error);
    app.quit();
  });
} else {
  app.quit();
}
