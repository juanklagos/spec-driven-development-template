// Update checking — spec 023 R9.
//
// Two rules shape everything here.
//
// NEVER FORCED. The check is silent unless there is something to say, the
// dialog always has a way out, and nothing installs without the user saying so.
// An update prompt that interrupts work is worse than an old version.
//
// NEVER PRETEND. On macOS, electron-updater can only apply an update to a
// SIGNED app: the Squirrel.Mac path verifies the code signature and refuses an
// unsigned bundle. This project has no Developer ID yet, so on macOS the honest
// move is to point at the download page rather than run a download that is
// guaranteed to fail at the last step. Windows and Linux (AppImage) install
// unsigned updates fine, so there they get the real thing.
//
// The feed is the fixed `desk-latest` tag (see electron-builder.yml): the
// GitHub provider resolves the repository's "latest" release, which the desktop
// app deliberately does not own.

import { app, dialog, shell } from "electron";
import electronUpdater from "electron-updater";
import type { Translator } from "./i18n.js";

const { autoUpdater } = electronUpdater;

const DOWNLOAD_PAGE = "https://juanklagos.github.io/spec-driven-development-template/en/download/";

/**
 * macOS applies updates only to signed builds. Until this project has a
 * Developer ID, `canInstallInPlace` is false there and the user is sent to the
 * download page instead of into a download that cannot complete.
 */
const canInstallInPlace = process.platform !== "darwin";

export function initUpdates(t: Translator): void {
  // In development there is no packaged app to replace, and app-update.yml does
  // not exist — checking would only produce a confusing error in the console.
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  // A failed check is not the user's problem: no network, a rate limit or a
  // release being edited are all normal. Log and stay quiet.
  autoUpdater.on("error", (error) => {
    console.error("[sdd-desk] update check failed:", error);
  });

  autoUpdater.on("update-available", (info) => {
    void offerUpdate(t, String(info.version));
  });

  void autoUpdater.checkForUpdates().catch((error) => {
    console.error("[sdd-desk] update check failed:", error);
  });
}

async function offerUpdate(t: Translator, version: string): Promise<void> {
  const answer = await dialog.showMessageBox({
    type: "info",
    title: t("update.title"),
    message: t("update.title"),
    detail: `${t("update.body")}\n\n${version}${canInstallInPlace ? "" : `\n\n${t("update.macNote")}`}`,
    buttons: [canInstallInPlace ? t("update.install") : t("update.open"), t("update.later")],
    defaultId: 0,
    cancelId: 1
  });
  if (answer.response !== 0) return;

  if (!canInstallInPlace) {
    void shell.openExternal(DOWNLOAD_PAGE);
    return;
  }

  try {
    await autoUpdater.downloadUpdate();
  } catch (error) {
    console.error("[sdd-desk] update download failed:", error);
    void shell.openExternal(DOWNLOAD_PAGE);
    return;
  }

  const restart = await dialog.showMessageBox({
    type: "info",
    title: t("update.readyTitle"),
    message: t("update.readyTitle"),
    detail: t("update.readyBody"),
    buttons: [t("update.restart"), t("update.later")],
    defaultId: 0,
    cancelId: 1
  });
  // Declining here is not a dead end: autoInstallOnAppQuit is off precisely so
  // "later" means later, not "next time you close the window, surprise".
  if (restart.response === 0) autoUpdater.quitAndInstall();
}
