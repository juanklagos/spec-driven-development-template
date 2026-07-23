// The builder window: how it is created, and what it is allowed to do.
//
// Two rules here are load-bearing, not defensive habit:
//
// 1. THE WINDOW LOADS OVER http://127.0.0.1, NEVER file://.
//    packages/sdd-mcp/src/security.ts rejects the origin "null" that file://
//    pages send, and it only guards mutating methods. A file:// window would
//    therefore read the whole board correctly and fail every single write —
//    an app that looks like it works and silently loses your edits. Serving the
//    same bytes from the local server costs nothing and removes the failure
//    mode entirely.
//
// 2. The renderer runs untrusted-by-default. It is a full browser pointed at a
//    page that renders project content; nothing about that needs Node.

import { BrowserWindow, shell } from "electron";
import { appIconPath } from "./assets.js";

export interface BuilderWindowDeps {
  /** The origin currently served. It changes when the workspace restarts on a
   *  new port, so this is a getter and not a captured string. */
  allowedOrigin: () => string | null;
  title: string;
}

const WINDOW_DEFAULTS = {
  width: 1440,
  height: 900,
  minWidth: 900,
  minHeight: 600
} as const;

export function createBuilderWindow(deps: BuilderWindowDeps): BrowserWindow {
  // Windows and Linux read the window icon from here. macOS ignores it and uses
  // the bundle's .icns, which electron-builder generates from the same PNG —
  // one source, three platforms.
  const icon = appIconPath();

  const window = new BrowserWindow({
    ...WINDOW_DEFAULTS,
    ...(icon === null ? {} : { icon }),
    title: deps.title,
    show: false,
    backgroundColor: "#12141a",
    webPreferences: {
      // No preload script exists, so there is nothing to leak; these stay
      // explicit anyway, because a future preload must be a deliberate decision
      // rather than something that inherits permissive defaults.
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      sandbox: true,
      webviewTag: false
    }
  });

  // Anything that is not the local server opens in the user's real browser.
  // The builder links to documentation and to GitHub; those belong there, and a
  // window with no address bar is the worst possible place to land on a page
  // you did not choose.
  const isAllowed = (target: string): boolean => {
    const origin = deps.allowedOrigin();
    if (!origin) return false;
    try {
      return new URL(target).origin === origin;
    } catch {
      return false;
    }
  };

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (!isAllowed(url)) {
      void shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  window.webContents.on("will-navigate", (event, url) => {
    if (isAllowed(url)) return;
    event.preventDefault();
    void shell.openExternal(url);
  });

  // The builder needs no camera, microphone, geolocation or notifications.
  // Denying by default means a future dependency cannot quietly start asking.
  window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false);
  });

  // The builder sets its own <title>, which Electron mirrors onto the window by
  // default — so the frame would say "SDD Builder" and never name the project
  // you are looking at. The title bar is the app's to own, not the page's.
  window.on("page-title-updated", (event) => event.preventDefault());

  window.once("ready-to-show", () => window.show());

  return window;
}

/**
 * Point the window at a workspace. Guards the rule above at runtime instead of
 * trusting every future caller to remember it.
 */
export async function showWorkspace(window: BrowserWindow, builderUrl: string, title: string): Promise<void> {
  const url = new URL(builderUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(
      `SDD Desk must load the builder over HTTP, got "${url.protocol}". ` +
        "A file:// origin is rejected by the server on every write (see security.ts)."
    );
  }
  window.setTitle(title);
  await window.loadURL(builderUrl);
}
