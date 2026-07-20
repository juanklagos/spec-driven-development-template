import { useBuilderStore } from "../store";
import type { SaveState } from "../types";

const SAVE_LABELS: Record<SaveState, string> = {
  saved: "Guardado / Saved",
  dirty: "Sin guardar / Unsaved",
  saving: "Guardando… / Saving…",
  error: "Error al guardar / Save error"
};

export function TopBar() {
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const saveState = useBuilderStore((s) => s.saveState);
  const saveError = useBuilderStore((s) => s.saveError);
  const flushSave = useBuilderStore((s) => s.flushSave);

  return (
    <header className="topbar">
      <h1>🌱 SDD Builder</h1>
      {projectRoot ? (
        <code className="workspace" title={projectRoot}>
          {projectRoot}
        </code>
      ) : null}
      <div className="topbar-right">
        <span className={`save-indicator ${saveState}`} title={saveError ?? SAVE_LABELS[saveState]}>
          <span className="save-dot" aria-hidden />
          {SAVE_LABELS[saveState]}
        </span>
        <button className="btn" onClick={() => void flushSave()}>
          Guardar / Save
        </button>
        <a className="btn ghost" href="/dashboard">
          Dashboard
        </a>
      </div>
    </header>
  );
}
