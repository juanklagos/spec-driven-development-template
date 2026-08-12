// Template gallery modal (spec 007, R4 → spec 030): ready-made playbooks that
// create real specs (POST /api/spec each) plus a tidy pre-laid-out canvas.
// Only allowed on a workspace with zero specs — and now the block explains
// WHY instead of just refusing.

import { useState } from "react";
import { X } from "lucide-react";
import { errorMessage } from "../api";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { BOARD_TEMPLATES, type BoardTemplate } from "../templates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function TemplateGallery() {
  const { t, lang } = useT();
  const setGalleryOpen = useBuilderStore((s) => s.setGalleryOpen);
  const applyTemplate = useBuilderStore((s) => s.applyTemplate);
  const specCount = useBuilderStore((s) => Object.keys(s.specs).length);
  const hasSpecs = specCount > 0;

  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!busyId) setGalleryOpen(false);
  };

  const apply = async (template: BoardTemplate) => {
    if (busyId || hasSpecs) return;
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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[820px]" showCloseButton={false}>
        <div className="flex h-[38px] items-center gap-2 border-b bg-muted px-4">
          <span className="font-mono text-[11.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t("gallery.title").toLowerCase()}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto size-6"
            aria-label={t("common.close")}
            onClick={close}
          >
            <X className="size-[13px]" />
          </Button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <DialogTitle className="sr-only">{t("gallery.title")}</DialogTitle>
          <DialogDescription className="m-0 text-sm text-muted-foreground">
            {t("gallery.note", { dir: "specs/NNN-…" })}
          </DialogDescription>
          {hasSpecs ? (
            // Aviso con el motivo (spec 030): las plantillas solo aplican en un
            // workspace vacío, para no mezclar dos árboles de decisiones.
            <p className="m-0 rounded-lg border border-[var(--amber)]/45 bg-[var(--amber-soft)] p-[10px_12px] text-sm text-[var(--amber-text)]">
              {t("templates.notEmpty", { n: specCount })}
            </p>
          ) : null}
          {error ? (
            <p className="m-0 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-2.5 max-[700px]:grid-cols-1">
            {BOARD_TEMPLATES.map((template) => (
              <article
                key={template.id}
                className={`flex flex-col gap-1.5 rounded-[9px] border bg-card p-3.5 ${
                  hasSpecs ? "opacity-65" : ""
                }`}
              >
                <div className="flex items-baseline gap-2">
                  <h3 className="m-0 min-w-0 flex-1 text-[14.5px] font-semibold">
                    {template.name[lang]}
                  </h3>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {t(template.epics.length === 1 ? "gallery.meta.one" : "gallery.meta.many", {
                      specs: template.specs.length,
                      epics: template.epics.length
                    })}
                  </span>
                </div>
                <p className="m-0 flex-1 text-[13px] text-muted-foreground">
                  {template.description[lang]}
                </p>
                <Button
                  size="sm"
                  className={`h-7 self-start ${hasSpecs ? "cursor-not-allowed" : ""}`}
                  disabled={hasSpecs || busyId !== null}
                  onClick={() => void apply(template)}
                >
                  {busyId === template.id ? t("gallery.applying") : t("gallery.use")}
                </Button>
              </article>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
