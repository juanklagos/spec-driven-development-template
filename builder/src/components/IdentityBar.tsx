// Franja 1 de la chrome (spec 030): identidad, workspace, ⌘K y estado.
// Reemplaza la mitad izquierda + los controles sueltos de la antigua TopBar:
// todo lo demás vive ahora en ⌘K y en el menú ⋯.
import { useState } from "react";
import { MoreHorizontal, Redo2, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "../api";
import { exportBoardPng } from "../exportPng";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { BitacoraModal } from "./BitacoraModal";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

/**
 * Estado en vivo + guardado en una sola línea. Antes eran tres elementos
 * distintos en la barra (🟢 En vivo, punto + Guardado, botón Guardar) que
 * decían variantes de lo mismo.
 */
function LiveSavedStatus() {
  const { t } = useT();
  const liveStatus = useBuilderStore((s) => s.liveStatus);
  const saveState = useBuilderStore((s) => s.saveState);
  const saveError = useBuilderStore((s) => s.saveError);

  const ok = saveState === "saved" && liveStatus === "on";
  const tone =
    saveState === "error" ? "text-destructive" : ok ? "text-primary" : "text-[var(--amber)]";
  const dot =
    saveState === "error" ? "bg-destructive" : ok ? "bg-primary" : "bg-[var(--amber)]";
  const label =
    saveState === "error"
      ? t("topbar.save.error")
      : saveState === "saving"
        ? t("topbar.save.saving")
        : saveState === "dirty"
          ? t("topbar.save.dirty")
          : liveStatus === "on"
            ? t("identity.liveSaved")
            : t("topbar.save.saved");

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs whitespace-nowrap ${tone}`}
      title={saveError ?? undefined}
      role="status"
      aria-live="polite"
    >
      <span
        className={`inline-block size-1.5 rounded-full ${dot} ${saveState === "saving" ? "animate-pulse" : ""}`}
        aria-hidden
      />
      {label}
    </span>
  );
}

/** Disparador de la paleta de comandos. Hijo flex normal, nunca absolute. */
function CommandTrigger({ onOpen }: { onOpen: () => void }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="mx-auto flex h-[30px] min-w-0 shrink basis-[420px] cursor-pointer items-center gap-2.5 rounded-[7px] border bg-muted px-[11px] text-left transition-colors hover:border-primary/45"
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 truncate text-[13px] text-muted-foreground">
        {t("identity.search")}
      </span>
      <kbd className="ml-auto shrink-0 rounded-[4px] border bg-card px-[5px] py-px font-mono text-[11px] font-normal text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  );
}

function HistoryButtons() {
  const { t } = useT();
  const canUndo = useBuilderStore((s) => s.past.length > 0);
  const canRedo = useBuilderStore((s) => s.future.length > 0);
  const undo = useBuilderStore((s) => s.undo);
  const redo = useBuilderStore((s) => s.redo);
  const cls =
    "size-7 rounded-[6px] disabled:text-[var(--disabled-foreground)] disabled:opacity-100";
  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        className={cls}
        onClick={undo}
        disabled={!canUndo}
        aria-label={t("topbar.undo")}
        title={t("topbar.undo.title")}
      >
        <Undo2 className="size-[15px]" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className={cls}
        onClick={redo}
        disabled={!canRedo}
        aria-label={t("topbar.redo")}
        title={t("topbar.redo.title")}
      >
        <Redo2 className="size-[15px]" />
      </Button>
    </>
  );
}

/** Menú ⋯: lo que salió de la TopBar y no merece franja propia. */
function OverflowMenu() {
  const { t, lang, setLang } = useT();
  const openTour = useBuilderStore((s) => s.openTour);
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);
  const bitacoraOpen = useBuilderStore((s) => s.bitacoraOpen);
  const setBitacoraOpen = useBuilderStore((s) => s.setBitacoraOpen);
  const [open, setOpen] = useState(false);

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const exportPng = async () => {
    try {
      await exportBoardPng(useBuilderStore.getState().nodes);
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  const reports = async () => {
    try {
      await api.generateStatus();
      await api.generateRoadmap();
      toast(`✓ ${t("menu.reports")}`);
    } catch (err) {
      toast(errorMessage(err));
    }
  };

  const item =
    "flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-left text-[13px] hover:bg-accent";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="size-7 rounded-[6px]"
            aria-label={t("identity.more")}
            title={t("identity.more")}
          >
            <MoreHorizontal className="size-[15px]" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 p-1.5">
          <button className={item} onClick={run(() => void exportPng())}>
            {t("menu.exportPng")}
          </button>
          <button className={item} onClick={run(() => void reports())}>
            {t("menu.reports")}
          </button>
          <button className={item} onClick={run(() => setBitacoraOpen(true))}>
            {t("menu.bitacora")}
          </button>
          <button className={item} onClick={run(() => setAssistantOpen(true))}>
            {t("menu.assistant")}
          </button>
          <button className={item} onClick={run(() => setGalleryOpen(true))}>
            {t("menu.templates")}
          </button>
          <button className={item} onClick={run(openTour)}>
            {t("menu.tour")}
          </button>
          <div className="my-1 border-t" />
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="text-[13px]">{t("menu.language")}</span>
            <span className="inline-flex overflow-hidden rounded-[6px] border">
              {(["es", "en"] as const).map((code, i) => (
                <button
                  key={code}
                  className={`cursor-pointer px-2 py-0.5 font-mono text-[11px] uppercase ${i > 0 ? "border-l" : ""} ${
                    lang === code
                      ? "bg-[var(--primary-chip)] font-semibold text-primary"
                      : "bg-card text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                >
                  {code}
                </button>
              ))}
            </span>
          </div>
          <div className="my-1 border-t" />
          <a className={item} href="/dashboard">
            {t("menu.dashboard")}
          </a>
        </PopoverContent>
      </Popover>
      {bitacoraOpen ? <BitacoraModal onClose={() => setBitacoraOpen(false)} /> : null}
    </>
  );
}

export function IdentityBar() {
  const { t } = useT();
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const setPaletteOpen = useBuilderStore((s) => s.setPaletteOpen);
  const parts = (projectRoot ?? "").split("/").filter(Boolean);
  const name = parts.pop() ?? "";
  const parent = parts.length > 0 ? `/${parts.join("/")}/` : "";

  return (
    <header className="z-20 flex h-[46px] shrink-0 items-center gap-3.5 border-b bg-card px-3.5">
      <Logo size={18} className="shrink-0 text-primary" />
      <span className="shrink-0 font-mono text-[13px] font-semibold tracking-[0.02em]">sdd</span>

      {projectRoot ? (
        // La única zona que cede ancho. Sin min-w-0 el ⌘K se solapa.
        <span
          className="min-w-0 shrink truncate font-mono text-[12.5px] text-muted-foreground max-[800px]:hidden"
          title={`${t("topbar.workspace")}: ${projectRoot}`}
        >
          {parent}
          <span className="text-foreground">{name}</span>
        </span>
      ) : null}

      <CommandTrigger onOpen={() => setPaletteOpen(true)} />

      <div className="ml-auto flex shrink-0 items-center gap-2.5">
        <LiveSavedStatus />
        <Separator orientation="vertical" className="!h-[18px]" />
        <HistoryButtons />
        <OverflowMenu />
      </div>
    </header>
  );
}
