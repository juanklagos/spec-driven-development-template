// ✨ Assistant wizard (spec 008, R1): describe the project in one sentence,
// preview a locally-generated draft board (editable: rename/remove specs,
// regenerate), and only on "Create on the board" run the same real calls as
// the template gallery (POST /api/spec per spec + PUT /api/board). Nothing
// touches the disk while previewing. The "Have an AI agent?" section offers
// the copyable MCP orchestrator prompt for real-intelligence generation.

import { useState } from "react";
import { X } from "lucide-react";
import { errorMessage } from "../api";
import { draftToPlan, generateDraft, type AssistantDraft } from "../assistant";
import { useT } from "../i18n";
import { buildOrchestratorPrompt } from "../prompts";
import { useBuilderStore } from "../store";
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

interface EditableSpec {
  key: string;
  name: string;
}

function AgentPromptSection({ description }: { description: string }) {
  const { t, lang } = useT();
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2.5 border-t pt-3">
      <Button size="sm" variant="outline" className="self-start" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} {t("assistant.agent.toggle")}
      </Button>
      {open ? (
        <>
          <p className="m-0 text-xs text-muted-foreground">{t("assistant.agent.note")}</p>
          <PromptBox prompt={buildOrchestratorPrompt(description, projectRoot, lang)} />
        </>
      ) : null}
    </div>
  );
}

export function AssistantWizard() {
  const { t, lang } = useT();
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);
  const applyBoardPlan = useBuilderStore((s) => s.applyBoardPlan);
  const hasSpecs = useBuilderStore((s) => Object.keys(s.specs).length > 0);

  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [specs, setSpecs] = useState<EditableSpec[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!busy) setAssistantOpen(false);
  };

  const propose = (variant: number) => {
    const next = generateDraft(description, variant, lang);
    setDraft(next);
    setSpecs(next.specs.map(({ key, name }) => ({ key, name })));
    setError(null);
  };

  const renameSpec = (key: string, name: string) => {
    setSpecs(specs.map((spec) => (spec.key === key ? { ...spec, name } : spec)));
  };

  const removeSpec = (key: string) => {
    setSpecs(specs.filter((spec) => spec.key !== key));
  };

  const create = async () => {
    if (!draft || busy) return;
    const chosen = specs.map((spec) => ({ ...spec, name: spec.name.trim() })).filter((spec) => spec.name);
    if (chosen.length === 0) {
      setError(t("assistant.keepOne"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await applyBoardPlan(draftToPlan(draft, chosen));
      setAssistantOpen(false);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const epicLabel = (key: string): string =>
    draft?.epics.find((epic) => epic.key === key)?.label ?? key;
  const epicOf = (specKey: string): string =>
    epicLabel(draft?.specs.find((spec) => spec.key === specKey)?.epicKey ?? "");
  const usedEpics = draft
    ? draft.epics.filter((epic) =>
        specs.some((s) => draft.specs.find((d) => d.key === s.key)?.epicKey === epic.key)
      )
    : [];

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("assistant.title")}</DialogTitle>
          {draft === null ? <DialogDescription>{t("assistant.intro")}</DialogDescription> : null}
        </DialogHeader>

        {draft === null ? (
          <>
            <textarea
              autoFocus
              className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
              rows={4}
              value={description}
              placeholder={t("assistant.ph")}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && description.trim()) propose(0);
              }}
            />
            <DialogFooter>
              <Button variant="outline" onClick={close}>
                {t("common.cancel")}
              </Button>
              <Button disabled={!description.trim()} onClick={() => propose(0)}>
                {t("assistant.propose")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className="m-0 text-xs text-muted-foreground">{t("assistant.draftNote")}</p>
            {hasSpecs ? (
              <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
                ⚠ {t("assistant.hasSpecs")}
              </p>
            ) : null}
            <div className="flex flex-col gap-2.5">
              <p className="m-0 rounded-md border border-[var(--amber)] bg-[var(--amber-soft)] px-3 py-2 text-sm">
                {draft.ideaText}
              </p>
              <p className="m-0 text-xs text-muted-foreground">
                {t(usedEpics.length === 1 ? "assistant.meta.one" : "assistant.meta.many", {
                  specs: specs.length,
                  epics: usedEpics.length,
                  names: usedEpics.map((epic) => epic.label).join(" · ")
                })}
              </p>
              <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
                {specs.map((spec) => (
                  <div className="flex items-center gap-2" key={spec.key}>
                    <span
                      className="shrink-0 rounded-full border bg-muted px-2.5 py-0.5 text-[0.68rem] font-semibold whitespace-nowrap text-muted-foreground"
                      title={t("assistant.epicTag")}
                    >
                      {epicOf(spec.key)}
                    </span>
                    <input
                      className="flex-1 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                      value={spec.name}
                      onChange={(e) => renameSpec(spec.key, e.target.value)}
                      aria-label={t("assistant.specNameAria", { key: spec.key })}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={t("common.remove")}
                      title={t("common.remove")}
                      onClick={() => removeSpec(spec.key)}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            {error ? (
              <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
                ⚠ {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDraft(null)} disabled={busy}>
                {t("common.back")}
              </Button>
              <Button
                variant="outline"
                onClick={() => propose(draft.variant + 1)}
                disabled={busy}
                title={t("assistant.regenerate.title")}
              >
                {t("assistant.regenerate")}
              </Button>
              <Button onClick={() => void create()} disabled={busy || hasSpecs || specs.length === 0}>
                {busy ? t("assistant.creating") : t("assistant.create")}
              </Button>
            </DialogFooter>
          </>
        )}

        <AgentPromptSection description={description} />
      </DialogContent>
    </Dialog>
  );
}
