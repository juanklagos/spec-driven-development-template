// Where the app's own files live, resolved once.
//
// Compiled code runs from dist/main/, so every asset path is relative to the
// build output rather than to the source tree — a distinction that is invisible
// while editing and obvious the first time an icon silently fails to load.
//
// `build/` sits outside `dist/` on purpose: it is packaging input, read by
// electron-builder to produce the .icns and .ico, and read here for the runtime
// window and Dock icon during development.

import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** dist/main -> desk/ */
const DESK_ROOT = path.resolve(HERE, "..", "..");

const ICON_PNG = path.join(DESK_ROOT, "build", "icon.png");

/**
 * The 1024px master, or null when it has not been generated yet.
 *
 * Null rather than a throw: a missing icon is a cosmetic problem in
 * development, and refusing to start the app over it would be a worse trade
 * than launching with Electron's default icon. `npm run icon` regenerates it.
 */
export function appIconPath(): string | null {
  return existsSync(ICON_PNG) ? ICON_PNG : null;
}
