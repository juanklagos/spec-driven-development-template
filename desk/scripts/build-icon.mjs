#!/usr/bin/env node
// Rasterises build/icon.svg into the PNG every packager and platform wants.
//
// Spec 023 R8. electron-builder derives .icns and .ico from a single 1024px
// PNG, and the Linux build wants loose PNGs by size, so one deterministic
// render is all this needs to produce.
//
// It renders with Electron rather than a native tool on purpose. `qlmanage`
// exists on this machine and would have saved a dependency, but it is macOS
// only, it decides its own output size, and it produces a Quick Look preview
// rather than a guaranteed pixel grid — an icon pipeline that silently changes
// resolution between machines is the kind of thing nobody notices until a
// blurry Dock icon ships. Electron is already a dependency here, it is the same
// renderer that will draw the app, and `setSize` + `capturePage` are exact.
//
// Rasteriza build/icon.svg al PNG que necesitan los empaquetadores. Usa Electron
// porque es exacto y reproducible, no la herramienta nativa de un solo sistema.
//
// Usage / Uso:
//   npx electron desk/scripts/build-icon.mjs
//   npm run icon     (from desk/)

import { app, BrowserWindow } from "electron";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESK_ROOT = path.resolve(HERE, "..");
const SOURCE = path.join(DESK_ROOT, "build", "icon.svg");
const OUT_DIR = path.join(DESK_ROOT, "build");
const ICONS_DIR = path.join(OUT_DIR, "icons");

/** The master size electron-builder downsamples .icns and .ico from. */
const MASTER = 1024;

/** Loose PNGs for the Linux targets, which take a directory of sizes. */
const LINUX_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

// Electron swallows this process's stdout on macOS when it is not attached to a
// terminal it owns, which turns a silent failure into an invisible one. stderr
// survives, so every message this script emits goes there.
const log = (message) => process.stderr.write(`${message}\n`);

/**
 * `toPNG()` returns an empty buffer rather than throwing when an image cannot
 * be encoded, and `writeFile` truncates before it writes — so an unchecked
 * encode leaves a 0-byte icon that every later step happily accepts.
 */
async function writePng(filePath, image, label) {
  const png = image.toPNG();
  if (png.length === 0) throw new Error(`${label}: PNG encoding produced 0 bytes`);
  await fs.writeFile(filePath, png);
  return png.length;
}

/**
 * Render the SVG and hand the image to `use` while the window is still alive.
 *
 * The lifetime matters and is not obvious: the image `capturePage` returns is
 * backed by the window's own resources, so `resize()` on it after
 * `window.destroy()` takes the whole process down — no exception, no stderr,
 * exit code 0, and a half-written file on disk. Passing a callback makes the
 * window outlive every use of the image by construction, instead of by the next
 * editor remembering to keep two statements in order.
 */
async function withRender(svg, use) {
  const window = new BrowserWindow({
    width: MASTER,
    height: MASTER,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: { offscreen: true, contextIsolation: true, nodeIntegration: false }
  });

  // A data: URL keeps the render self-contained — no temp file, and no chance
  // of picking up a stale one from a previous run.
  const page = `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:transparent}
  svg{display:block;width:${MASTER}px;height:${MASTER}px}
</style>
${svg}`;
  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(page)}`);

    // capturePage can return the frame before the first paint settles; one more
    // turn of the event loop is cheaper than shipping a blank icon.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const image = await window.webContents.capturePage();
    if (image.isEmpty()) throw new Error("capturePage returned an empty image");

    return await use(image);
  } finally {
    window.destroy();
  }
}

async function main() {
  const svg = await fs.readFile(SOURCE, "utf8");

  await withRender(svg, async (master) => {
    // capturePage returns DEVICE pixels, so a Retina machine renders 2048 for a
    // 1024 CSS window and a 1x machine renders 1024. Normalising here is what
    // keeps the committed icon identical no matter whose laptop regenerated it.
    // Upsampling would not be, so a capture smaller than the master is a failure
    // rather than something to quietly stretch.
    const { width, height } = master.getSize();
    if (width !== height) throw new Error(`expected a square render, got ${width}x${height}`);
    if (width < MASTER) throw new Error(`render was ${width}px, smaller than the ${MASTER}px master`);

    const normalized =
      width === MASTER ? master : master.resize({ width: MASTER, height: MASTER, quality: "best" });

    await fs.mkdir(ICONS_DIR, { recursive: true });
    const masterBytes = await writePng(path.join(OUT_DIR, "icon.png"), normalized, "icon.png");

    for (const size of LINUX_SIZES) {
      const resized = normalized.resize({ width: size, height: size, quality: "best" });
      await writePng(path.join(ICONS_DIR, `${size}x${size}.png`), resized, `icons/${size}x${size}.png`);
    }

    log(`captured   ${width}x${height} device px`);
    log(`icon.png   ${MASTER}x${MASTER}, ${masterBytes} bytes`);
    log(`icons/     ${LINUX_SIZES.join(", ")}`);
  });
}

app.whenReady().then(async () => {
  try {
    await main();
    app.exit(0);
  } catch (error) {
    log(error instanceof Error ? (error.stack ?? error.message) : String(error));
    app.exit(1);
  }
});
