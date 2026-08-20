// Spec 036 (R5-R10) — «Revisar con IA» para una spec entera.
//
// Dos puertas, un solo producto:
//   - con agente en la cola, la petición `review-spec` viaja como cualquier
//     otra (spec 031) y la revisión llega sola;
//   - sin agente, el MISMO prompt se copia a cualquier IA —incluidas las que
//     no tienen API ni MCP— y su respuesta se pega de vuelta aquí.
// Las dos desembocan en `parseReview`, y por eso las dos entregan lo mismo.
//
// Este panel NO escribe (R10). Lo único accionable que ofrece es saltar al
// «Ampliar con IA» de la sección del hallazgo, que ya pasa por diff y firma
// humana. Aprobación y consentimiento siguen sin IA (R11).

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plug, ScanSearch, X } from "lucide-react";
import { errorMessage } from "../api";
import { useT, type TFunction } from "../i18n";
import { buildReviewPrompt } from "../prompts";
import { isAgentConnected, isStalled, type AiRequest } from "../requests";
import { parseReview, type ParsedReview, type ReviewFinding, type ReviewSection, type ReviewSeverity } from "../review";
import { useBuilderStore } from "../store";
import { PromptBox } from "./PromptBox";
import { Button } from "@/components/ui/button";

interface Props {
  specId: string;
  specMarkdown: string;
  /** Salta al editor, abre esa sección y precarga su «Ampliar con IA» (R9). */
  onFix: (section: ReviewSection, instruction: string) => void;
}

/** Etiqueta de cada ancla, reutilizando las del editor: un solo vocabulario. */
const SECTION_LABEL: Record<ReviewSection, string> = {
  story: "editor.story",
  scenarios: "editor.scenarios",
  criteria: "editor.criteria",
  requirements: "editor.requirements",
  properties: "editor.properties",
  successCriteria: "editor.success",
  outOfScope: "editor.outOfScope"
};

const SEVERITY_CLASS: Record<ReviewSeverity, string> = {
  blocker: "border-[var(--danger)]/45 bg-[var(--danger-soft)] text-[var(--destructive-text)]",
  warning: "border-[var(--amber)]/45 bg-[var(--amber-soft)] text-[var(--amber-text)]",
  note: "border-border bg-muted text-muted-foreground"
};

/** Singular y plural como el resto del builder (`*.one` / `*.many`). */
function plural(t: TFunction, key: string, n: number): string {
  return n === 1 ? t(`${key}.one`) : t(`${key}.many`, { n });
}

/** Ticks every 30s so "connected" and "stalled" stay honest (spec 031, R6/R8). */
function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function FindingRow({
  finding,
  t,
  onFix
}: {
  finding: ReviewFinding;
  t: TFunction;
  onFix: () => void;
}) {
  return (
    <li className="flex flex-col gap-1.5 rounded-[9px] border p-3">
      <div className="flex items-center gap-2">
        <span
          className={
            "shrink-0 rounded-[5px] border px-[7px] py-0.5 font-mono text-[10.5px] whitespace-nowrap " +
            SEVERITY_CLASS[finding.severity]
          }
        >
          {t(`review.severity.${finding.severity}`)}
        </span>
        <span className="min-w-0 truncate font-mono text-[11.5px] text-muted-foreground">
          {t(SECTION_LABEL[finding.section])}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-6 shrink-0 px-2 text-[11.5px]"
          onClick={onFix}
          title={t("review.fix.title")}
        >
          {t("review.fix")}
          <ArrowRight className="size-3" aria-hidden />
        </Button>
      </div>
      <p className="m-0 text-[13px] leading-[1.5]">{finding.finding}</p>
      {finding.why ? (
        <p className="m-0 text-[12.5px] leading-[1.5] text-muted-foreground">{finding.why}</p>
      ) : null}
    </li>
  );
}

