// "Write bitácora" modal (spec 028, R7). The logbook had four write paths in
// core and MCP but none on the canvas: recording a decision, a daily log or a
// handoff meant leaving the builder for a terminal — the same dead end the
// consent panel (spec 010) fixed for approval.
//
// Every entry goes through POST /api/bitacora/:kind, which delegates to the
// SAME core writers the MCP tools use (writeDecision, writeDailyLog,
// writeHandoff, appendProjectLogEntry) — file naming rules live server-side.

import { useState } from "react";
import { api, errorMessage } from "../api";
import { useT } from "../i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { BitacoraKind } from "../types";

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

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
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donePath, setDonePath] = useState<string | null>(null);

  const changeKind = (next: BitacoraKind) => {
    setKind(next);
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
      setContent("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl" aria-label={t("bitacora.aria")}>
        <DialogHeader>
          <DialogTitle>📖 {t("bitacora.title")}</DialogTitle>
          <DialogDescription>{t("bitacora.note")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("bitacora.kind")}
            </span>
            <Select value={kind} onValueChange={(value) => changeKind(value as BitacoraKind)}>
              <SelectTrigger aria-label={t("bitacora.kind")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["decisiones", "handoffs", "diaria", "global"] as const).map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(`bitacora.kind.${option}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {needsFileName ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("bitacora.fileName")}
              </span>
              <input
                className={inputClass}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                onBlur={() => {
                  // Keep the .md extension; slugify the stem for safety.
                  const stem = slugify(fileName.replace(/\.md$/, ""));
                  if (stem) setFileName(`${stem}.md`);
                }}
              />
            </label>
          ) : null}
          {kind === "diaria" ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("bitacora.date")}
              </span>
              <input
                className={inputClass}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
          ) : null}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {t("bitacora.content")}
            </span>
            <textarea
              className={inputClass + " resize-y font-mono"}
              rows={8}
              value={content}
              placeholder={t(`bitacora.contentPh.${kind}`)}
              onChange={(e) => setContent(e.target.value)}
            />
          </label>
          {error ? (
            <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              ⚠ {error}
            </p>
          ) : null}
          {donePath ? (
            <p className="m-0 rounded-md bg-[var(--primary-soft)] px-3 py-2 text-sm break-all text-primary">
              ✓ {t("bitacora.done")} — <code>{donePath}</code>
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
          <Button onClick={() => void submit()} disabled={!canSubmit}>
            {busy ? t("bitacora.busy") : t("bitacora.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
