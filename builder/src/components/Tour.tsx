// Welcome tour (spec 007, R3): five anchored steps with a homemade overlay —
// a highlight ring around the target (data-tour attributes) plus a tooltip
// card. No dependency; dismissable and re-launchable from the "?" button.

import { useCallback, useEffect, useState } from "react";
import { useBuilderStore } from "../store";

interface TourStep {
  target: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: "palette",
    title: "1 · La paleta / The palette",
    body:
      "Arrastra 💡 Idea, 📦 Épica o 📋 Spec desde aquí al lienzo (o haz clic). / " +
      "Drag 💡 Idea, 📦 Epic or 📋 Spec from here onto the canvas (or click)."
  },
  {
    target: "palette-spec",
    title: "2 · Crear una spec / Create a spec",
    body:
      "La tarjeta 📋 Spec crea una carpeta real specs/NNN-… con spec, plan y tareas — sin tocar la terminal. / " +
      "The 📋 Spec card creates a real specs/NNN-… folder with spec, plan and tasks — no terminal needed."
  },
  {
    target: "canvas",
    title: "3 · Conectar tarjetas / Connect cards",
    body:
      "Arrastra desde el punto derecho de una tarjeta hasta otra para unirlas; doble clic en la línea para etiquetarla. / " +
      "Drag from a card's right handle to another card to connect them; double-click the line to label it."
  },
  {
    target: "canvas",
    title: "4 · Tareas y editor / Tasks and editor",
    body:
      "Haz clic en una tarjeta de spec para abrir el panel: marca tareas y usa la pestaña Editar para escribir la spec guiada. / " +
      "Click a spec card to open the drawer: tick tasks and use the Edit tab to write the spec with guidance."
  },
  {
    target: "gate",
    title: "5 · El gate / The gate",
    body:
      "El semáforo del gate te dice si puedes implementar: 🟢 abierto, 🔴 cerrado. Pulsa «Validar ahora» para comprobarlo. / " +
      "The gate semaphore tells you whether you can implement: 🟢 open, 🔴 closed. Press “Validate now” to check."
  }
];

const RING_PADDING = 6;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function targetRect(target: string): Rect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

export function Tour() {
  const closeTour = useBuilderStore((s) => s.closeTour);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  const current = STEPS[step];

  const measure = useCallback(() => {
    setRect(targetRect(current.target));
  }, [current.target]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeTour(dontShowAgain);
      if (e.key === "ArrowRight" && step < STEPS.length - 1) setStep(step + 1);
      if (e.key === "ArrowLeft" && step > 0) setStep(step - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeTour, dontShowAgain, step]);

  const isLast = step === STEPS.length - 1;

  // Tooltip placement: to the right of narrow targets, below wide ones,
  // clamped to the viewport.
  const cardStyle: React.CSSProperties = {};
  if (rect) {
    const preferRight = rect.width < 420 && rect.left + rect.width + 340 < window.innerWidth;
    if (preferRight) {
      cardStyle.left = rect.left + rect.width + 18;
      cardStyle.top = Math.min(Math.max(12, rect.top), window.innerHeight - 240);
    } else {
      cardStyle.left = Math.min(Math.max(12, rect.left + rect.width / 2 - 160), window.innerWidth - 340);
      const below = rect.top + rect.height + 16;
      cardStyle.top = below + 220 < window.innerHeight ? below : Math.max(12, rect.top - 236);
    }
  } else {
    cardStyle.left = "50%";
    cardStyle.top = "40%";
    cardStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <div className="tour-layer" role="dialog" aria-label="Tour de bienvenida / Welcome tour">
      {rect ? (
        <div
          className="tour-ring"
          style={{
            top: rect.top - RING_PADDING,
            left: rect.left - RING_PADDING,
            width: rect.width + RING_PADDING * 2,
            height: rect.height + RING_PADDING * 2
          }}
        />
      ) : (
        <div className="tour-backdrop" />
      )}
      <div className="tour-card" style={cardStyle}>
        <header className="tour-card-head">
          <strong>{current.title}</strong>
          <button
            className="icon-btn"
            onClick={() => closeTour(dontShowAgain)}
            aria-label="Cerrar el tour / Close the tour"
          >
            ✕
          </button>
        </header>
        <p>{current.body}</p>
        <div className="tour-dots" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={`${s.target}-${i}`} className={`tour-dot${i === step ? " active" : ""}`} />
          ))}
        </div>
        <label className="tour-dontshow">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          No mostrar de nuevo / Don't show again
        </label>
        <div className="tour-actions">
          <button className="btn small" onClick={() => setStep(step - 1)} disabled={step === 0}>
            ← Atrás / Back
          </button>
          {isLast ? (
            <button className="btn small primary" onClick={() => closeTour(dontShowAgain)}>
              Terminar / Finish
            </button>
          ) : (
            <button className="btn small primary" onClick={() => setStep(step + 1)}>
              Siguiente / Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
