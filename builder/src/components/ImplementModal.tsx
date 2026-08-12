// "Implement with agent" modal (spec 008, R2 → spec 030). Copy-first by
// design: the exact, gate-respecting kickoff prompt is preloaded and copyable,
// and works with any agent. Only reachable for APPROVED specs; the hard stop
// lives on the drawer block that opens this modal. The precondition chips make
// visible WHY implementing is allowed.

import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useT } from "../i18n";
import { buildImplementPrompt } from "../prompts";
import { useBuilderStore } from "../store";
import { PromptBox } from "./PromptBox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

interface Props {
  specId: string;
  /** Absolute spec directory (summary.dir from the API). */
  specDir: string;
  projectRoot: string;
  onClose: () => void;
}

function PreChip({ children, verified }: { children: React.ReactNode; verified?: boolean }) {
  return (
    <span
      className={`inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11.5px] whitespace-nowrap ${
        verified
          ? "border-primary/45 bg-[var(--primary-soft)] text-[var(--primary-text)]"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {verified ? <Check className="size-3" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function ImplementModal({ specId, specDir, projectRoot, onClose }: Props) {
  const { t, lang } = useT();
  const summary = useBuilderStore((s) => s.specs[specId]);
  const gateIssues = useBuilderStore((s) => s.gate?.specIssues[specId]) ?? [];
  const prompt = buildImplementPrompt({ projectRoot, specId, specDir }, lang);

  const planConsistent = !gateIssues.some((issue) => issue.level === "error");
  const consentRecorded = !gateIssues.some(
    (issue) => issue.code === "missing-spec-consent" || issue.code === "missing-consent-log"
  );
  const tasks = summary?.tasks;

  const copyClose = () => {
    void navigator.clipboard
      .writeText(prompt)
      .then(() => {
        toast(t("prompt.copied"));
        onClose();
      })
      .catch(() => toast(t("prompt.manual")));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[720px]"
        aria-label={t("implement.aria", { id: specId })}
        showCloseButton={false}
      >
        <div className="flex h-[38px] items-center gap-2 border-b bg-[var(--primary-soft)] px-4">
          <span className="size-[7px] rounded-[2px] bg-primary" aria-hidden />
          <span className="font-mono text-[11.5px] font-semibold tracking-[0.12em] text-[var(--primary-text)] uppercase">
            {t("implement.tag", { id: specId })}
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
          <DialogTitle className="text-[20px] leading-tight font-semibold tracking-[-0.015em]">
            {t("implement.newTitle")}
          </DialogTitle>
          <DialogDescription className="m-0 text-sm text-muted-foreground">
            {t("implement.newBody")}
          </DialogDescription>
          {/* Precondiciones verificadas: por qué se permite implementar. */}
          <div className="flex flex-wrap gap-2">
            <PreChip verified>{t("implement.pre.approved")}</PreChip>
            <PreChip verified={planConsistent}>{t("implement.pre.plan")}</PreChip>
            <PreChip verified={consentRecorded}>{t("implement.pre.consent")}</PreChip>
            {tasks && tasks.total > 0 ? (
              <PreChip>
                {tasks.done}/{tasks.total} {t("sheet.tasks").toLowerCase()}
              </PreChip>
            ) : null}
          </div>
          <PromptBox prompt={prompt} rows={12} />
          <div className="flex items-center gap-2 border-t pt-3.5">
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-muted-foreground">
              {t("implement.agents")}
            </span>
            <Button variant="outline" onClick={onClose}>
              {t("common.close")}
            </Button>
            <Button onClick={copyClose}>{t("implement.copyClose")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
