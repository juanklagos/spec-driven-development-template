// ✨ Assistant wizard (spec 008, R1 → spec 030): describe the project in one
// sentence, preview a locally-generated draft board (editable: rename/remove
// specs, regenerate), and only on the CTA — which says the exact number of
// folders it will write — run the same real calls as the template gallery.
// Nothing touches the disk while previewing. The copyable MCP orchestrator
// prompt replaces the old "Have an AI agent?" accordion.

import { useEffect, useState } from "react";
import { Clipboard, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "../api";
import { draftToPlan, generateDraft, scopeSpecs, type AssistantDraft, type ProposalScope } from "../assistant";
import { useT, type Lang } from "../i18n";
import { buildOrchestratorPrompt } from "../prompts";
import { isAgentConnected } from "../requests";
import { useBuilderStore } from "../store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";

interface EditableSpec {
  key: string;
  name: string;
}

// --- Braindump -> structured spec (spec 031, R5) ---------------------------

/** The sections the agent must return; also the editable preview's shape. */
interface StructuredDraft {
  name: string;
  story: string;
  scenarios: string[];
  criteria: string[];
  requirements: string[];
}

/** The format contract embedded in the structure-idea request instruction. */
function structureInstruction(description: string, lang: Lang): string {
  const contract =
    'JSON: {"name": "<kebab-case-spec-name>", "story": "...", "scenarios": ["..."], "criteria": ["CUANDO ... EL SISTEMA DEBERÁ ..."], "requirements": ["..."]}';
  return lang === "es"
    ? `Estructura esta idea en bruto como borrador de spec SDD. Responde SOLO con ${contract} — sin markdown ni texto extra. Idea:\n${description}`
    : `Structure this raw idea as an SDD spec draft. Reply ONLY with ${contract} — no markdown, no extra text. Idea:\n${description}`;
}

/** Tolerant parse: accepts a bare JSON object or one wrapped in code fences. */
export function parseStructuredDraft(proposal: string): StructuredDraft | null {
  const unfenced = proposal.replace(/^\s*```[a-z]*\s*/i, "").replace(/\s*```\s*$/, "");
  try {
    const raw = JSON.parse(unfenced) as Record<string, unknown>;
    const list = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
    if (typeof raw.name !== "string" || !raw.name.trim()) return null;
    return {
      name: raw.name.trim(),
      story: typeof raw.story === "string" ? raw.story.trim() : "",
      scenarios: list(raw.scenarios),
      criteria: list(raw.criteria),
      requirements: list(raw.requirements)
    };
  } catch {
    return null;
  }
}

export function AssistantWizard() {
  const { t, lang } = useT();
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);
  const applyBoardPlan = useBuilderStore((s) => s.applyBoardPlan);
  const projectRoot = useBuilderStore((s) => s.projectRoot);

  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [specs, setSpecs] = useState<EditableSpec[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Braindump -> structured spec (spec 031, R5).
  const agentPresence = useBuilderStore((s) => s.agentPresence);
  const aiRequests = useBuilderStore((s) => s.aiRequests);
  const sendAiRequest = useBuilderStore((s) => s.sendAiRequest);
  const closeAiRequest = useBuilderStore((s) => s.closeAiRequest);
  const reload = useBuilderStore((s) => s.load);
  const connected = isAgentConnected(agentPresence, Date.now());
  const [structureId, setStructureId] = useState<string | null>(null);
  const [structured, setStructured] = useState<StructuredDraft | null>(null);
  const structureRequest = aiRequests.find((r) => r.id === structureId) ?? null;

  // Parse the proposal the moment it lands; a malformed one surfaces as an
  // error with "ask again" instead of a dead panel.
  useEffect(() => {
    if (structureRequest?.status !== "answered" || structured) return;
    const parsed = parseStructuredDraft(structureRequest.proposal ?? "");
    if (parsed) {
      setStructured(parsed);
      setError(null);
    } else {
      setError(t("assistant.structure.parseError"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureRequest?.status]);

  const askStructure = async () => {
    if (!description.trim() || busy) return;
    setBusy(true);
    setError(null);
    setDraft(null);
    setStructured(null);
    try {
      const created = await sendAiRequest({
        type: "structure-idea",
        instruction: structureInstruction(description.trim(), lang)
      });
      setStructureId(created.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const discardStructure = async (resolution: "rejected" | "cancelled") => {
    if (structureRequest) {
      await closeAiRequest(structureRequest.id, resolution).catch(() => {});
    }
    setStructureId(null);
    setStructured(null);
  };

  // The only writes of the flow, both through existing routes (R5): create
  // the spec folder, then fill its sections.
  const createStructured = async () => {
    if (!structured || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.createSpec(structured.name);
      await api.putSections(created.specId, {
        ...(structured.story ? { story: structured.story } : {}),
        ...(structured.scenarios.length > 0 ? { scenarios: structured.scenarios } : {}),
        ...(structured.criteria.length > 0 ? { criteria: structured.criteria } : {}),
        ...(structured.requirements.length > 0 ? { requirements: structured.requirements } : {})
      });
      if (structureRequest) await closeAiRequest(structureRequest.id, "accepted").catch(() => {});
      await reload();
      setAssistantOpen(false);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const close = () => {
    if (!busy) setAssistantOpen(false);
  };

  // Spec 036 (R1): el alcance lo elige la persona, no el estado del workspace.
  const [scope, setScope] = useState<ProposalScope>("board");

  const propose = (variant: number, next: ProposalScope = scope) => {
    setScope(next);
    const generated = generateDraft(description, variant, lang);
    setDraft(generated);
    setSpecs(scopeSpecs(generated, next).map(({ key, name }) => ({ key, name })));
    setError(null);
  };

  /** «Una spec»: con agente la estructura la IA; sin agente, el borrador local. */
  const proposeOne = () => {
    if (connected) void askStructure();
    else propose(0, "one");
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

  const copyPrompt = () => {
    void navigator.clipboard
      .writeText(buildOrchestratorPrompt(description, projectRoot, lang))
      .then(() => toast(t("prompt.copied")))
      .catch(() => toast(t("prompt.manual")));
  };

  const epicColor = "var(--epic)";
  const epicLabel = (key: string): string =>
    draft?.epics.find((epic) => epic.key === key)?.label ?? key;
  const epicOf = (specKey: string): string =>
    epicLabel(draft?.specs.find((spec) => spec.key === specKey)?.epicKey ?? "");
  const usedEpics = draft
    ? draft.epics.filter((epic) =>
        specs.some((s) => draft.specs.find((d) => d.key === s.key)?.epicKey === epic.key)
      )
    : [];
  const keptCount = specs.filter((s) => s.name.trim()).length;

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[760px]" showCloseButton={false}>
        <div className="flex h-[38px] items-center gap-2 border-b bg-muted px-4">
          <Sparkles className="size-[15px] text-primary" aria-hidden />
          <span className="font-mono text-[11.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {t("assistant.tag")}
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
          <DialogTitle className="text-[20px] leading-tight font-semibold tracking-[-0.015em]">
            {t("assistant.newTitle")}
          </DialogTitle>
          <DialogDescription className="m-0 text-sm text-muted-foreground">
            {t("assistant.newBody")}
          </DialogDescription>
          <textarea
            autoFocus
            className="w-full resize-y rounded-lg border border-input bg-muted px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            rows={3}
            value={description}
            placeholder={t("assistant.ph")}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && description.trim()) propose(0, "board");
            }}
          />
          {structureRequest && (structureRequest.status === "pending" || structureRequest.status === "in_progress") ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted p-[10px_12px]">
              <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                {t("assistant.structure.waiting")}
              </span>
              <Button size="sm" variant="outline" onClick={() => void discardStructure("cancelled")}>
                {t("ai.cancel")}
              </Button>
            </div>
          ) : null}

          {structured ? (
            // Preview editable de la spec estructurada (spec 031, R5): nada se
            // escribe hasta el CTA, que usa POST /api/spec + PUT sections.
            <div className="flex max-h-[42vh] flex-col gap-2 overflow-y-auto rounded-[9px] border p-3">
              <p className="m-0 font-mono text-[11.5px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                {t("assistant.structure.title")}
              </p>
              <label className="flex flex-col gap-1 text-xs font-semibold">
                {t("assistant.structure.name")}
                <input
                  className="h-8 rounded-[6px] border border-input bg-background px-2.5 font-mono text-[12.5px] font-normal outline-none focus:border-primary"
                  value={structured.name}
                  onChange={(e) => setStructured({ ...structured, name: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold">
                {t("editor.story")}
                <textarea
                  className="resize-y rounded-[6px] border border-input bg-background px-2.5 py-1.5 text-sm font-normal outline-none focus:border-primary"
                  rows={2}
                  value={structured.story}
                  onChange={(e) => setStructured({ ...structured, story: e.target.value })}
                />
              </label>
              {(
                [
                  ["scenarios", t("editor.scenarios")],
                  ["criteria", t("editor.criteria")],
                  ["requirements", t("editor.requirements")]
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-xs font-semibold">
                  {label}
                  <textarea
                    className="resize-y rounded-[6px] border border-input bg-background px-2.5 py-1.5 font-mono text-[12px] font-normal outline-none focus:border-primary"
                    rows={Math.max(2, structured[key].length)}
                    value={structured[key].join("\n")}
                    onChange={(e) =>
                      setStructured({
                        ...structured,
                        [key]: e.target.value.split("\n").filter((line) => line.trim() !== "")
                      })
                    }
                  />
                </label>
              ))}
            </div>
          ) : null}

          {draft ? (
            // Propuesta como lista editable (spec 030): renombra o quita specs
            // antes de aceptar.
            <div className="overflow-hidden rounded-[9px] border">
              <div className="flex items-center gap-2 border-b bg-muted px-3 py-1.5">
                <span className="font-mono text-[11.5px] text-muted-foreground">
                  {t("assistant.proposal", { specs: keptCount, epics: usedEpics.length })}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-6 px-2 font-mono text-[11px] lowercase"
                  onClick={() => propose(draft.variant + 1, scope)}
                  disabled={busy}
                  title={t("assistant.regenerate.title")}
                >
                  {t("assistant.regenerate")}
                </Button>
              </div>
              <div className="flex max-h-[38vh] flex-col gap-1.5 overflow-y-auto p-2.5">
                {specs.map((spec) => (
                  <div className="flex items-center gap-2" key={spec.key}>
                    <span
                      className="shrink-0 rounded-[5px] border px-[7px] py-0.5 font-mono text-[10.5px] whitespace-nowrap"
                      style={{ color: epicColor, borderColor: "color-mix(in oklab, var(--epic) 45%, transparent)" }}
                      title={t("assistant.epicTag")}
                    >
                      {epicOf(spec.key)}
                    </span>
                    <input
                      className="h-8 min-w-0 flex-1 rounded-[6px] border border-input bg-background px-2.5 font-mono text-[12.5px] outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                      value={spec.name}
                      onChange={(e) => renameSpec(spec.key, e.target.value)}
                      aria-label={t("assistant.specNameAria", { key: spec.key })}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={t("common.remove")}
                      title={t("common.remove")}
                      onClick={() => removeSpec(spec.key)}
                    >
                      <X className="size-[13px]" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="m-0 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter className="flex-row items-center gap-2 border-t pt-3.5 sm:justify-between">
            <Button variant="outline" onClick={copyPrompt} disabled={!description.trim()}>
              <Clipboard className="size-3.5" aria-hidden />
              {t("assistant.copyPrompt")}
            </Button>
            <span className="flex gap-2">
              <Button variant="outline" onClick={close} disabled={busy}>
                {t("common.cancel")}
              </Button>
              {structured ? (
                <>
                  <Button variant="outline" onClick={() => void discardStructure("rejected")} disabled={busy}>
                    {t("ai.reject")}
                  </Button>
                  <Button onClick={() => void createStructured()} disabled={busy || !structured.name.trim()}>
                    {busy ? t("assistant.creating") : t("assistant.structure.create")}
                  </Button>
                </>
              ) : draft ? (
                <Button onClick={() => void create()} disabled={busy || keptCount === 0}>
                  {busy
                    ? t("assistant.creating")
                    : keptCount === 1
                      ? t("assistant.createN.one")
                      : t("assistant.createN.many", { n: keptCount })}
                </Button>
              ) : (
                // Spec 036 (R1): las dos acciones, siempre. «Una spec» usa la
                // cola cuando hay agente (spec 031, R5) y el borrador local
                // cuando no lo hay; el prompt copiable de la izquierda sigue
                // siendo la salida para cualquier otra IA.
                <>
                  <Button
                    variant="outline"
                    disabled={!description.trim() || busy || Boolean(structureRequest)}
                    onClick={proposeOne}
                    title={connected ? t("assistant.proposeOne.ai") : t("assistant.proposeOne.local")}
                  >
                    {connected ? <Sparkles className="size-3.5" aria-hidden /> : null}
                    {t("assistant.proposeOne")}
                  </Button>
                  <Button disabled={!description.trim() || busy} onClick={() => propose(0, "board")}>
                    {t("assistant.proposeBoard")}
                  </Button>
                </>
              )}
            </span>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
