// Template gallery modal (spec 007, R4): four ready-made playbooks that
// create real specs (POST /api/spec each) plus a tidy pre-laid-out canvas.
// Only allowed on a workspace with zero specs; otherwise a warning is shown.

import { useState } from "react";
import { errorMessage } from "../api";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { BOARD_TEMPLATES, type BoardTemplate } from "../templates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

export function TemplateGallery() {
  const { t, lang } = useT();
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const applyTemplate = useBuilderStore((s) => s.applyTemplate);
  const hasSpecs = useBuilderStore((s) => Object.keys(s.specs).length > 0);

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!busyId) setGalleryOpen(false);
  };

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
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>🧩 {t("gallery.title")}</DialogTitle>
          <DialogDescription>{t("gallery.note", { dir: "specs/NNN-…" })}</DialogDescription>
        </DialogHeader>
        {hasSpecs ? (
          <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
            ⚠ {t("gallery.hasSpecs")}
          </p>
        ) : null}
        {error ? (
          <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
            ⚠ {error}
          </p>
        ) : null}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-3">
          {BOARD_TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="flex flex-col gap-1.5 rounded-lg border bg-muted/60 p-3.5"
            >
              <p className="m-0 text-2xl" aria-hidden>
                {template.emoji}
              </p>
              <h3 className="m-0 text-sm font-semibold">{template.name[lang]}</h3>
              <p className="m-0 flex-1 text-xs text-muted-foreground">
                {template.description[lang]}
              </p>
              <p className="m-0 text-xs font-semibold text-muted-foreground">
                {t(template.epics.length === 1 ? "gallery.meta.one" : "gallery.meta.many", {
                  specs: template.specs.length,
                  epics: template.epics.length
                })}
              </p>
              <Button
                size="sm"
                className="self-start"
                disabled={hasSpecs || busyId !== null}
                onClick={() => void apply(template)}
              >
                {busyId === template.id ? t("gallery.applying") : t("gallery.use")}
              </Button>
            </article>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busyId !== null}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
