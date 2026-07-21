// Template gallery modal (spec 007, R4): four ready-made playbooks that
// create real specs (POST /api/spec each) plus a tidy pre-laid-out canvas.
// Only allowed on a workspace with zero specs; otherwise a warning is shown.

import { useEffect, useState } from "react";
import { errorMessage } from "../api";
import { useBuilderStore } from "../store";
import { BOARD_TEMPLATES, type BoardTemplate } from "../templates";

export function TemplateGallery() {
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const applyTemplate = useBuilderStore((s) => s.applyTemplate);
  const hasSpecs = useBuilderStore((s) => Object.keys(s.specs).length > 0);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!busyId) setGalleryOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busyId]);

  const apply = async (template: BoardTemplate) => {
    if (busyId) return;
    setBusyId(template.id);
    setError(null);
    try {
      await applyTemplate(template);
      setGalleryOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={close} role="presentation">
      <div
        className="modal wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Galería de plantillas / Template gallery"
      >
        <h2>🧩 Plantillas / Templates</h2>
        <p className="modal-note">
          Cada plantilla crea specs reales (<code>specs/NNN-…</code>) y un tablero conectado. / Each
          template creates real specs (<code>specs/NNN-…</code>) and a connected board.
        </p>
        {hasSpecs ? (
          <p className="modal-error">
            ⚠ Este workspace ya tiene specs; las plantillas solo se aplican en un workspace vacío. /
            This workspace already has specs; templates only apply to an empty workspace.
          </p>
        ) : null}
        {error ? <p className="modal-error">⚠ {error}</p> : null}
        <div className="template-grid">
          {BOARD_TEMPLATES.map((template) => (
            <article key={template.id} className="template-card">
              <p className="template-emoji" aria-hidden>
                {template.emoji}
              </p>
              <h3>{template.name}</h3>
              <p className="template-desc">{template.description}</p>
              <p className="template-meta">
                {template.specs.length} specs · {template.epics.length}{" "}
                {template.epics.length === 1 ? "épica / epic" : "épicas / epics"}
              </p>
              <button
                className="btn primary small"
                disabled={hasSpecs || busyId !== null}
                onClick={() => void apply(template)}
              >
                {busyId === template.id ? "Aplicando… / Applying…" : "Usar / Use"}
              </button>
            </article>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={close} disabled={busyId !== null}>
            Cerrar / Close
          </button>
        </div>
      </div>
    </div>
  );
}