export function ReviewPanel({ specId, specMarkdown, onFix }: Props) {
  const { t, lang } = useT();
  const now = useNow();
  const agentPresence = useBuilderStore((s) => s.agentPresence);
  const aiRequests = useBuilderStore((s) => s.aiRequests);
  const sendAiRequest = useBuilderStore((s) => s.sendAiRequest);
  const closeAiRequest = useBuilderStore((s) => s.closeAiRequest);
  const setConnectOpen = useBuilderStore((s) => s.setConnectOpen);

  const [requestId, setRequestId] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [parsed, setParsed] = useState<ParsedReview | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = isAgentConnected(agentPresence, now);
  const request: AiRequest | null = aiRequests.find((r) => r.id === requestId) ?? null;
  const prompt = useMemo(() => buildReviewPrompt(specId, specMarkdown, lang), [specId, specMarkdown, lang]);

  // Una spec distinta es una revisión distinta: nada se arrastra entre specs.
  useEffect(() => {
    setRequestId(null);
    setParsed(null);
    setPasted("");
    setError(null);
  }, [specId]);

  // La respuesta de la cola se interpreta en cuanto aterriza, con el mismo
  // analizador que el pegado (R6).
  useEffect(() => {
    if (request?.status !== "answered" || parsed) return;
    const result = parseReview(request.proposal ?? "");
    if (result) {
      setParsed(result);
      setError(null);
    } else {
      setError(t("review.parseError"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.status]);

  const ask = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setParsed(null);
    try {
      const created = await sendAiRequest({
        type: "review-spec",
        target: { kind: "spec", specId, ref: specId },
        currentText: specMarkdown,
        instruction: prompt
      });
      setRequestId(created.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const readPasted = () => {
    const result = parseReview(pasted);
    if (result) {
      setParsed(result);
      setError(null);
    } else {
      setError(t("review.parseError"));
    }
  };

  const reset = async (resolution: "rejected" | "cancelled") => {
    if (request) await closeAiRequest(request.id, resolution).catch(() => {});
    setRequestId(null);
    setParsed(null);
    setPasted("");
    setError(null);
  };

  const waiting = request && (request.status === "pending" || request.status === "in_progress");
  const stalled = request ? isStalled(request, now) : false;

  return (
    <div className="flex flex-col gap-3 pt-3 pb-2">
      <div className="flex items-center gap-2">
        <ScanSearch className="size-[15px] text-primary" aria-hidden />
        <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {t("review.tag")}
        </span>
        <span
          className={"ml-auto font-mono text-[11px] " + (connected ? "text-primary" : "text-[var(--amber-text)]")}
        >
          {connected ? t("ai.agentOn", { agent: agentPresence?.agent ?? "?" }) : t("ai.noAgentShort")}
        </span>
      </div>

      <p className="m-0 text-[13px] leading-[1.55] text-muted-foreground">{t("review.intro")}</p>

      {!parsed && !waiting ? (
        connected ? (
          <Button className="self-start" disabled={busy} onClick={() => void ask()}>
            <ScanSearch className="size-3.5" aria-hidden />
            {busy ? t("review.asking") : t("review.ask")}
          </Button>
        ) : (
          // R6: sin agente, cualquier IA sirve — incluidas las que no tienen
          // API. Lo que faltaba era el viaje de vuelta, y es este textarea.
          <div className="flex flex-col gap-2">
            <p className="m-0 text-[13px] leading-[1.55] text-muted-foreground">{t("review.noAgent")}</p>
            <Button
              size="sm"
              variant="outline"
              className="self-start"
              onClick={() => setConnectOpen(true)}
            >
              <Plug className="size-3" aria-hidden />
              {t("ai.connect")}
            </Button>
            <PromptBox prompt={prompt} rows={8} />
            <label className="flex flex-col gap-1 text-xs font-semibold">
              {t("review.paste")}
              <textarea
                className="w-full resize-y rounded-[7px] border border-input bg-muted/50 px-2.5 py-1.5 font-mono text-[12px] font-normal outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
                rows={4}
                value={pasted}
                placeholder={t("review.paste.ph")}
                onChange={(e) => setPasted(e.target.value)}
              />
            </label>
            <Button className="self-start" disabled={!pasted.trim()} onClick={readPasted}>
              {t("review.read")}
            </Button>
          </div>
        )
      ) : null}

      {waiting ? (
        <div className="flex items-center gap-2 rounded-[9px] border bg-muted p-[10px_12px]">
          <span className="min-w-0 flex-1 text-[13px] text-muted-foreground">
            {request.status === "pending" ? t("review.pending") : t("review.working", { agent: request.agent ?? "?" })}
            {stalled ? (
              <span className="ml-1.5 rounded-[4px] bg-[var(--amber-soft)] px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--amber-text)]">
                {t("ai.stalled")}
              </span>
            ) : null}
          </span>
          <Button size="sm" variant="outline" onClick={() => void reset("cancelled")}>
            <X className="size-3" aria-hidden />
            {t("ai.cancel")}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="m-0 rounded-[7px] bg-[var(--danger-soft)] px-3 py-2 text-[13px] text-destructive">{error}</p>
      ) : null}

      {parsed ? (
        <div className="flex flex-col gap-2">
          {parsed.review.summary ? (
            <p className="m-0 text-[13px] leading-[1.55]">{parsed.review.summary}</p>
          ) : null}

          {parsed.review.findings.length === 0 ? (
            <p className="m-0 rounded-[7px] border border-primary/40 bg-[var(--primary-soft)] px-3 py-2 text-[13px] text-[var(--primary-text)]">
              {t("review.clean")}
            </p>
          ) : (
            <>
              <p className="m-0 font-mono text-[11.5px] text-muted-foreground">
                {plural(t, "review.count", parsed.review.findings.length)}
              </p>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {parsed.review.findings.map((finding, i) => (
                  <FindingRow
                    key={i}
                    finding={finding}
                    t={t}
                    onFix={() =>
                      onFix(
                        finding.section,
                        t("review.fix.instruction", { finding: finding.finding, why: finding.why })
                      )
                    }
                  />
                ))}
              </ul>
            </>
          )}

          {parsed.dropped > 0 ? (
            <p className="m-0 text-[12px] text-muted-foreground">{plural(t, "review.dropped", parsed.dropped)}</p>
          ) : null}

          <Button size="sm" variant="outline" className="self-start" onClick={() => void reset("rejected")}>
            {t("review.again")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
