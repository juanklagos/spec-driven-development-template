// Every native dialog the app shows, in one module.
//
// They are grouped because they share a constraint: each one is a decision
// point where the user can leave the app in a state it has to handle (cancel
// the picker on a first run, reject a folder that is not a project). Keeping
// them together makes those exits visible next to each other instead of
// scattered through the lifecycle code.

import { BrowserWindow, clipboard, dialog } from "electron";
import type { SddHttpServer } from "@juanklagos/sdd-mcp/dist/http-server.js";
import type { Translator } from "./i18n.js";
import { rejectionFor } from "./workspace.js";

/**
 * Ask for a folder until it is an SDD workspace or the user gives up.
 * Returns null when they give up — the caller decides what that means, because
 * it means "quit" on a first run and "keep the current project" afterwards.
 */
export async function promptForWorkspace(
  t: Translator,
  parent: BrowserWindow | null
): Promise<string | null> {
  for (;;) {
    const picked = await (parent
      ? dialog.showOpenDialog(parent, openOptions(t))
      : dialog.showOpenDialog(openOptions(t)));

    const dir = picked.filePaths[0];
    if (picked.canceled || dir === undefined) return null;

    const rejection = await rejectionFor(dir);
    if (!rejection) return dir;

    // A folder that looks like a project but is refused by policy gets the
    // server's own words: inventing a second explanation here would drift from
    // the rule that actually blocked it.
    const answer = await dialog.showMessageBox({
      type: "warning",
      title: t("invalid.title"),
      message: t("invalid.title"),
      detail: rejection.reason === "" ? t("invalid.body") : `${rejection.reason}\n\n${dir}`,
      buttons: [t("invalid.retry"), t("invalid.quit")],
      defaultId: 0,
      cancelId: 1
    });
    if (answer.response !== 0) return null;
  }
}

function openOptions(t: Translator): Electron.OpenDialogOptions {
  return {
    title: t("picker.title"),
    buttonLabel: t("picker.button"),
    properties: ["openDirectory", "createDirectory"]
  };
}

/**
 * The MCP connection panel (023 R5). A dialog rather than a second window: it
 * needs no HTML, no preload and no origin of its own, which keeps the app's
 * only renderer the one pointed at the local server.
 */
export async function showConnectionInfo(t: Translator, server: SddHttpServer): Promise<void> {
  const config = JSON.stringify({ mcpServers: { sdd: { url: server.mcpUrl } } }, null, 2);

  const answer = await dialog.showMessageBox({
    type: "info",
    title: t("connection.title"),
    message: t("connection.title"),
    detail: `${t("connection.body")}\n\n${server.mcpUrl}\n\n${server.projectRoot}`,
    buttons: [t("connection.copyUrl"), t("connection.copyConfig"), t("connection.close")],
    defaultId: 0,
    cancelId: 2
  });

  if (answer.response === 0) clipboard.writeText(server.mcpUrl);
  if (answer.response === 1) clipboard.writeText(config);
}

export function showStartupFailure(t: Translator, error: unknown): void {
  dialog.showErrorBox(t("startup.failed.title"), error instanceof Error ? error.message : String(error));
}
