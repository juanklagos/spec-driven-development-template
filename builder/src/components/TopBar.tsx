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
  const depWarnings = gate?.dependencyWarnings ?? [];

  return (
    <span className="gate-group" data-tour="gate">
      <span className={`gate-chip ${tone}`} title={title}>
        {label}
      </span>
      {depWarnings.length > 0 ? (
        // Advisory amber (spec 009, R2): typed edges where an approved spec
        // depends on a not-approved one. Never closes the gate.
        <span
          className="gate-chip warn"
          title={
            "Dependencias sin aprobar / Unapproved dependencies:\n" +
            depWarnings.map((w) => `• ${w.message}`).join("\n")
          }
        >
          ⚠ {depWarnings.length} dep
        </span>
      ) : null}
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

/** Canvas ↔ kanban toggle (spec 009, R1). Same data, two projections. */
function ViewToggle() {
  const viewMode = useBuilderStore((s) => s.viewMode);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  return (
    <span className="view-toggle" role="group" aria-label="Vista / View">
      <button
        className={`view-btn${viewMode === "canvas" ? " active" : ""}`}
        onClick={() => setViewMode("canvas")}
        aria-pressed={viewMode === "canvas"}
      >
        🗺️ Lienzo / Canvas
      </button>
      <button
        className={`view-btn${viewMode === "board" ? " active" : ""}`}
        onClick={() => setViewMode("board")}
        aria-pressed={viewMode === "board"}
      >
        📋 Tablero / Board
      </button>
    </span>
  );
}

/** 👥 N when more than one SSE client is on this workspace (spec 009, R4). */
function PresenceChip() {
  const liveStatus = useBuilderStore((s) => s.liveStatus);
  const count = useBuilderStore((s) => s.presenceCount);
  if (liveStatus !== "on" || count < 2) return null;
  return (
    <span
      className="presence-chip"
      title={`${count} personas viendo este workspace / ${count} people viewing this workspace`}
    >
      👥 {count}
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
        <ViewToggle />
        <span className="topbar-sep" aria-hidden />
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
        <PresenceChip />
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
