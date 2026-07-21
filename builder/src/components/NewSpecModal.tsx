import { useState, type FormEvent } from "react";
import { errorMessage } from "../api";
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

interface Props {
  onClose: () => void;
  onCreate: (name: string, owner: string) => Promise<void>;
}

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

export function NewSpecModal({ onClose, onCreate }: Props) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(name.trim(), owner.trim());
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>📋 {t("newSpec.title")}</DialogTitle>
            <DialogDescription>
              {t("newSpec.note", { dir: "specs/NNN-slug/" })}
            </DialogDescription>
          </DialogHeader>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            {t("newSpec.name")}
            <input
              autoFocus
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("newSpec.namePh")}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-muted-foreground">
            {t("newSpec.owner")}
            <input
              className={inputClass}
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder={t("newSpec.ownerPh")}
            />
          </label>
          {error ? (
            <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              ⚠ {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy || !name.trim()}>
              {busy ? t("newSpec.creating") : t("newSpec.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
