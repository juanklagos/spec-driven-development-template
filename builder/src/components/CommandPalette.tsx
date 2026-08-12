// ⌘K / Ctrl+K (spec 015, H3 → spec 030): la puerta principal a todo lo que
// salió de la TopBar. Resultados agrupados — acciones primero, specs después —
// con filas de icono/atajo y pie de atajos de navegación.
//
// Built on the Dialog this project already ships rather than on `cmdk`:
// adding a dependency for a filtered list in a dialog is not a trade a
// one-maintainer project should make.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleHelp,
  FileText,
  Image,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Plug,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "../api";
import { exportBoardPng } from "../exportPng";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { SpecSummary, SpecTone } from "../types";

/** "013-gate-integrity" -> "013" for the number badge. */
function specNumber(id: string): string {
  return id.match(/^(\d{3})-/)?.[1] ?? "";
}

interface PaletteAction {
  key: string;
  labelKey: string;
  labelVars?: Record<string, string | number>;
  icon: LucideIcon;
  shortcut?: string;
  run: () => void;
}

const TONE_TEXT: Record<SpecTone, string> = {
  done: "text-[var(--primary-text)]",
  ok: "text-[var(--primary-text)]",
  pending: "text-[var(--amber-text)]"
};

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, lang, setLang } = useT();
  const specs = useBuilderStore((s) => s.specs);
  const selectedSpecId = useBuilderStore((s) => s.selectedSpecId);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  const refreshGate = useBuilderStore((s) => s.refreshGate);
  const flushSave = useBuilderStore((s) => s.flushSave);
  const openTour = useBuilderStore((s) => s.openTour);
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);
  const setBitacoraOpen = useBuilderStore((s) => s.setBitacoraOpen);
  const setConnectOpen = useBuilderStore((s) => s.setConnectOpen);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const actions = useMemo((): PaletteAction[] => {
    const list: PaletteAction[] = [];
    if (selectedSpecId) {
      list.push({
        key: "approve",
        labelKey: "cmdk.approveOpen",
        icon: Check,
        run: () => selectSpec(selectedSpecId, "approval")
      });
    }
    list.push(
      { key: "validate", labelKey: "cmdk.validate", icon: ShieldCheck, run: () => void refreshGate() },
      { key: "decision", labelKey: "cmdk.logDecision", icon: FileText, run: () => setBitacoraOpen(true) },
      {
        key: "reports",
        labelKey: "cmdk.reports",
        icon: TrendingUp,
        run: () => {
          void (async () => {
            try {
              await api.generateStatus();
              await api.generateRoadmap();
              toast(`✓ ${t("menu.reports")}`);
            } catch (err) {
              toast(errorMessage(err));
            }
          })();
        }
      },
      {
        key: "png",
        labelKey: "cmdk.exportPng",
        icon: Image,
        run: () => {
          void exportBoardPng(useBuilderStore.getState().nodes).catch((err) =>
            toast(errorMessage(err))
          );
        }
      },
      { key: "templates", labelKey: "cmdk.templates", icon: LayoutGrid, run: () => setGalleryOpen(true) },
      { key: "assistant", labelKey: "cmdk.assistant", icon: Sparkles, run: () => setAssistantOpen(true) },
      { key: "connect", labelKey: "cmdk.connect", icon: Plug, run: () => setConnectOpen(true) },
      { key: "tour", labelKey: "cmdk.tour", icon: CircleHelp, run: openTour },
      {
        key: "lang",
        labelKey: "cmdk.lang",
        labelVars: { lang: lang === "es" ? "en" : "es" },
        icon: Languages,
        run: () => setLang(lang === "es" ? "en" : "es")
      },
      { key: "save", labelKey: "cmdk.saveNow", icon: Save, run: () => void flushSave() },
      {
        key: "dashboard",
        labelKey: "cmdk.dashboard",
        icon: LayoutDashboard,
        run: () => {
          window.location.href = "/dashboard";
        }
      }
    );
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpecId, lang, t]);

  const q = query.trim().toLowerCase();
  const matchedActions = useMemo(
    () => actions.filter((a) => !q || t(a.labelKey, a.labelVars).toLowerCase().includes(q)),
    [actions, q, t]
  );
  const matchedSpecs = useMemo(() => {
    const all = Object.values(specs).sort((a, b) => a.id.localeCompare(b.id));
    if (!q) return all;
    // Number and title both match: people remember either.
    return all.filter(
      (s) => s.id.toLowerCase().includes(q) || (s.title ?? "").toLowerCase().includes(q)
    );
  }, [specs, q]);

  const total = matchedActions.length + matchedSpecs.length;

  // A fresh open is a fresh search; a changing filter must not leave the
  // highlight pointing past the end of the list.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);
  useEffect(() => {
    setActive((i) => (i >= total ? 0 : i));
  }, [total]);

  const execute = (index: number) => {
    if (index < matchedActions.length) {
      const action = matchedActions[index];
      onOpenChange(false);
      action.run();
      return;
    }
    const spec = matchedSpecs[index - matchedActions.length];
    if (!spec) return;
    // El grafo es donde vive la spec; saltar desde el kanban debe aterrizar
    // en un sitio que pueda mostrarla seleccionada.
    setViewMode("canvas");
    selectSpec(spec.id);
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, total - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && total > 0) {
      e.preventDefault();
      execute(active);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const groupHead =
    "m-0 px-3.5 pt-2.5 pb-1 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase";

  const stateWord = (tone: SpecTone) =>
    t(tone === "done" ? "status.done" : tone === "ok" ? "status.approved" : "status.pending").toLowerCase();

  const renderSpecRow = (spec: SpecSummary, index: number) => {
    const i = matchedActions.length + index;
    const tone = spec.tone ?? "pending";
    return (
      <button
        key={spec.id}
        type="button"
        role="option"
        aria-selected={i === active}
        data-active={i === active}
        onMouseEnter={() => setActive(i)}
        onClick={() => execute(i)}
        className={`flex h-[34px] w-full items-center gap-[11px] px-3.5 text-left ${
          i === active ? "bg-[var(--primary-soft)]" : ""
        }`}
      >
        <span
          className={`size-1.5 shrink-0 rounded-full ${
            tone === "pending" ? "bg-[var(--amber)]" : "bg-primary"
          }`}
          aria-hidden
        />
        <span className="shrink-0 font-mono text-[12.5px] text-muted-foreground">
          {specNumber(spec.id)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13.5px]">{spec.title || spec.id}</span>
        <span className={`shrink-0 font-mono text-[11px] ${TONE_TEXT[tone]}`}>{stateWord(tone)}</span>
      </button>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[70px] max-w-[640px] translate-y-0 gap-0 overflow-hidden p-0 shadow-[var(--shadow-palette)]"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">{t("jump.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("cmdk.foot")}</DialogDescription>
        <div className="flex h-[46px] items-center gap-2.5 border-b px-3.5">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("identity.search")}
            aria-label={t("jump.title")}
            className="h-full min-w-0 flex-1 border-0 bg-transparent font-mono text-sm outline-none"
          />
          <kbd className="shrink-0 rounded-[4px] border bg-muted px-[5px] py-px font-mono text-[11px] text-muted-foreground">
            esc
          </kbd>
        </div>
        <div ref={listRef} role="listbox" aria-label={t("jump.title")} className="max-h-[380px] overflow-y-auto pb-1.5">
          {total === 0 ? (
            <p className="m-0 px-4 py-6 text-center text-sm text-muted-foreground">{t("jump.empty")}</p>
          ) : (
            <>
              {matchedActions.length > 0 ? <p className={groupHead}>{t("cmdk.actions")}</p> : null}
              {matchedActions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-active={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => execute(i)}
                    className={`flex h-[34px] w-full items-center gap-[11px] px-3.5 text-left ${
                      i === active ? "bg-[var(--primary-soft)]" : ""
                    }`}
                  >
                    <Icon className="size-[15px] shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13.5px]">
                      {t(action.labelKey, action.labelVars)}
                    </span>
                    {action.shortcut ? (
                      <kbd className="shrink-0 rounded-[4px] border px-[5px] py-px font-mono text-[11px] text-muted-foreground">
                        {action.shortcut}
                      </kbd>
                    ) : null}
                  </button>
                );
              })}
              {matchedSpecs.length > 0 ? <p className={groupHead}>{t("cmdk.specs")}</p> : null}
              {matchedSpecs.map(renderSpecRow)}
            </>
          )}
        </div>
        <p className="m-0 flex h-8 items-center border-t bg-muted px-3.5 font-mono text-[11px] text-muted-foreground">
          {t("cmdk.foot")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
