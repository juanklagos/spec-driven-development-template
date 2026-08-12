// "Write bitácora" modal (spec 028, R7 → spec 030). Every entry goes through
// POST /api/bitacora/:kind, which delegates to the SAME core writers the MCP
// tools use — file naming rules live server-side.
//
// Spec 030: the destination path is visible BEFORE saving (folder + editable
// file name), the type is a mono segmented control, and the textarea comes
// preloaded with the section template.

import { useState } from "react";
import { X } from "lucide-react";
import { api, errorMessage } from "../api";
import { useT } from "../i18n";
import { AiAssistButton } from "./AiAssistButton";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { BitacoraKind } from "../types";

const KIND_DIR: Record<BitacoraKind, string> = {
  decisiones: "bitacora/decisiones/",
  handoffs: "bitacora/handoffs/",
  diaria: "bitacora/diaria/",
  global: "bitacora/global/"
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function BitacoraModal({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const today = new Date().toISOString().slice(0, 10);

  const [kind, setKind] = useState<BitacoraKind>("decisiones");
  const [fileName, setFileName] = useState(`${today}-.md`);
  const [date, setDate] = useState(today);
  const [content, setContent] = useState(() => t("bitacora.contentPh.decisiones"));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donePath, setDonePath] = useState<string | null>(null);

  const changeKind = (next: BitacoraKind) => {
    // Precargar la plantilla de la sección, sin pisar texto propio.
    const isTemplate = (["decisiones", "handoffs", "diaria", "global"] as const).some(
      (k) => content.trim() === t(`bitacora.contentPh.${k}`).trim() || content.trim() === ""
    );
    setKind(next);
    if (isTemplate) setContent(t(`bitacora.contentPh.${next}`));
    setError(null);
    setDonePath(null);
  };

  const needsFileName = kind === "decisiones" || kind === "handoffs";
  const canSubmit =
    !busy &&
    content.trim() !== "" &&
    (!needsFileName || /\.md$/.test(fileName)) &&
    (kind !== "diaria" || /^\d{4}-\d{2}-\d{2}$/.test(date));

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setDonePath(null);
    try {
      const payload: Record<string, string> =
        kind === "global"
          ? { entry: content.trim() }
          : kind === "diaria"
            ? { date, content: content.trim() }
            : { fileName: fileName.trim(), content: content.trim() };
      const result = await api.writeBitacora(kind, payload);
      setDonePath(result.path);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const segBtn = (option: BitacoraKind, i: number) => (
    <button
      key={option}
      type="button"
      className={`h-[30px] cursor-pointer px-3 font-mono text-xs whitespace-nowrap transition-colors ${i > 0 ? "border-l" : ""} ${
        kind === option
          ? "bg-[var(--primary-chip)] font-semibold text-primary"
          : "bg-card text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={kind === option}
      onClick={() => changeKind(option)}
    >
      {t(`bitacora.kind.${option}`).toLowerCase()}
    </button>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[700px]"
        aria-label={t("bitacora.aria")}
        showCloseButton={false}
      >
        <div className="flex h-[38px] items-center gap-2 border-b bg-muted px-4">
          <span className="font-mono text-[11.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            bitacora/
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto size-6"
            aria-label={t("common.close")}
            onClick={onClose}
          >
            <X className="size-[13px]" />
          </Button>
        </div>
        <div className="flex flex-col gap-3.5 p-5">
          <DialogTitle className="sr-only">{t("bitacora.title")}</DialogTitle>
          <DialogDescription className="m-0 text-sm text-muted-foreground">
            {t("bitacora.note")}
          </DialogDescription>
          <span className="inline-flex self-start overflow-hidden rounded-[7px] border" role="group" aria-label={t("bitacora.kind")}>
            {(["decisiones", "handoffs", "diaria", "global"] as const).map(segBtn)}
          </span>
          {/* Ruta de destino visible antes de guardar (spec 030). */}
          <div className="flex items-center gap-1.5 rounded-[7px] border bg-muted p-[9px_11px] font-mono text-[12.5px]">
            <span className="shrink-0 text-muted-foreground">{KIND_DIR[kind]}</span>
            {needsFileName ? (
              <input
                className="h-6 min-w-0 flex-1 rounded-[4px] border border-input bg-card px-1.5 font-mono text-[12.5px] outline-none focus:border-primary"
                value={fileName}
                aria-label={t("bitacora.fileName")}
                onChange={(e) => setFileName(e.target.value)}
                onBlur={() => {
                  // Keep the .md extension; slugify the stem for safety.
                  const stem = slugify(fileName.replace(/\.md$/, ""));
                  if (stem) setFileName(`${stem}.md`);
                }}
              />
            ) : kind === "diaria" ? (
              <input
                className="h-6 rounded-[4px] border border-input bg-card px-1.5 font-mono text-[12.5px] outline-none focus:border-primary"
                type="date"
                value={date}
                aria-label={t("bitacora.date")}
                onChange={(e) => setDate(e.target.value)}
              />
            ) : (
              <span>PROJECT_LOG.md</span>
            )}
          </div>
          {/* Ampliar con IA (spec 031, R4): accepting fills THIS draft; the
              actual write stays behind the modal's own save button, on the
              same bitácora route as always. */}
          <div className="flex justify-end">
            <AiAssistButton
              kind="bitacora"
              refId={kind}
              currentText={content}
              onAccept={(proposal) => setContent(proposal)}
            />
          </div>
          <textarea
            className="w-full resize-y rounded-[7px] border border-input bg-background px-3 py-2 font-mono text-[12.5px] leading-[1.7] outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            rows={9}
            value={content}
            aria-label={t("bitacora.content")}
            placeholder={t(`bitacora.contentPh.${kind}`)}
            onChange={(e) => setContent(e.target.value)}
          />
          {error ? (
            <p className="m-0 rounded-[7px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {donePath ? (
            <p className="m-0 rounded-[7px] bg-[var(--primary-soft)] px-3 py-2 text-sm break-all text-primary">
              ✓ {t("bitacora.done")} — <code>{donePath}</code>
            </p>
          ) : null}
          <div className="flex items-center gap-2 border-t pt-3.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted-foreground">
              {t("bitacora.markdown")}
            </span>
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => void submit()} disabled={!canSubmit}>
              {busy ? t("bitacora.busy") : t("bitacora.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
