// Spec 031 — the shared "Ampliar con IA" widget (R4/R4b). Mounting it on a
// field is one line; every surface gets the same lifecycle: instruction →
// request published → agent claims → proposal shown as a line diff → the
// USER accepts (only then does `onAccept` write, through that field's
// existing route) or rejects. With no agent listening (R6) it degrades to
// the classic copyable prompt instead of leaving anyone waiting.
//
// R4b note: `kind` is restricted to content surfaces by the AiFieldKind
// union (spec 036 excluded "spec" from it) — approval/consent forms have no
// kind to mount this with, and ai-surfaces.test.ts pins the exact mounts.

import { useEffect, useMemo, useState } from "react";
import { Plug, Sparkles, X } from "lucide-react";
import { errorMessage } from "../api";
import { diffLines } from "../diff";
import { useT } from "../i18n";
import { buildFieldPrompt } from "../prompts";
import { isAgentConnected, isStalled, type AiFieldKind, type AiRequest } from "../requests";
import { useBuilderStore } from "../store";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PromptBox } from "./PromptBox";

interface Props {
  kind: AiFieldKind;
  specId?: string;
  /** Field id inside its surface: section key, "tasks.md", note id, bitacora kind. */
  refId: string;
  currentText: string;
  /** The single write of the flow, through the field's existing route. */
  onAccept: (proposal: string) => Promise<void> | void;
  /** Compact icon-only trigger for tight rows (notes). */
  compact?: boolean;
}

/** Ticks every 30s so "connected" (5 min) and "stalled" (10 min) stay honest. */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function DiffView({ current, proposal }: { current: string; proposal: string }) {
  const rows = useMemo(() => diffLines(current, proposal), [current, proposal]);
  return (
    <div className="max-h-56 overflow-y-auto rounded-[7px] border font-mono text-[11.5px] leading-[1.6]">
      {rows.map((row, i) => (
        <div
          key={i}
          className={
            "px-2 whitespace-pre-wrap " +
            (row.type === "add"
              ? "bg-[var(--primary-soft)] text-[var(--primary-text)]"
              : row.type === "del"
                ? "bg-[var(--danger-soft)] text-[var(--destructive-text)] line-through opacity-80"
                : "text-muted-foreground")
          }
        >
          {row.type === "add" ? "+ " : row.type === "del" ? "- " : "  "}
          {row.text || " "}
        </div>
      ))}
    </div>
  );
}

