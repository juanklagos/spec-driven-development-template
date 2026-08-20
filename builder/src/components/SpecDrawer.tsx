// Spec detail sheet (spec 007 → 010 → 030 "2a Terminal claro"): a wide
// non-modal Sheet (the graph stays interactive) with four underlined tabs:
//   - resumen: why implement is blocked (or the unlock), score with the big
//     grade, live tasks, GitHub issues with the exact count, spec.md excerpt.
//   - editar: one form per template section (SectionEditor).
//   - aprobación: the real approval block as a form + the consent second step.
//   - relaciones: incoming/outgoing purposeful connections with type change.

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleDot, Lock, LockOpen, X } from "lucide-react";
import { api, errorMessage } from "../api";
import { edgeKind, EDGE_KIND_LABELS, type EdgeKind } from "../convert";
import { lintEarsCriterion } from "../ears";
import { useT } from "../i18n";
import { isApprovedStatusText, parseApproval, parseSpecSections } from "../sections";
import { readTasksCollapsed, useBuilderStore, writeTasksCollapsed } from "../store";
import { AiAssistButton } from "./AiAssistButton";
import { ImplementModal } from "./ImplementModal";
import { SectionEditor } from "./SectionEditor";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ReviewPanel } from "./ReviewPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppNode, CreateIssuesResult, SpecDetail, SpecScore, SpecTone, TaskItem } from "../types";

const EXCERPT_LINES = 25;
const SCORE_TARGET = 85;

const inputClass =
  "w-full rounded-[7px] border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

/** Cabecera mono uppercase de sección del drawer. */
function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-2 flex items-center gap-2 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
      {children}
    </div>
  );
}

const TONE_TEXT: Record<SpecTone, string> = {
  done: "text-[var(--primary-text)]",
  ok: "text-[var(--primary-text)]",
  pending: "text-[var(--amber-text)]"
};

