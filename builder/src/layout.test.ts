// Spec 036, T2 (R3). La geometría de "añadir sin pisar" se prueba sola,
// fuera del store: hoy vive dentro de una función que además hace red, y por
// eso no tenía prueba posible.

import { describe, expect, it } from "vitest";
import { appendOffset, boundingBox, intersectionArea, translate, type Box } from "./layout";

const box = (x: number, y: number, width = 100, height = 50): Box => ({ x, y, width, height });

describe("boundingBox", () => {
  it("returns null for nothing", () => {
    expect(boundingBox([])).toBeNull();
  });

  it("wraps every box, including negative coordinates", () => {
    expect(boundingBox([box(-40, -20), box(60, 100)])).toEqual({
      x: -40,
      y: -20,
      width: 200, // -40 .. 160
      height: 170 // -20 .. 150
    });
  });
});

describe("intersectionArea", () => {
  it("is 0 for boxes that only touch", () => {
    expect(intersectionArea(box(0, 0), box(100, 0))).toBe(0);
    expect(intersectionArea(box(0, 0), box(0, 50))).toBe(0);
  });

  it("measures the overlap when they cross", () => {
    expect(intersectionArea(box(0, 0), box(90, 40))).toBe(10 * 10);
  });
});

describe("appendOffset", () => {
  it("does not move anything when there is nothing to avoid", () => {
    expect(appendOffset([], [box(0, 0)], 80)).toEqual({ dx: 0, dy: 0 });
    expect(appendOffset([box(0, 0)], [], 80)).toEqual({ dx: 0, dy: 0 });
  });

  it("drops the incoming block below the existing one, left edges aligned", () => {
    const existing = [box(-100, -50, 300, 180)];
    const incoming = [box(0, 0, 260, 120)];
    expect(appendOffset(existing, incoming, 80)).toEqual({ dx: -100, dy: 210 });
  });

  it("R3: no incoming box intersects any existing box after the offset", () => {
    const existing = [box(-554, -272, 300, 136), box(-540, -487, 260, 120), box(120, 40, 300, 180)];
    const incoming = [box(40, -220, 260, 120), box(0, 220, 300, 180), box(340, 220, 300, 180)];

    const { dx, dy } = appendOffset(existing, incoming, 80);
    const moved = incoming.map((b) => translate(b, dx, dy));

    for (const a of existing) {
      for (const b of moved) {
        expect(intersectionArea(a, b)).toBe(0);
      }
    }
  });
});
