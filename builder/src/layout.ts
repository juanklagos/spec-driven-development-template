// Spec 036 (R3) — geometría del lienzo, pura y sin red.
//
// Vivía dentro de `applyBoardPlan`, mezclada con las llamadas a la API, y por
// eso no se podía probar. Separarla es lo que permite afirmar "ninguna caja
// nueva pisa una existente" con una prueba en vez de con una promesa.

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Caja que envuelve a todas. `null` cuando no hay ninguna. */
export function boundingBox(boxes: readonly Box[]): Box | null {
  if (boxes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const b of boxes) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width);
    maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Área solapada en px². Tocarse por el borde da 0, que es lo que queremos. */
export function intersectionArea(a: Box, b: Box): number {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

export function translate<T extends Box>(box: T, dx: number, dy: number): T {
  return { ...box, x: box.x + dx, y: box.y + dy };
}

/**
 * Desplazamiento que deja el bloque entrante ENTERO por debajo del existente,
 * con `gap` de aire y los bordes izquierdos alineados. Basta con separar en un
 * eje para garantizar intersección 0 en todos los pares (R3).
 */
export function appendOffset(
  existing: readonly Box[],
  incoming: readonly Box[],
  gap: number
): { dx: number; dy: number } {
  const from = boundingBox(existing);
  const to = boundingBox(incoming);
  if (!from || !to) return { dx: 0, dy: 0 };
  return { dx: from.x - to.x, dy: from.y + from.height + gap - to.y };
}