// Bloque de bloqueo/desbloqueo (spec 030, R5). Reemplaza el botón
// "🤖 Implementar" deshabilitado sin explicación: dice POR QUÉ está bloqueado
// con las condiciones reales que fallan y ofrece la salida.
function ImplementBlock({
  specId,
  isApproved,
  onGoApprove,
  onImplement
}: {
  specId: string;
  isApproved: boolean;
  onGoApprove: () => void;
  onImplement: () => void;
}) {
  const { t } = useT();
  const gate = useBuilderStore((s) => s.gate);
  const selectSpec = useBuilderStore((s) => s.selectSpec);

  const issues = gate?.specIssues[specId] ?? [];
  const unapprovedDeps = (gate?.dependencyWarnings ?? [])
    .filter((w) => w.dependent === specId)
    .map((w) => w.dependency);
  const blocked = !isApproved || issues.length > 0;

  if (!blocked) {
    return (
      <div className="flex flex-col gap-[9px] rounded-[9px] border border-primary/45 bg-[var(--primary-soft)] p-[13px_14px]">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <LockOpen className="size-[15px] text-primary" aria-hidden />
          {t("implement.newTitle")}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button className="h-[30px]" onClick={onImplement}>
            {t("sheet.implement.ready")}
          </Button>
          {unapprovedDeps.map((dep) => (
            <Button
              key={dep}
              variant="outline"
              className="h-[30px]"
              onClick={() => selectSpec(dep)}
            >
              {t("drawer.blocked.openDep", { id: dep.slice(0, 3) })}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // El texto se compone de las condiciones reales que fallan.
  const reasons: string[] = [t("drawer.blocked.rule")];
  if (!isApproved) reasons.push(t("drawer.blocked.pending"));
  for (const dep of unapprovedDeps) reasons.push(t("drawer.blocked.dep", { id: dep.slice(0, 3) }));

  return (
    <div className="flex flex-col gap-[9px] rounded-[9px] border border-[var(--amber)]/45 bg-[var(--amber-soft)] p-[13px_14px]">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Lock className="size-[15px] text-[var(--amber-text)]" aria-hidden />
        {t("drawer.blocked.title")}
      </span>
      <p className="m-0 text-[13.5px] leading-[1.55]">{reasons.join(" ")}</p>
      <div className="flex flex-wrap gap-2">
        <Button className="h-[30px]" onClick={onGoApprove}>
          {t("drawer.blocked.goApprove")}
        </Button>
        {unapprovedDeps.map((dep) => (
          <Button key={dep} variant="outline" className="h-[30px]" onClick={() => selectSpec(dep)}>
            {t("drawer.blocked.openDep", { id: dep.slice(0, 3) })}
          </Button>
        ))}
      </div>
    </div>
  );
}

// Puntaje (spec 028 → 030): grado como cifra grande + barra de 3px + notas.
function ScorePanel({ specId, specMarkdown }: { specId: string; specMarkdown: string }) {
  const { t } = useT();
  const specsVersion = useBuilderStore((s) => s.specsVersion);
  const cached = useBuilderStore((s) => s.scores[specId]);
  const [score, setScore] = useState<SpecScore | null>(cached ?? null);

  useEffect(() => {
    let cancelled = false;
    api
      .getSpecScore(specId)
      .then((s) => {
        if (!cancelled) setScore(s);
      })
      .catch(() => {
        // Keep the cached score; the next specsVersion bump retries.
      });
    return () => {
      cancelled = true;
    };
  }, [specId, specsVersion]);

  const ears = useMemo(() => {
    const criteria = parseSpecSections(specMarkdown).criteria;
    const results = criteria.map((text) => ({ text, ...lintEarsCriterion(text) }));
    return { total: results.length, ok: results.filter((r) => r.level === "ok").length, results };
  }, [specMarkdown]);

  const GRADE_TONE: Record<SpecScore["grade"], string> = {
    A: "text-[var(--primary-text)]",
    B: "text-[var(--blue)]",
    C: "text-[var(--amber-text)]",
    D: "text-[var(--destructive-text)]"
  };

  if (!score) return null;

  return (
    <div>
      <SectionHead>
        {t("drawer.score.label")}
        {ears.total > 0 ? (
          <span
            className={`ml-auto normal-case ${ears.ok === ears.total ? "text-[var(--primary-text)]" : "text-[var(--amber-text)]"}`}
            title={ears.results
              .filter((r) => r.level !== "ok")
              .flatMap((r) => r.hints)
              .join("\n")}
          >
            {t("drawer.score.ears", { clean: ears.ok, total: ears.total })}
          </span>
        ) : null}
      </SectionHead>
      <div className="flex items-center gap-3.5">
        <span
          className={`font-mono text-[26px] font-semibold tracking-[-0.02em] ${GRADE_TONE[score.grade]}`}
        >
          {score.grade}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between font-mono text-[11.5px] text-muted-foreground">
            <span className="tabular-nums">{score.score}/100</span>
            <span>{t("drawer.score.target", { n: SCORE_TARGET })}</span>
          </div>
          <div className="h-[3px] overflow-hidden rounded-[2px] bg-muted">
            <div
              className={`h-full rounded-[2px] transition-[width] duration-[250ms] ${
                score.score >= SCORE_TARGET ? "bg-primary" : "bg-[var(--amber)]"
              }`}
              style={{ width: `${score.score}%` }}
            />
          </div>
        </div>
      </div>
      {score.notes.length > 0 ? (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0 font-mono text-[13px] text-muted-foreground">
          {score.notes.map((note) => (
            <li key={note}>- {note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function AddTaskForm({
  specId,
  tasks,
  onAdded
}: {
  specId: string;
  tasks: TaskItem[];
  onAdded: (tasks: TaskItem[]) => void;
}) {
  const { t } = useT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ampliar con IA (spec 031, R4): each proposal line becomes one task,
  // appended through the same POST route as the manual form.
  const acceptTasks = async (proposal: string) => {
    const lines = proposal
      .split("\n")
      .map((line) => line.replace(/^\s*(?:[-*]\s*)?(?:\[[ xX]\]\s*)?/, "").trim())
      .filter(Boolean);
    let latest: TaskItem[] | null = null;
    for (const line of lines) {
      latest = (await api.addTask(specId, line)).tasks;
    }
    if (latest) onAdded(latest);
  };

  const submit = async () => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.addTask(specId, clean);
      setText("");
      onAdded(res.tasks);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <AiAssistButton
          kind="task"
          specId={specId}
          refId="tasks.md"
          currentText={tasks.map((task) => `- [${task.done ? "x" : " "}] ${task.text}`).join("\n")}
          onAccept={acceptTasks}
          compact
        />
        <input
          className={inputClass + " h-8 py-0"}
          value={text}
          placeholder={t("sheet.addTask.ph")}
          aria-label={t("sheet.addTask.ph")}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void submit();
          }}
        />
        <Button
          variant="outline"
          className="h-8 shrink-0"
          disabled={busy || !text.trim()}
          onClick={() => void submit()}
        >
          {busy ? t("sheet.addTask.adding") : t("sheet.addTask.btn")}
        </Button>
      </div>
      {error ? <p className="m-0 mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

// Approval tab (spec 010, R2 → 030): the 4 fields of the real block in spec.md.
function ApprovalPanel({
  specId,
  specMarkdown,
  onDone
}: {
  specId: string;
  specMarkdown: string;
  onDone: () => void;
}) {
  const { t } = useT();
  const approval = useMemo(() => parseApproval(specMarkdown), [specMarkdown]);
  const isApproved = isApprovedStatusText(approval.status);
  const [approver, setApprover] = useState(approval.approver);
  const [evidence, setEvidence] = useState(approval.evidence);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Re-prime when another spec is selected or the doc refreshes on disk.
  useEffect(() => {
    setApprover(approval.approver);
    setEvidence(approval.evidence);
    setError(null);
    setDone(false);
  }, [specId, approval.approver, approval.evidence]);

  const submit = async () => {
    if (!approver.trim() || busy) return;
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await api.approveSpec(specId, approver.trim(), evidence.trim() || undefined);
      setDone(true);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  // Consent is a SECOND act. Shown only when the gate says this spec is
  // missing it, so it never becomes a button people click by reflex.
  const gateIssues = useBuilderStore((s) => s.gate?.specIssues[specId]);
  const needsConsent = (gateIssues ?? []).some(
    (issue) => issue.code === "missing-spec-consent" || issue.code === "missing-consent-log"
  );
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentDone, setConsentDone] = useState(false);

  const giveConsent = async () => {
    if (consentBusy) return;
    setConsentBusy(true);
    setError(null);
    try {
      await api.recordConsent(specId, t("consent.summary", { spec: specId }));
      setConsentDone(true);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setConsentBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);
  const label =
    "font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase";

  return (
    <div className="flex flex-col gap-3.5 pt-3">
      <p className="m-0 text-[13px] leading-[1.55] text-muted-foreground">{t("approval.intro")}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <span className={label}>{t("approval.status")}</span>
          <span className={`badge-tone ${isApproved ? "ok" : "pending"}`}>
            {(isApproved ? t("status.approved") : t("status.pending")).toLowerCase()}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className={label}>{t("approval.date")}</span>
          <span className="flex items-baseline gap-2 font-mono text-sm">
            {approval.date || today}
            <span className="text-[11.5px] text-muted-foreground">{t("approval.dateHint")}</span>
          </span>
        </div>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={label}>{t("approval.approver")}</span>
        <input
          className={inputClass + " h-[34px] py-0"}
          value={approver}
          placeholder={t("approval.byPlaceholder")}
          onChange={(e) => setApprover(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={label}>{t("approval.evidence")}</span>
        <textarea
          className={inputClass + " resize-y"}
          rows={3}
          value={evidence}
          placeholder={t("approval.evidencePlaceholder")}
          onChange={(e) => setEvidence(e.target.value)}
        />
        <span className="text-[12.5px] text-muted-foreground">{t("approval.evidenceHint")}</span>
      </label>
      {error ? (
        <p className="m-0 rounded-[7px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {done ? (
        <p className="m-0 rounded-[7px] bg-[var(--primary-soft)] px-3 py-2 text-sm text-primary">
          ✓ {t("approval.done")}
        </p>
      ) : null}
      <Button className="h-9 w-full" onClick={() => void submit()} disabled={busy || !approver.trim()}>
        {busy ? t("approval.busy") : isApproved ? t("approval.update") : t("approval.submit")}
      </Button>

      {needsConsent && !consentDone ? (
        <div className="overflow-hidden rounded-[9px] border">
          <div className="flex items-center gap-2 border-b bg-[var(--amber-soft)] px-3 py-1.5">
            <span className="size-[7px] rounded-[2px] bg-[var(--amber)]" aria-hidden />
            <span className="font-mono text-[10.5px] tracking-[0.16em] text-[var(--amber-text)] uppercase">
              {t("approval.consent.tag")}
            </span>
          </div>
          <div className="flex flex-col gap-2.5 p-3">
            <p className="m-0 text-[13px] leading-[1.55] text-muted-foreground">
              {t("consent.why")}
            </p>
            <Button variant="outline" onClick={() => void giveConsent()} disabled={consentBusy}>
              {consentBusy ? t("consent.busy") : t("consent.submit")}
            </Button>
          </div>
        </div>
      ) : null}
      {consentDone ? (
        <p className="m-0 rounded-[7px] bg-[var(--primary-soft)] px-3 py-2 text-sm text-primary">
          ✓ {t("consent.done")}
        </p>
      ) : null}
    </div>
  );
}

// Relations tab (spec 010, R3 → 030): espina de color por tipo, relación en
// mono debajo del nombre, y el aviso de dependencia explicado en el flujo.
function RelationsPanel({ specId }: { specId: string }) {
  const { t, lang } = useT();
  const nodes = useBuilderStore((s) => s.nodes);
  const edges = useBuilderStore((s) => s.edges);
  const gate = useBuilderStore((s) => s.gate);
  const updateEdgeLabel = useBuilderStore((s) => s.updateEdgeLabel);
  const removeEdge = useBuilderStore((s) => s.removeEdge);

  const nodeId = nodes.find((n) => n.type === "spec" && n.data.specId === specId)?.id;
  const incoming = edges.filter((e) => e.target === nodeId);
  const outgoing = edges.filter((e) => e.source === nodeId);

  const nodeLabel = (id: string): string => {
    const node = nodes.find((n) => n.id === id) as AppNode | undefined;
    if (!node) return id;
    if (node.type === "spec") return node.data.specId;
    const firstLine = (node.data.text ?? "").split("\n")[0].trim();
    return firstLine || t("note.empty");
  };

  const SPINE: Record<EdgeKind, string> = {
    related: "bg-[var(--blue)]",
    depends: "bg-[var(--amber)]",
    blocks: "bg-destructive",
    contains: "bg-[var(--gray-edge)]"
  };

  const changeKind = (edgeId: string, next: EdgeKind) => {
    updateEdgeLabel(edgeId, next === "related" ? "" : EDGE_KIND_LABELS[next][lang]);
  };

  const renderRow = (edge: (typeof edges)[number], otherEnd: string) => {
    const kind = edgeKind(edge.data?.label);
    const warned = (gate?.dependencyWarnings ?? []).some((w) => w.edgeId === edge.id);
    return (
      <li
        key={edge.id}
        className={`flex flex-col gap-1.5 rounded-lg border p-[9px_11px] ${
          warned ? "border-[var(--amber)]/45 bg-[var(--amber-soft)]" : ""
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-[3px] self-stretch rounded-[2px] ${SPINE[kind]}`} aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-medium" title={otherEnd}>
              {otherEnd}
            </span>
            <span className="block font-mono text-[11px] text-muted-foreground">
              {t(`edge.kind.${kind}`)}
            </span>
          </span>
          <Select value={kind} onValueChange={(value) => changeKind(edge.id, value as EdgeKind)}>
            <SelectTrigger size="sm" className="w-32 shrink-0" aria-label={t("relations.typeAria")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["contains", "depends", "blocks", "related"] as const).map((option) => (
                <SelectItem key={option} value={option}>
                  {t(`edge.kind.${option}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
            aria-label={t("relations.delete")}
            title={t("relations.delete")}
            onClick={() => removeEdge(edge.id)}
          >
            <X className="size-[13px]" />
          </Button>
        </div>
        {warned ? (
          <p className="m-0 text-[12.5px] leading-[1.5] text-[var(--amber-text)]">
            {t("relations.warnBody", { id: specId.slice(0, 3) })}
          </p>
        ) : null}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3 pt-3">
      <p className="m-0 text-[13px] leading-[1.55] text-muted-foreground">{t("relations.intro")}</p>
      {incoming.length === 0 && outgoing.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{t("relations.none")}</p>
      ) : (
        <>
          {incoming.length > 0 ? (
            <>
              <SectionHead>
                {t("relations.incoming")}
                <span className="ml-auto normal-case">{incoming.length}</span>
              </SectionHead>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {incoming.map((edge) => renderRow(edge, nodeLabel(edge.source)))}
              </ul>
            </>
          ) : null}
          {outgoing.length > 0 ? (
            <>
              <SectionHead>
                {t("relations.outgoing")}
                <span className="ml-auto normal-case">{outgoing.length}</span>
              </SectionHead>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {outgoing.map((edge) => renderRow(edge, nodeLabel(edge.target)))}
              </ul>
            </>
          ) : null}
        </>
      )}
      <p className="m-0 border-t pt-3 text-[12.5px] leading-[1.6] text-muted-foreground">
        <strong>{t("edge.kind.contains")}</strong> · <strong>{t("edge.kind.depends")}</strong> ·{" "}
        <strong>{t("edge.kind.blocks")}</strong> · <strong>{t("edge.kind.related")}</strong> —{" "}
        {t("help.relations.body")}
      </p>
    </div>
  );
}

// Tasks -> GitHub issues (spec 009, R3 → 030): el botón dice cuántos issues
// creará, con el icono de GitHub en lugar de 🐙.
function IssuesPanel({ specId, pendingCount }: { specId: string; pendingCount: number }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateIssuesResult | null>(null);

  useEffect(() => {
    setError(null);
    setResult(null);
  }, [specId]);

  const create = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.createIssues(specId));
    } catch (err) {
      setError(errorMessage(err));
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const noPending = pendingCount === 0;

  return (
    <div className="mt-3">
      <Button
        variant="outline"
        className="w-full"
        disabled={busy || noPending}
        title={noPending ? t("sheet.issues.noPending") : t("sheet.issues.tooltip")}
        onClick={() => void create()}
      >
        <CircleDot className="size-3.5" aria-hidden />
        {busy ? t("sheet.issues.creating") : t("drawer.issues.cta", { n: pendingCount })}
      </Button>
      {error ? (
        <div className="mt-2 rounded-[7px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
          <p className="m-0">{error}</p>
          <p className="m-0 mt-1 text-xs opacity-85">{t("sheet.issues.hint")}</p>
        </div>
      ) : null}
      {result ? (
        <div className="mt-2 rounded-[7px] border bg-muted/50 px-3 py-2.5">
          <p className="m-0 mb-1.5 text-xs font-semibold">
            <code>{result.repo}</code> ·{" "}
            {t("sheet.issues.summary", {
              created: result.created,
              skipped: result.skipped,
              failed: result.failed
            })}
          </p>
          {result.results.length === 0 ? (
            <p className="m-0 text-xs text-muted-foreground">{t("sheet.issues.noPending")}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0 text-xs">
              {result.results.map((row) => (
                <li
                  key={row.line}
                  className={
                    row.status === "failed"
                      ? "text-destructive"
                      : row.status === "skipped"
                        ? "text-muted-foreground"
                        : ""
                  }
                >
                  {row.url ? (
                    <a className="text-[var(--blue)]" href={row.url} target="_blank" rel="noreferrer">
                      {row.title}
                    </a>
                  ) : (
                    row.title
                  )}
                  {row.error ? <span className="text-[0.72rem]"> — {row.error}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

const TAB_TRIGGER =
  "h-9 rounded-none border-0 border-b-2 border-b-transparent bg-transparent px-3 font-mono text-xs font-semibold tracking-[0.04em] lowercase text-muted-foreground shadow-none transition-colors data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function SpecDrawer() {
  const { t } = useT();
  const specId = useBuilderStore((s) => s.selectedSpecId);
  const summary = useBuilderStore((s) => (s.selectedSpecId ? s.specs[s.selectedSpecId] : undefined));
  const specsVersion = useBuilderStore((s) => s.specsVersion);
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const applyTasks = useBuilderStore((s) => s.applyTasks);
  const refreshSpecs = useBuilderStore((s) => s.refreshSpecs);
  const refreshGate = useBuilderStore((s) => s.refreshGate);
  const setAiPrefill = useBuilderStore((s) => s.setAiPrefill);

  const [tab, setTab] = useState("summary");
  // Spec 022: folding the tasks list is a builder-wide preference.
  const [tasksCollapsed, setTasksCollapsed] = useState(readTasksCollapsed);
  const [detail, setDetail] = useState<SpecDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [implementOpen, setImplementOpen] = useState(false);
  const [pendingLine, setPendingLine] = useState<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  pendingRef.current = pendingLine;

  useEffect(() => {
    // Land on the panel the caller asked for (the kanban sends "approval"),
    // then forget it so a later selection defaults to the summary again.
    const requested = useBuilderStore.getState().requestedDrawerTab;
    setTab(requested ?? "summary");
    if (requested) useBuilderStore.setState({ requestedDrawerTab: null });
    setImplementOpen(false);
    if (!specId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    api
      .getSpec(specId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [specId]);

  // Live sync: when spec documents change on disk, silently re-fetch the open
  // spec so the sheet reflects the disk without a loading flash.
  useEffect(() => {
    if (!specId || specsVersion === 0) return;
    if (pendingRef.current !== null) return;
    let cancelled = false;
    api
      .getSpec(specId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        // Keep showing the last good detail; the next change will retry.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specsVersion, specId]);

  if (!specId) return null;

  const toggle = async (task: TaskItem) => {
    if (!detail || pendingLine !== null) return;
    setPendingLine(task.line);
    setError(null);
    try {
      const res = await api.putTask(specId, task.line, !task.done);
      setDetail({ ...detail, tasks: res.tasks });
      applyTasks(specId, res.tasks);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPendingLine(null);
    }
  };

  const refetchDetail = () => {
    api
      .getSpec(specId)
      .then(setDetail)
      .catch(() => {
        // The SSE change event will retry shortly.
      });
  };

  const handleTasksChanged = (tasks: TaskItem[]) => {
    if (detail) setDetail({ ...detail, tasks });
    applyTasks(specId, tasks);
  };

  const handleApproved = () => {
    refetchDetail();
    void refreshSpecs();
    void refreshGate();
  };

  const handleSectionsSaved = () => {
    refetchDetail();
    void refreshGate();
  };

  // Server-computed tone (sdd-core specTone): the single rule shared with the
  // graph, the kanban and the dashboard. Never re-derive it from the string.
  const tone: SpecTone = summary?.tone ?? "pending";
  const isApproved = tone !== "pending";
  const stateWord = t(
    tone === "done" ? "status.done" : tone === "ok" ? "status.approved" : "status.pending"
  ).toLowerCase();
  const excerpt = detail ? detail.docs.spec.split("\n").slice(0, EXCERPT_LINES).join("\n") : "";
  const doneCount = detail ? detail.tasks.filter((task) => task.done).length : 0;
  const pendingCount = detail ? detail.tasks.length - doneCount : 0;
  const match = specId.match(/^(\d{3})-(.+)$/);
  const title = summary?.title || (match ? match[2].replace(/-/g, " ") : specId);
  // Ruta relativa al workspace: el prototipo muestra `specs/NNN-…/`, no la
  // ruta absoluta completa.
  const rawDir = summary?.dir ?? `specs/${specId}`;
  const relDir =
    projectRoot && rawDir.startsWith(projectRoot)
      ? rawDir.slice(projectRoot.length).replace(/^\//, "")
      : rawDir;

  return (
    <Sheet modal={false} open onOpenChange={(open) => !open && selectSpec(null)}>
      <SheetContent
        side="right"
        // El drawer vive entre la chrome (46+34px) y la barra de compuerta
        // (30px), que persisten en todas las vistas (spec 030).
        className="!top-[80px] !bottom-[30px] h-auto w-full gap-0 shadow-[var(--shadow-drawer)] sm:max-w-[560px] [&>button:last-child]:hidden"
        aria-label={t("sheet.aria", { id: specId })}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="gap-1 border-b p-[14px_16px_12px]">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-semibold tracking-[0.06em] text-muted-foreground">
              {match?.[1] ?? specId}
            </span>
            <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] ${TONE_TEXT[tone]}`}>
              <span
                className={`size-1.5 rounded-full ${tone === "pending" ? "bg-[var(--amber)]" : "bg-primary"}`}
                aria-hidden
              />
              {stateWord}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="ml-auto size-7"
              aria-label={t("common.close")}
              onClick={() => selectSpec(null)}
            >
              <X className="size-[15px]" />
            </Button>
          </div>
          <SheetTitle className="text-[19px] leading-tight font-semibold tracking-[-0.015em]">
            {title}
          </SheetTitle>
          <SheetDescription className="truncate font-mono text-[11.5px] text-muted-foreground" title={rawDir}>
            {relDir}/
          </SheetDescription>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0">
          <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0 px-4">
            <TabsTrigger className={TAB_TRIGGER} value="summary">
              {t("sheet.tab.summary")}
            </TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER} value="edit">
              {t("sheet.tab.edit")}
            </TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER} value="approval">
              {t("sheet.tab.approval")}
            </TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER} value="review">
              {t("sheet.tab.review")}
            </TabsTrigger>
            <TabsTrigger className={TAB_TRIGGER} value="relations">
              {t("sheet.tab.relations")}
            </TabsTrigger>
          </TabsList>
          {loading ? (
            <p className="px-4 pt-3 text-sm text-muted-foreground">{t("sheet.loading")}</p>
          ) : null}
          {error ? (
            <p className="mx-4 mt-3 rounded-[7px] bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {detail ? (
            <>
              <TabsContent value="summary" className="nowheel min-h-0 flex-1 px-4 pb-4">
                <ScrollArea className="h-full pr-3">
                  <div className="flex flex-col pt-3 pb-2">
                    <ImplementBlock
                      specId={specId}
                      isApproved={isApproved}
                      onGoApprove={() => setTab("approval")}
                      onImplement={() => setImplementOpen(true)}
                    />
                    {/* Spec 025: drift of the governed code vs. approval. */}
                    {summary?.drift?.state === "drifted" && summary.drift.commits.length > 0 ? (
                      <div className="mt-3 rounded-[9px] border border-[var(--amber)]/45 bg-[var(--amber-soft)] px-3 py-2.5">
                        <h3 className="m-0 mb-1.5 font-mono text-[10.5px] tracking-[0.16em] uppercase text-[var(--amber-text)]">
                          {t("status.driftTitle")}
                        </h3>
                        <p className="m-0 mb-2 text-xs text-muted-foreground">{t("status.drift")}</p>
                        <ul className="m-0 flex list-none flex-col gap-1 p-0">
                          {summary.drift.commits.map((c) => (
                            <li key={c.hash} className="flex gap-2 font-mono text-xs">
                              <code className="flex-none bg-transparent p-0 text-[var(--amber-text)]">
                                {c.hash}
                              </code>
                              <span className="text-muted-foreground">{c.date.slice(0, 10)}</span>
                              <span className="truncate" title={c.subject}>
                                {c.subject}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <ScorePanel specId={specId} specMarkdown={detail.docs.spec} />
                    <SectionHead>
                      tasks.md
                      <span className="ml-auto flex items-center gap-2 normal-case">
                        <span className="tabular-nums">
                          {doneCount}/{detail.tasks.length}
                        </span>
                        {detail.tasks.length > 0 ? (
                          <button
                            type="button"
                            className="cursor-pointer text-muted-foreground lowercase underline-offset-2 hover:underline"
                            onClick={() => {
                              const collapsed = !tasksCollapsed;
                              setTasksCollapsed(collapsed);
                              writeTasksCollapsed(collapsed);
                            }}
                          >
                            {tasksCollapsed ? t("drawer.tasks.expand") : t("drawer.tasks.collapse")}
                          </button>
                        ) : null}
                      </span>
                    </SectionHead>
                    {detail.tasks.length === 0 ? (
                      <div className="rounded-[7px] border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                        <p className="m-0 font-medium">{t("sheet.noTasks")}</p>
                        <p className="m-0 mt-1 text-xs">{t("sheet.noTasks.hint")}</p>
                      </div>
                    ) : tasksCollapsed ? null : (
                      <ul className="m-0 flex list-none flex-col p-0">
                        {detail.tasks.map((task) => (
                          <li key={task.line} className="border-b border-[var(--hairline)] last:border-b-0">
                            <label className="flex cursor-pointer items-start gap-2.5 px-0.5 py-[7px] text-sm hover:bg-accent/50">
                              <input
                                type="checkbox"
                                className="mt-0.5 size-[15px] shrink-0 accent-[var(--primary)]"
                                checked={task.done}
                                disabled={pendingLine !== null}
                                onChange={() => void toggle(task)}
                              />
                              <span className={task.done ? "text-muted-foreground line-through" : ""}>
                                {task.text}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                    <AddTaskForm specId={specId} tasks={detail.tasks} onAdded={handleTasksChanged} />
                    <IssuesPanel key={specId} specId={specId} pendingCount={pendingCount} />
                    <SectionHead>
                      spec.md
                      <span className="ml-auto normal-case">
                        {t("drawer.spec.excerpt", { n: EXCERPT_LINES })}
                      </span>
                    </SectionHead>
                    <pre className="m-0 max-h-[220px] overflow-auto rounded-lg border bg-muted p-[12px_14px] font-mono text-xs leading-[1.65] break-words whitespace-pre-wrap">
                      {excerpt}
                    </pre>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="edit" className="nowheel min-h-0 flex-1">
                <SectionEditor
                  specId={specId}
                  specMarkdown={detail.docs.spec}
                  onSaved={handleSectionsSaved}
                />
              </TabsContent>
              <TabsContent value="approval" className="nowheel min-h-0 flex-1 px-4 pb-4">
                <ScrollArea className="h-full pr-3">
                  <ApprovalPanel specId={specId} specMarkdown={detail.docs.spec} onDone={handleApproved} />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="review" className="nowheel min-h-0 flex-1 px-4 pb-4">
                <ScrollArea className="h-full pr-3">
                  <ReviewPanel
                    specId={specId}
                    specMarkdown={detail.docs.spec}
                    onFix={(section, instruction) => {
                      // R9: solo foco e indicación. La escritura sigue siendo
                      // el diff que la persona acepta en esa sección.
                      setAiPrefill({ specId, refId: section, instruction });
                      setTab("edit");
                    }}
                  />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="relations" className="nowheel min-h-0 flex-1 px-4 pb-4">
                <ScrollArea className="h-full pr-3">
                  <RelationsPanel specId={specId} />
                </ScrollArea>
              </TabsContent>
            </>
          ) : null}
        </Tabs>
        {implementOpen && isApproved ? (
          <ImplementModal
            specId={specId}
            specDir={summary?.dir ?? `specs/${specId}`}
            projectRoot={projectRoot}
            onClose={() => setImplementOpen(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