export function AiAssistButton({ kind, specId, refId, currentText, onAccept, compact }: Props) {
  const { t, lang } = useT();
  const now = useNow();
  const agentPresence = useBuilderStore((s) => s.agentPresence);
  const aiRequests = useBuilderStore((s) => s.aiRequests);
  const sendAiRequest = useBuilderStore((s) => s.sendAiRequest);
  const closeAiRequest = useBuilderStore((s) => s.closeAiRequest);
  const setConnectOpen = useBuilderStore((s) => s.setConnectOpen);
  const aiPrefill = useBuilderStore((s) => s.aiPrefill);
  const setAiPrefill = useBuilderStore((s) => s.setAiPrefill);

  const [open, setOpen] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = isAgentConnected(agentPresence, now);
  const request: AiRequest | null = aiRequests.find((r) => r.id === requestId) ?? null;

  // Spec 036 (R9): un hallazgo de la revisión nos abre con su indicación ya
  // escrita. Se consume una sola vez; a partir de ahí el flujo es el de
  // siempre — la persona lee el diff y decide.
  useEffect(() => {
    if (!aiPrefill || aiPrefill.refId !== refId || aiPrefill.specId !== specId) return;
    setInstruction(aiPrefill.instruction);
    setOpen(true);
    setAiPrefill(null);
  }, [aiPrefill, refId, specId, setAiPrefill]);

  const reset = () => {
    setRequestId(null);
    setInstruction("");
    setError(null);
  };

  const send = async () => {
    if (!instruction.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const created = await sendAiRequest({
        type: "draft-field",
        target: { kind, ...(specId ? { specId } : {}), ref: refId },
        currentText,
        instruction: instruction.trim()
      });
      setRequestId(created.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const accept = async () => {
    if (!request?.proposal || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onAccept(request.proposal);
      await closeAiRequest(request.id, "accepted");
      reset();
      setOpen(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const close = async (resolution: "rejected" | "cancelled") => {
    if (!request || busy) return;
    setBusy(true);
    setError(null);
    try {
      await closeAiRequest(request.id, resolution);
      reset();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const waiting = request && (request.status === "pending" || request.status === "in_progress");
  const stalled = request ? isStalled(request, now) : false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {/* Plain trigger, not asChild: this widget carries its own compact
          styling and does not need the ui Button (same as GateStatusBar). */}
      <PopoverTrigger
        className={
          "inline-flex cursor-pointer items-center gap-1 rounded-[5px] border border-transparent font-mono text-[11px] text-muted-foreground transition-colors hover:border-primary/45 hover:text-foreground " +
          (compact ? "size-6 justify-center p-0" : "h-6 px-2")
        }
        aria-label={t("ai.assist")}
        title={t("ai.assist")}
      >
        <Sparkles className="size-3 text-primary" aria-hidden />
        {compact ? null : t("ai.assist")}
      </PopoverTrigger>
      <PopoverContent align="end" className="flex w-96 flex-col gap-2.5">
        <p className="m-0 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          <Sparkles className="size-3 text-primary" aria-hidden />
          {t("ai.title")}
          <span className={"ml-auto normal-case " + (connected ? "text-primary" : "text-[var(--amber-text)]")}>
            {connected ? t("ai.agentOn", { agent: agentPresence?.agent ?? "?" }) : t("ai.noAgentShort")}
          </span>
        </p>

        {!connected && !request ? (
          // R6: nobody listening — say it now and hand over the classic prompt.
          <>
            <p className="m-0 text-xs leading-relaxed text-muted-foreground">{t("ai.noAgent")}</p>
            {/* Spec 032: el atajo a "cómo conecto" va aquí, que es donde el
                usuario descubre que no hay agente. */}
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => {
                setOpen(false);
                setConnectOpen(true);
              }}
            >
              <Plug className="size-3" aria-hidden />
              {t("ai.connect")}
            </Button>
            <PromptBox prompt={buildFieldPrompt(kind, specId, refId, currentText, instruction, lang)} rows={6} />
          </>
        ) : null}

        {!request ? (
          <>
            <textarea
              className="w-full resize-y rounded-[7px] border border-input bg-muted/50 px-2.5 py-1.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
              rows={2}
              value={instruction}
              placeholder={t("ai.instruction.ph")}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void send();
              }}
            />
            {connected ? (
              <Button size="sm" className="self-start" disabled={busy || !instruction.trim()} onClick={() => void send()}>
                {busy ? t("ai.sending") : t("ai.send")}
              </Button>
            ) : null}
          </>
        ) : null}

        {waiting ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-xs text-muted-foreground">
              {request.status === "pending"
                ? t("ai.pending")
                : t("ai.working", { agent: request.agent ?? "?" })}
              {stalled ? (
                <span className="ml-1.5 rounded-[4px] bg-[var(--amber-soft)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--amber-text)]">
                  {t("ai.stalled")}
                </span>
              ) : null}
            </p>
            <Button size="sm" variant="outline" className="self-start" disabled={busy} onClick={() => void close("cancelled")}>
              <X className="size-3" aria-hidden />
              {t("ai.cancel")}
            </Button>
          </div>
        ) : null}

        {request?.status === "answered" && request.proposal !== undefined ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-xs font-semibold">{t("ai.answered")}</p>
            <DiffView current={currentText} proposal={request.proposal} />
            <div className="flex gap-2">
              <Button size="sm" disabled={busy} onClick={() => void accept()}>
                {busy ? t("ai.applying") : t("ai.accept")}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void close("rejected")}>
                {t("ai.reject")}
              </Button>
            </div>
          </div>
        ) : null}

        {request && (request.status === "accepted" || request.status === "rejected" || request.status === "cancelled") ? (
          // The queue moved on without us (another tab, the chip in the status
          // bar): offer a clean restart instead of a dead panel.
          <Button size="sm" variant="outline" className="self-start" onClick={reset}>
            {t("ai.again")}
          </Button>
        ) : null}

        {error ? <p className="m-0 text-xs text-destructive">{error}</p> : null}
      </PopoverContent>
    </Popover>
  );
}
