// Franja 4 de la chrome (spec 030): la regla de oro de SDD, escrita y
// permanente.
//
// Antes esto era un chip de 20px perdido entre 13 controles de la TopBar, con
// la explicación escondida detrás de un "?" y el veredicto comunicado con
// emojis (🟢🟡🔴) que no heredan el color del tema. La barra de estado dice
// el veredicto, las cuentas y LA REGLA, siempre.
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useT } from "../i18n";
import { activeAiRequests, isStalled } from "../requests";
import { useBuilderStore } from "../store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { GateVerdict, ValidationMessage } from "../types";

const TONE: Record<GateVerdict, { bar: string; text: string; box: string }> = {
  open: {
    bar: "border-t-[var(--primary)]/30 bg-[var(--primary-soft)]",
    text: "text-[var(--primary-text)]",
    box: "bg-primary"
  },
  closed: {
    bar: "border-t-[var(--amber)]/30 bg-[var(--amber-soft)]",
    text: "text-[var(--amber-text)]",
    box: "bg-[var(--amber)]"
  },
  blocked: {
    bar: "border-t-destructive/30 bg-[var(--danger-soft)]",
    text: "text-[var(--destructive-text)]",
    box: "bg-destructive"
  }
};

const VERDICT_KEY: Record<GateVerdict, string> = {
  open: "gatebar.open",
  closed: "gatebar.closed",
  blocked: "gatebar.blocked"
};

function IssueLine({ issue }: { issue: ValidationMessage }) {
  const tone =
    issue.level === "error"
      ? "text-[var(--destructive-text)]"
      : issue.level === "warning"
        ? "text-[var(--amber-text)]"
        : "text-muted-foreground";
  return <li className={`text-xs leading-relaxed ${tone}`}>• {issue.message}</li>;
}

/** Popover de "Ver qué falta": generalIssues + specIssues agrupados por spec. */
function WhatsMissing({ className }: { className: string }) {
  const { t } = useT();
  const gate = useBuilderStore((s) => s.gate);
  const general = gate?.generalIssues ?? [];
  const bySpec = Object.entries(gate?.specIssues ?? {}).filter(([, list]) => list.length > 0);

  return (
    <Popover>
      <PopoverTrigger className={className}>{t("gatebar.whatsMissing")}</PopoverTrigger>
      <PopoverContent align="end" side="top" className="max-h-80 w-96 overflow-y-auto">
        {general.length === 0 && bySpec.length === 0 ? (
          <p className="m-0 text-xs text-muted-foreground">{t("gatebar.noIssues")}</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {general.length > 0 ? (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {general.map((issue, i) => (
                  <IssueLine key={`${issue.code}-${i}`} issue={issue} />
                ))}
              </ul>
            ) : null}
            {bySpec.map(([specId, issues]) => (
              <div key={specId}>
                <p className="m-0 mb-1 font-mono text-[11px] font-semibold">{specId}</p>
                <ul className="m-0 flex list-none flex-col gap-1 p-0">
                  {issues.map((issue, i) => (
                    <IssueLine key={`${issue.code}-${i}`} issue={issue} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

/**
 * AI queue chip (spec 031, R7/R8): active requests visible without opening a
 * menu, stalled ones flagged and cancellable right here.
 */
function AiQueueChip({ className }: { className: string }) {
  const { t } = useT();
  const aiRequests = useBuilderStore((s) => s.aiRequests);
  const closeAiRequest = useBuilderStore((s) => s.closeAiRequest);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const active = activeAiRequests(aiRequests);
  if (active.length === 0) return null;
  const anyStalled = active.some((r) => isStalled(r, now));

  return (
    <Popover>
      <PopoverTrigger
        className={
          className +
          " inline-flex items-center gap-1" +
          (anyStalled ? " border-[var(--amber)]/60 text-[var(--amber-text)]" : "")
        }
      >
        <Sparkles className="size-3 text-primary" aria-hidden />
        {active.length === 1 ? t("ai.queue.one") : t("ai.queue.many", { n: active.length })}
      </PopoverTrigger>
      <PopoverContent align="end" side="top" className="flex w-96 flex-col gap-2">
        <p className="m-0 font-mono text-[11px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          {t("ai.queue.title")}
        </p>
        {active.map((request) => (
          <div key={request.id} className="flex items-start gap-2 border-b border-[var(--hairline)] pb-2 last:border-b-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="m-0 truncate font-mono text-[11px]">
                {request.target ? `${request.target.specId ?? ""} ${request.target.ref}`.trim() : request.type}
              </p>
              <p className="m-0 truncate text-xs text-muted-foreground" title={request.instruction}>
                {request.instruction}
              </p>
              <p className="m-0 text-[11px] text-muted-foreground">
                {t(`ai.status.${request.status}` as "ai.status.pending")}
                {isStalled(request, now) ? (
                  <span className="ml-1.5 rounded-[4px] bg-[var(--amber-soft)] px-1.5 font-mono text-[10.5px] text-[var(--amber-text)]">
                    {t("ai.stalled")}
                  </span>
                ) : null}
              </p>
            </div>
            {request.status !== "answered" ? (
              <button
                className="shrink-0 cursor-pointer rounded-[4px] border bg-card px-2 py-0.5 text-[11px] hover:border-primary/45"
                onClick={() => void closeAiRequest(request.id, "cancelled")}
              >
                {t("ai.cancel")}
              </button>
            ) : null}
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function GateStatusBar() {
  const { t } = useT();
  const gate = useBuilderStore((s) => s.gate);
  const gateBusy = useBuilderStore((s) => s.gateBusy);
  const gateError = useBuilderStore((s) => s.gateError);
  const refreshGate = useBuilderStore((s) => s.refreshGate);
  const specCount = useBuilderStore((s) => Object.keys(s.specs).length);

  const verdict: GateVerdict = gate?.verdict ?? "closed";
  const tone = TONE[verdict];

  const detail =
    specCount === 0
      ? t("gatebar.emptyDetail")
      : `${t("gatebar.detail", {
          e: gate?.errors ?? 0,
          w: gate?.warnings ?? 0,
          a: gate?.approvedSpecs ?? 0,
          t: gate?.totalSpecs ?? 0
        })} — ${t("gatebar.rule")}`;

  const btn =
    "h-5 cursor-pointer rounded-[4px] border bg-card px-[9px] text-[11.5px] text-foreground transition-colors hover:border-primary/45 disabled:opacity-60";

  return (
    <div
      className={`flex h-[30px] shrink-0 items-center gap-3 border-t px-3.5 font-mono text-xs ${tone.bar}`}
      role="status"
      aria-live="polite"
      data-tour="gate"
    >
      <span
        className={`inline-flex shrink-0 items-center gap-[7px] font-semibold whitespace-nowrap ${tone.text}`}
      >
        {/* Cuadro, no círculo: lo distingue de los puntos de estado de spec. */}
        <span className={`size-[7px] rounded-[2px] ${tone.box}`} aria-hidden />
        {t(VERDICT_KEY[verdict])}
      </span>
      <span className="min-w-0 truncate text-foreground/60" title={gateError ?? detail}>
        {detail}
      </span>
      <span className="ml-auto flex shrink-0 gap-2">
        <AiQueueChip className={btn} />
        <button
          className={btn}
          onClick={() => void refreshGate()}
          disabled={gateBusy}
          title={t("topbar.gate.validateTitle")}
        >
          {gateBusy ? t("topbar.gate.validating") : t("topbar.gate.validate")}
        </button>
        <WhatsMissing className={btn} />
      </span>
    </div>
  );
}
