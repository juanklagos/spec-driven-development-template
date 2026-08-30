// @vitest-environment jsdom
//
// Spec 042 (R6), fase 5. La regla que decide si una tecla puede crear un nodo.

import { beforeEach, describe, expect, it } from "vitest";

import { shortcutsBlocked } from "./shortcuts";

function mount(html: string): void {
  document.body.innerHTML = html;
}

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("shortcutsBlocked", () => {
  it("deja pasar la tecla en un lienzo sin diálogos", () => {
    expect(shortcutsBlocked(document)).toBe(false);
  });

  it("bloquea con un modal de Radix abierto, aunque no tenga ningún campo de texto", () => {
    // Es el caso real de «Conectar un agente» e «Implementar»: el foco se queda
    // en un botón, así que el guardia de INPUT/TEXTAREA no salvaba nada.
    mount('<div role="dialog"><button>Cerrar</button></div>');
    const boton = document.querySelector("button");
    expect(shortcutsBlocked(document, boton)).toBe(true);
  });

  it("bloquea durante el tour, que es un diálogo hecho a mano y sin gestión de foco", () => {
    // Tour.tsx no usa Radix: el foco se queda en document.body, de modo que una
    // guardia basada en el ancestro del elemento enfocado no lo detectaría.
    mount('<div class="tour-layer" role="dialog" aria-modal="true">Paso 1 de 5</div>');
    expect(shortcutsBlocked(document, document.body)).toBe(true);
  });

  it("NO bloquea con el cajón de la spec abierto, que es un panel y no un modal", () => {
    mount('<div role="dialog" data-shortcuts="allow">Detalle de la spec</div>');
    expect(shortcutsBlocked(document)).toBe(false);
  });

  it("bloquea si hay un modal abierto aunque el cajón también lo esté", () => {
    mount(
      '<div role="dialog" data-shortcuts="allow">Detalle</div><div role="dialog">Implementar</div>'
    );
    expect(shortcutsBlocked(document)).toBe(true);
  });

  it("bloquea mientras se escribe, aunque no haya ningún diálogo", () => {
    mount('<input id="campo" />');
    expect(shortcutsBlocked(document, document.getElementById("campo"))).toBe(true);
  });

  it("un diálogo nuevo que olvide declararse bloquea: el fallo por defecto es el seguro", () => {
    mount('<div role="dialog" data-algo="otra-cosa">Modal futuro</div>');
    expect(shortcutsBlocked(document)).toBe(true);
  });
});
