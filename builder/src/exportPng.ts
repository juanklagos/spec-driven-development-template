// Export the board to a PNG (spec 007, R6). Follows the documented React
// Flow pattern: render the .react-flow__viewport element through
// html-to-image with a transform that frames every node.
// https://reactflow.dev/examples/misc/download-image

import { getNodesBounds, getViewportForBounds } from "@xyflow/react";
import { toPng } from "html-to-image";
import type { AppNode } from "./types";

const MIN_SIZE = 480;
const MAX_SIZE = 3072;
const PADDING = 0.08;

export async function exportBoardPng(nodes: AppNode[]): Promise<void> {
  if (nodes.length === 0) {
    throw new Error("Nada que exportar: el lienzo está vacío / Nothing to export: the canvas is empty");
  }
  const viewportEl = document.querySelector<HTMLElement>(".react-flow__viewport");
  if (!viewportEl) {
    throw new Error("No se encontró el lienzo / Could not find the canvas");
  }

  const bounds = getNodesBounds(nodes);
  const width = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(bounds.width) + 160));
  const height = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(bounds.height) + 160));
  const viewport = getViewportForBounds(bounds, width, height, 0.2, 2, PADDING);
  // Match the current theme so dark boards export on a dark background.
  const backgroundColor = getComputedStyle(document.body).backgroundColor;

  const dataUrl = await toPng(viewportEl, {
    backgroundColor,
    width,
    height,
    style: {
      width: `${width}px`,
      height: `${height}px`,
      transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
    }
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `sdd-board-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
}
