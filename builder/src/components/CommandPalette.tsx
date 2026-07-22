// Cmd+K / Ctrl+K: jump to any spec by number or title (spec 015, H3).
//
// With 13 specs the canvas already needs zooming and visual scanning, and there
// was no search, no jump, and exactly one global shortcut in the whole app
// (undo). Reaching a known spec cost a hunt.
//
// Built on the Dialog this project already ships rather than on `cmdk`. The
// plan claimed shadcn already provided a command component; it does not, and
// adding a dependency for a filtered list in a dialog is not a trade a
// one-maintainer project should make. ~40 lines of state instead.
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";

/** "013-gate-integrity" -> "013" for the number badge. */
function specNumber(id: string): string {
  return id.match(/^(\d{3})-/)?.[1] ?? "";
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useT();
  const specs = useBuilderStore((s) => s.specs);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const all = Object.values(specs).sort((a, b) => a.id.localeCompare(b.id));
    const q = query.trim().toLowerCase();
    if (!q) return all;
    // Number and title both match: people remember either.
    return all.filter((s) => s.id.toLowerCase().includes(q) || (s.title ?? "").toLowerCase().includes(q));
  }, [specs, query]);

  // A fresh open is a fresh search; a changing filter must not leave the
  // highlight pointing past the end of the list.
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);
  useEffect(() => {
    setActive((i) => (i >= results.length ? 0 : i));
  }, [results.length]);

  const choose = (id: string) => {
    // The canvas is where a spec lives; jumping from the kanban should land
    // somewhere that can actually show it selected.
    setViewMode("canvas");
    selectSpec(id);
    onOpenChange(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      choose(results[active].id);
    }
  };

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[20%] max-w-lg translate-y-0 gap-0 p-0" showCloseButton={false}>
        <DialogTitle className="sr-only">{t("jump.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("jump.hint")}</DialogDescription>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t("jump.placeholder")}
          aria-label={t("jump.title")}
          className="w-full border-0 border-b border-border bg-transparent px-4 py-3.5 text-sm outline-none"
        />
        <div ref={listRef} role="listbox" aria-label={t("jump.title")} className="max-h-80 overflow-y-auto py-1.5">
          {results.length === 0 ? (
            <p className="m-0 px-4 py-6 text-center text-sm text-muted-foreground">{t("jump.empty")}</p>
          ) : (
            results.map((spec, i) => (
              <button
                key={spec.id}
                type="button"
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(spec.id)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                  i === active ? "bg-[var(--muted)]" : ""
                }`}
              >
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{specNumber(spec.id)}</span>
                <span className="truncate">{spec.title || spec.id}</span>
              </button>
            ))
          )}
        </div>
        <p className="m-0 border-t border-border px-4 py-2 text-xs text-muted-foreground">{t("jump.hint")}</p>
      </DialogContent>
    </Dialog>
  );
}
