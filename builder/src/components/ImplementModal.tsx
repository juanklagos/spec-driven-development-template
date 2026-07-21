// "Implement with agent" modal (spec 008, R2). Copy-first by design: no
// fragile deep links into a specific agent app — the exact, gate-respecting
// kickoff prompt is preloaded and copyable, and works with any agent
// (Claude Code, Codex, Cursor, ...). Only reachable for APPROVED specs; the
// hard stop lives on the sheet button that opens this modal.

import { useT } from "../i18n";
import { buildImplementPrompt } from "../prompts";
import { PromptBox } from "./PromptBox";
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
  specId: string;
  /** Absolute spec directory (summary.dir from the API). */
  specDir: string;
  projectRoot: string;
  onClose: () => void;
}

export function ImplementModal({ specId, specDir, projectRoot, onClose }: Props) {
  const { t, lang } = useT();
  const prompt = buildImplementPrompt({ projectRoot, specId, specDir }, lang);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl" aria-label={t("implement.aria", { id: specId })}>
        <DialogHeader>
          <DialogTitle>{t("implement.title")}</DialogTitle>
          <DialogDescription>{t("implement.note")}</DialogDescription>
        </DialogHeader>
        <PromptBox prompt={prompt} rows={14} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
