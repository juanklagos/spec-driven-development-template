import { useBuilderStore } from "../store";
import type { LiveStatus, SaveState } from "../types";

const SAVE_LABELS: Record<SaveState, string> = {
  saved: "Guardado / Saved",
  dirty: "Sin guardar / Unsaved",
  saving: "Guardando… / Saving…",
  error: "Error al guardar / Save error"
};

const LIVE_LABELS: Record<LiveStatus, string> = {
  on: "🟢 En vivo / Live",
  off: "🌗 Sin conexión en vivo / Live off"
};

const LIVE_TITLES: Record<LiveStatus, string> = {
  on: "Los cambios en disco se reflejan solos / Disk changes sync automatically",
  off: "Reconectando con /api/events… / Reconnecting to /api/events…"
};

export function TopBar() {
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const saveState = useBuilderStore((s) => s.saveState);
  const saveError = useBuilderStore((s) => s.saveError);
  const liveStatus = useBuilderStore((s) => s.liveStatus);
  const flushSave = useBuilderStore((s) => s.flushSave);

  return (
    <header className="topbar">
      <h1>🌱 SDD Builder</h1>
      {projectRoot ? (
        // The path is truncated by CSS; the title shows the full workspace.
        <code className="workspace" title={`Workspace: ${projectRoot}`}>
          {projectRoot}
        </code>
      ) : null}
      <div className="topbar-right">
        <span className={`live-indicator ${liveStatus}`} title={LIVE_TITLES[liveStatus]}>
          {LIVE_LABELS[liveStatus]}
        </span>
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
