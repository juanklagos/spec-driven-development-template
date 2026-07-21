import { useState } from "react";
import { CircleHelp, Redo2, Undo2 } from "lucide-react";
import { errorMessage } from "../api";
import { exportBoardPng } from "../exportPng";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { HelpHint } from "./HelpHint";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { SaveState } from "../types";

const SAVE_KEYS: Record<SaveState, string> = {
  saved: "topbar.save.saved",
  dirty: "topbar.save.dirty",
  saving: "topbar.save.saving",
  error: "topbar.save.error"
};

function GateChip() {
  const { t } = useT();
  const gate = useBuilderStore((s) => s.gate);
  const gateBusy = useBuilderStore((s) => s.gateBusy);
  const gateError = useBuilderStore((s) => s.gateError);
  const refreshGate = useBuilderStore((s) => s.refreshGate);

  // Three states, not two. `ok` alone called a workspace with zero approved
  // specs "open", and the chip told the user implementation was allowed.
  const TONE: Record<string, string> = {
    open: "border-primary bg-[var(--primary-soft)] text-primary",
    closed: "border-border bg-[var(--muted)] text-muted-foreground",
    blocked: "border-destructive bg-[var(--danger-soft)] text-destructive"
  };
  const ICON: Record<string, string> = { open: "🟢", closed: "🟡", blocked: "🔴" };
  const KEY: Record<string, string> = {
    open: "topbar.gate.open",
    closed: "topbar.gate.closed",
    blocked: "topbar.gate.blocked"
  };
  const verdict = gate?.verdict ?? (gate == null ? null : gate.ok ? "open" : "blocked");
  const tone = verdict == null ? "border-border text-muted-foreground" : TONE[verdict];
  const label =
    verdict == null ? `⚪ ${t("topbar.gate.loading")}` : `${ICON[verdict]} ${t(KEY[verdict])}`;
  const title = gateError
    ? `⚠ ${gateError}`
    : gate == null
      ? t("topbar.gate.checking")
      : t("topbar.gate.stats", {
          errors: gate.errors,
          warnings: gate.warnings,
          approved: gate.approvedSpecs,
          total: gate.totalSpecs
        });
  const depWarnings = gate?.dependencyWarnings ?? [];

  // Educational gate state (teaching layer): a red chip alone teaches nothing.
  // When the gate is closed the hint says *why* the rule exists and what is
  // missing right now, derived from the same summary the chip renders.
  const missing: string[] = [];
  if (gate && !gate.ok) {
    if (gate.errors > 0) missing.push(t("help.gate.missing.errors", { n: gate.errors }));
    const notApproved = gate.totalSpecs - gate.approvedSpecs;
    if (notApproved > 0) missing.push(t("help.gate.missing.pending", { n: notApproved }));
    if (missing.length === 0) missing.push(t("help.gate.missing.unknown"));
  }
  const gateExtra = gate ? (
    <div className="mt-2 rounded-md border bg-muted/50 px-2.5 py-2">
      <p className="m-0 text-xs leading-relaxed font-semibold">
        {gate.ok ? `🟢 ${t("help.gate.openLead")}` : `🔴 ${t("help.gate.closedLead")}`}
      </p>
      {missing.length > 0 ? (
        <ul className="m-0 mt-1.5 flex list-none flex-col gap-1 p-0 text-xs text-muted-foreground">
          {missing.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  ) : undefined;

  return (
    <span className="inline-flex items-center gap-2" data-tour="gate">
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${tone}`}
        title={title}
      >
        {label}
      </span>
      <HelpHint topic="gate" guide="flow" extra={gateExtra} />
      {depWarnings.length > 0 ? (
        // Advisory amber (spec 009, R2): typed edges where an approved spec
        // depends on a not-approved one. Never closes the gate.
        <span
          className="inline-flex cursor-help items-center gap-1 rounded-full border border-[var(--amber)] bg-[var(--amber-soft)] px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-[var(--amber)]"
          title={`${t("topbar.gate.depTitle")}\n${depWarnings.map((w) => `• ${w.message}`).join("\n")}`}
        >
          ⚠ {depWarnings.length} dep
        </span>
      ) : null}
      {depWarnings.length > 0 ? <HelpHint topic="dep" guide="builder" /> : null}
      <Button
        size="sm"
        variant="outline"
        onClick={() => void refreshGate()}
        disabled={gateBusy}
        title={t("topbar.gate.validateTitle")}
      >
        {gateBusy ? t("topbar.gate.validating") : t("topbar.gate.validate")}
      </Button>
    </span>
  );
}

/** Canvas ↔ kanban toggle (spec 009, R1). Same data, two projections. */
function ViewToggle() {
  const { t } = useT();
  const viewMode = useBuilderStore((s) => s.viewMode);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  const base =
    "px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer";
  return (
    <span
      className="inline-flex overflow-hidden rounded-md border"
      role="group"
      aria-label={t("topbar.view.label")}
    >
      <button
        className={`${base} ${viewMode === "canvas" ? "bg-[var(--primary-soft)] text-primary" : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        onClick={() => setViewMode("canvas")}
        aria-pressed={viewMode === "canvas"}
      >
        🗺️ {t("topbar.view.canvas")}
      </button>
      <button
        className={`${base} border-l ${viewMode === "board" ? "bg-[var(--primary-soft)] text-primary" : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"}`}
        onClick={() => setViewMode("board")}
        aria-pressed={viewMode === "board"}
      >
        📋 {t("topbar.view.board")}
      </button>
    </span>
  );
}

/** ES/EN switcher (spec 010, R1): persisted, one language at a time. */
function LangSwitcher() {
  const { t, lang, setLang } = useT();
  const base = "px-2 py-1 text-xs font-bold uppercase transition-colors cursor-pointer";
  return (
    <span
      className="inline-flex overflow-hidden rounded-md border"
      role="group"
      aria-label={t("topbar.lang")}
    >
      {(["es", "en"] as const).map((code, i) => (
        <button
          key={code}
          className={`${base} ${i > 0 ? "border-l" : ""} ${
            lang === code
              ? "bg-[var(--primary-soft)] text-primary"
              : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
        >
          {code}
        </button>
      ))}
    </span>
  );
}

/** 👥 N when more than one SSE client is on this workspace (spec 009, R4). */
function PresenceChip() {
  const { t } = useT();
  const liveStatus = useBuilderStore((s) => s.liveStatus);
  const count = useBuilderStore((s) => s.presenceCount);
  if (liveStatus !== "on" || count < 2) return null;
  return (
    <span
      className="inline-flex cursor-help items-center gap-1 rounded-full border border-primary bg-[var(--primary-soft)] px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-primary"
      title={t("topbar.presence.title", { n: count })}
    >
      👥 {count}
    </span>
  );
}

function HistoryButtons() {
  const { t } = useT();
  const canUndo = useBuilderStore((s) => s.past.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={undo}
        disabled={!canUndo}
        aria-label={t("topbar.undo")}
        title={t("topbar.undo.title")}
      >
        <Undo2 />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        onClick={redo}
        disabled={!canRedo}
        aria-label={t("topbar.redo")}
        title={t("topbar.redo.title")}
      >
        <Redo2 />
      </Button>
    </>
  );
}

function ExportPngButton() {
  const { t } = useT();
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
    <Button
      variant="outline"
      onClick={() => void handleExport()}
      disabled={busy}
      title={error ?? t("topbar.png.title")}
    >
      📷 {busy ? t("topbar.png.exporting") : error ? "⚠ PNG" : t("topbar.png")}
    </Button>
  );
}

export function TopBar() {
  const { t } = useT();
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const saveState = useBuilderStore((s) => s.saveState);
  const saveError = useBuilderStore((s) => s.saveError);
  const liveStatus = useBuilderStore((s) => s.liveStatus);
  const flushSave = useBuilderStore((s) => s.flushSave);
  const openTour = useBuilderStore((s) => s.openTour);
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);

  const saveDot =
    saveState === "error"
      ? "bg-destructive"
      : saveState === "saved"
        ? "bg-primary"
        : "bg-[var(--amber)]";

  return (
    <header className="z-20 flex items-center gap-3.5 border-b bg-card px-4 py-2">
      <h1 className="m-0 text-base font-bold whitespace-nowrap">🌱 SDD Builder</h1>
      {projectRoot ? (
        // The path is truncated by CSS; the title shows the full workspace.
        <code className="workspace" title={`${t("topbar.workspace")}: ${projectRoot}`}>
          {projectRoot}
        </code>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center justify-end gap-2.5">
        <ViewToggle />
        <Separator orientation="vertical" className="!h-5" />
        <GateChip />
        <Separator orientation="vertical" className="!h-5" />
        <HistoryButtons />
        <ExportPngButton />
        <Button variant="outline" onClick={() => setAssistantOpen(true)} title={t("topbar.assistant.title")}>
          ✨ {t("topbar.assistant")}
        </Button>
        <Button variant="outline" onClick={() => setGalleryOpen(true)}>
          🧩 {t("topbar.templates")}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" onClick={openTour} aria-label={t("topbar.tour")}>
              <CircleHelp />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("topbar.tour.title")}</TooltipContent>
        </Tooltip>
        <Separator orientation="vertical" className="!h-5" />
        <PresenceChip />
        <span
          className={`text-xs whitespace-nowrap ${liveStatus === "on" ? "text-primary" : "text-muted-foreground"}`}
          title={liveStatus === "on" ? t("topbar.live.title.on") : t("topbar.live.title.off")}
        >
          {liveStatus === "on" ? "🟢" : "🌗"} {liveStatus === "on" ? t("topbar.live.on") : t("topbar.live.off")}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-muted-foreground"
          title={saveError ?? t(SAVE_KEYS[saveState])}
        >
          <span
            className={`inline-block size-2 rounded-full ${saveDot} ${saveState === "saving" ? "animate-pulse" : ""}`}
            aria-hidden
          />
          {t(SAVE_KEYS[saveState])}
        </span>
        <Button variant="outline" onClick={() => void flushSave()}>
          {t("topbar.saveBtn")}
        </Button>
        <LangSwitcher />
        <Button variant="ghost" asChild>
          <a href="/dashboard">Dashboard</a>
        </Button>
      </div>
    </header>
  );
}
