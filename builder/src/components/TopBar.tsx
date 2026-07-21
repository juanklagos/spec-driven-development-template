import { useState } from "react";
import { errorMessage } from "../api";
import { exportBoardPng } from "../exportPng";
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

function GateChip() {
  const gate = useBuilderStore((s) => s.gate);
  const gateBusy = useBuilderStore((s) => s.gateBusy);
  const gateError = useBuilderStore((s) => s.gateError);
  const refreshGate = useBuilderStore((s) => s.refreshGate);

  const tone = gate == null ? "unknown" : gate.ok ? "open" : "closed";
  const label =
    gate == null
      ? "⚪ Gate…"
      : gate.ok
        ? "🟢 Gate abierto / Gate open"
        : "🔴 Gate cerrado / Gate closed";
  const title = gateError
    ? `⚠ ${gateError}`
    : gate == null
      ? "Comprobando el gate… / Checking the gate…"
      : `${gate.errors} errores/errors · ${gate.warnings} avisos/warnings · ` +
        `${gate.approvedSpecs}/${gate.totalSpecs} specs aprobadas/approved`;

  return (
    <span className="gate-group" data-tour="gate">
      <span className={`gate-chip ${tone}`} title={title}>
        {label}
      </span>
      <button
        className="btn small"
        onClick={() => void refreshGate()}
        disabled={gateBusy}
        title="Ejecuta la validación real del proyecto / Runs the real project validation"
      >
        {gateBusy ? "Validando… / Validating…" : "Validar ahora / Validate now"}
      </button>
    </span>
  );
}

function HistoryButtons() {
  const canUndo = useBuilderStore((s) => s.past.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  return (
    <>
      <button
        className="icon-btn"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Deshacer / Undo"
        title="Deshacer (⌘Z / Ctrl+Z) / Undo"
      >
        ↶
      </button>
      <button
        className="icon-btn"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Rehacer / Redo"
        title="Rehacer (⇧⌘Z / Ctrl+Shift+Z) / Redo"
      >
        ↷
      </button>
    </>
  );
}

function ExportPngButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await exportBoardPng(useBuilderStore.getState().nodes);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      className="btn"
      onClick={() => void handleExport()}
      disabled={busy}
      title={error ?? "Exporta el tablero como imagen / Exports the board as an image"}
    >
      📷 {busy ? "Exportando… / Exporting…" : error ? "⚠ PNG" : "PNG"}
    </button>
  );
}

export function TopBar() {
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const saveState = useBuilderStore((s) => s.saveState);
  const saveError = useBuilderStore((s) => s.saveError);
  const liveStatus = useBuilderStore((s) => s.liveStatus);
  const flushSave = useBuilderStore((s) => s.flushSave);
  const openTour = useBuilderStore((s) => s.openTour);
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);

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
        <GateChip />
        <span className="topbar-sep" aria-hidden />
        <HistoryButtons />
        <ExportPngButton />
        <button
          className="btn"
          onClick={() => setAssistantOpen(true)}
          title="Describe tu proyecto y genera un borrador de board / Describe your project and generate a draft board"
        >
          ✨ Asistente / Assistant
        </button>
        <button className="btn" onClick={() => setGalleryOpen(true)}>
          🧩 Plantillas / Templates
        </button>
        <button
          className="icon-btn"
          onClick={openTour}
          aria-label="Ver el tour de bienvenida / Show the welcome tour"
          title="Tour de bienvenida / Welcome tour"
        >
          ?
        </button>
        <span className="topbar-sep" aria-hidden />
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
