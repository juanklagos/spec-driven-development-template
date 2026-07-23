// Spec detail sheet (spec 007 drawer → spec 010 R2/R3 Sheet): a wide
// non-modal Sheet (the canvas stays interactive) with four tabs:
//   - Summary: approval badge, implement kickoff, live tasks, GitHub issues,
//     spec.md excerpt.
//   - Edit spec: one form per template section (SectionEditor, accordion).
//   - Approval: the real approval block as a form (status read-only, date,
//     approver, evidence) writing through POST /api/spec/:id/approve.
//   - Relations: incoming/outgoing purposeful connections of this spec with
//     type change + delete (edges live in board.canvas).

import { useEffect, useMemo, useRef, useState } from "react";
import { api, errorMessage } from "../api";
import { edgeKind, EDGE_KIND_LABELS, type EdgeKind } from "../convert";
import { useT } from "../i18n";
import { isApprovedStatusText, parseApproval } from "../sections";
import { readTasksCollapsed, useBuilderStore, writeTasksCollapsed } from "../store";
import { HelpHint } from "./HelpHint";
import { ImplementModal } from "./ImplementModal";
import { EDGE_KIND_ICON } from "./LabeledEdge";
import { SectionEditor } from "./SectionEditor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AppNode, CreateIssuesResult, SpecDetail, TaskItem } from "../types";

const EXCERPT_LINES = 25;

const inputClass =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40";

// Approval tab (spec 010, R2): the 4 fields of the real block in spec.md.
// Status and date are read-only (approveSpec stamps `Aprobado` + today);
// approver and evidence are editable and written surgically.
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

  // Consent is a SECOND act, and until now the builder could not perform it:
  // there was no route. You approved here, the card went green, and the gate
  // still refused — repairable only from a terminal, which is a dead end for
  // the audience this canvas exists for.
  //
  // Shown only when the gate says this spec is missing it, so it never becomes
  // a button people click by reflex.
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

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="m-0 text-xs text-muted-foreground">{t("approval.note")}</p>
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t("approval.status")}
          <HelpHint topic="approval" guide="flow" />
        </span>
        <span>
          <Badge
            variant="outline"
            className={
              isApproved
                ? "border-primary bg-[var(--primary-soft)] text-primary"
                : "border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)]"
            }
          >
            {isApproved ? t("status.approved") : t("status.pending")}
          </Badge>
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t("approval.date")}
        </span>
        <input
          className={inputClass + " opacity-70"}
          value={approval.date || today}
          readOnly
          title={t("approval.dateToday")}
        />
        <p className="m-0 text-xs text-muted-foreground">{t("approval.dateToday")}</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t("approval.approver")}
        </span>
        <input
          className={inputClass}
          value={approver}
          placeholder={t("approval.approverPh")}
          onChange={(e) => setApprover(e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
          {t("approval.evidence")}
        </span>
        <textarea
          className={inputClass + " resize-y"}
          rows={3}
          value={evidence}
          placeholder={t("approval.evidencePh")}
          onChange={(e) => setEvidence(e.target.value)}
        />
      </label>
      {error ? (
        <p className="m-0 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
          ⚠ {error}
        </p>
      ) : null}
      {done ? (
        <p className="m-0 rounded-md bg-[var(--primary-soft)] px-3 py-2 text-sm text-primary">
          ✓ {t("approval.done")}
        </p>
      ) : null}
      {/* Short "why" on an important, file-writing action (teaching layer). */}
      <p className="m-0 text-xs text-muted-foreground">💡 {t("approval.why")}</p>
      <Button onClick={() => void submit()} disabled={busy || !approver.trim()}>
        {busy ? t("approval.busy") : isApproved ? t("approval.update") : t("approval.submit")}
      </Button>

      {needsConsent && !consentDone ? (
        <div className="flex flex-col gap-2 rounded-md border border-border bg-[var(--muted)] px-3 py-2.5">
          <span className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
            {t("consent.title")}
          </span>
          <p className="m-0 text-xs text-muted-foreground">{t("consent.why")}</p>
          <Button variant="secondary" onClick={() => void giveConsent()} disabled={consentBusy}>
            {consentBusy ? t("consent.busy") : t("consent.submit")}
          </Button>
        </div>
      ) : null}
      {consentDone ? (
        <p className="m-0 rounded-md bg-[var(--primary-soft)] px-3 py-2 text-sm text-primary">
          ✓ {t("consent.done")}
        </p>
      ) : null}
    </div>
  );
}

// Relations tab (spec 010, R3): every purposeful connection touching this
// spec's canvas node, grouped by direction, with type change + delete.
function RelationsPanel({ specId }: { specId: string }) {
  const { t, lang } = useT();
  const nodes = useBuilderStore((s) => s.nodes);
  const edges = useBuilderStore((s) => s.edges);
  const updateEdgeLabel = useBuilderStore((s) => s.updateEdgeLabel);
  const removeEdge = useBuilderStore((s) => s.removeEdge);

  const nodeId = nodes.find((n) => n.type === "spec" && n.data.specId === specId)?.id;
  const incoming = edges.filter((e) => e.target === nodeId);
  const outgoing = edges.filter((e) => e.source === nodeId);

  const nodeLabel = (id: string): string => {
    const node = nodes.find((n) => n.id === id) as AppNode | undefined;
    if (!node) return id;
    if (node.type === "spec") return `📋 ${node.data.specId}`;
    const firstLine = (node.data.text ?? "").split("\n")[0].trim();
    return firstLine || t("note.empty");
  };

  const kindOf = (label: string | undefined): EdgeKind => edgeKind(label);

  const changeKind = (edgeId: string, next: EdgeKind) => {
    updateEdgeLabel(edgeId, next === "related" ? "" : EDGE_KIND_LABELS[next][lang]);
  };

  const renderRow = (edge: (typeof edges)[number], otherEnd: string) => {
    const kind = kindOf(edge.data?.label);
    const Icon = EDGE_KIND_ICON[kind];
    return (
      <li key={edge.id} className="flex items-center gap-2 rounded-md border bg-muted/40 px-2.5 py-2">
        <span className={`edge-label kind-${kind} !static !flex shrink-0 !shadow-none`}>
          <Icon size={12} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm" title={otherEnd}>
          {otherEnd}
        </span>
        <Select value={kind} onValueChange={(value) => changeKind(edge.id, value as EdgeKind)}>
          <SelectTrigger size="sm" className="w-36 shrink-0" aria-label={t("relations.typeAria")}>
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
          className="size-7 shrink-0 text-destructive"
          aria-label={t("relations.delete")}
          title={t("relations.delete")}
          onClick={() => removeEdge(edge.id)}
        >
          ✕
        </Button>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-3 pt-2">
      <p className="m-0 flex items-start gap-1.5 text-xs text-muted-foreground">
        <span className="min-w-0 flex-1">{t("relations.note")}</span>
        <HelpHint topic="relations" guide="builder" />
      </p>
      {incoming.length === 0 && outgoing.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">{t("relations.none")}</p>
      ) : (
        <>
          {incoming.length > 0 ? (
            <>
              <h3 className="m-0 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                → {t("relations.incoming")} ({incoming.length})
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {incoming.map((edge) => renderRow(edge, nodeLabel(edge.source)))}
              </ul>
            </>
          ) : null}
          {outgoing.length > 0 ? (
            <>
              <h3 className="m-0 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {t("relations.outgoing")} ({outgoing.length}) →
              </h3>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {outgoing.map((edge) => renderRow(edge, nodeLabel(edge.target)))}
              </ul>
            </>
          ) : null}
        </>
      )}
    </div>
  );
}

// Tasks -> GitHub issues (spec 009, R3): one gh-CLI issue per pending task,
// idempotent by title. Precondition failures (no git repo/remote, gh missing
// or unauthenticated) arrive as machine codes and are localized by the api
// client, so what lands here is already single-language (spec 010, R1).
function IssuesPanel({ specId, pendingCount }: { specId: string; pendingCount: number }) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateIssuesResult | null>(null);

  // Selecting another spec resets the panel (the parent remounts us via key,
  // but be defensive against future refactors).
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

  const STATUS_ICON = { created: "✅", skipped: "⏭", failed: "⚠" } as const;
  const noPending = pendingCount === 0;

  return (
    <div className="mt-1">
      <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        {t("sheet.issues")}
        <HelpHint topic="issues" guide="builder" />
      </h3>
      <p className="mb-2 text-xs text-muted-foreground">💡 {t("sheet.issues.why")}</p>
      <Button
        variant="outline"
        className="w-full"
        disabled={busy || noPending}
        title={noPending ? t("sheet.issues.noPending") : t("sheet.issues.tooltip")}
        onClick={() => void create()}
      >
        🐙 {busy ? t("sheet.issues.creating") : t("sheet.issues.btn")}
      </Button>
      {error ? (
        <div className="mt-2 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
          <p className="m-0">⚠ {error}</p>
          <p className="m-0 mt-1 text-xs opacity-85">{t("sheet.issues.hint")}</p>
        </div>
      ) : null}
      {result ? (
        <div className="mt-2 rounded-md border bg-muted/50 px-3 py-2.5">
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
                  <span aria-hidden>{STATUS_ICON[row.status]}</span>{" "}
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

  const [tab, setTab] = useState("summary");
  // Spec 022: folding the tasks list is a builder-wide preference, read once on
  // mount so it already applies to the first spec opened after a reload.
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

  // Live sync: when spec documents change on disk (specsVersion bump from the
  // SSE watcher), silently re-fetch the open spec so the sheet reflects the
  // disk without a loading flash. Skipped while a checkbox toggle is in
  // flight — that PUT already returns the fresh tasks.
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
  // canvas, the kanban and the dashboard. Never re-derive it from the string.
  const isApproved = summary ? summary.tone !== "pending" : false;
  const excerpt = detail ? detail.docs.spec.split("\n").slice(0, EXCERPT_LINES).join("\n") : "";
  // Derived from `detail.tasks`, which every toggle refreshes (see `toggle`),
  // so the folded header's count moves without any extra state.
  const doneCount = detail ? detail.tasks.filter((task) => task.done).length : 0;
  const pendingCount = detail ? detail.tasks.length - doneCount : 0;

  return (
    <Sheet modal={false} open onOpenChange={(open) => !open && selectSpec(null)}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-[540px]"
        aria-label={t("sheet.aria", { id: specId })}
        onInteractOutside={(e) => e.preventDefault()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="pb-2">
          <SheetTitle>📋 {specId}</SheetTitle>
          {summary ? (
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isApproved
                    ? "border-primary bg-[var(--primary-soft)] text-primary"
                    : "border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)]"
                }
              >
                {summary.status}
              </Badge>
              <HelpHint topic="approval" guide="flow" />
              <code>{summary.dir}</code>
            </SheetDescription>
          ) : null}
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="min-h-0 flex-1 gap-0 px-4 pb-4">
          <TabsList className="w-full">
            <TabsTrigger value="summary">{t("sheet.tab.summary")}</TabsTrigger>
            <TabsTrigger value="edit">✏️ {t("sheet.tab.edit")}</TabsTrigger>
            <TabsTrigger value="approval">{t("sheet.tab.approval")}</TabsTrigger>
            <TabsTrigger value="relations">{t("sheet.tab.relations")}</TabsTrigger>
          </TabsList>
          {loading ? <p className="px-1 pt-3 text-sm text-muted-foreground">{t("sheet.loading")}</p> : null}
          {error ? (
            <p className="mx-1 mt-3 rounded-md bg-[var(--danger-soft)] px-3 py-2 text-sm text-destructive">
              ⚠ {error}
            </p>
          ) : null}
          {detail ? (
            <>
              <TabsContent value="summary" className="nowheel min-h-0 flex-1">
                <ScrollArea className="h-full pr-3">
                  <div className="flex flex-col pt-3 pb-2">
                    {/* Copy-first implement kickoff (spec 008, R2): hard stop while not approved. */}
                    <span title={isApproved ? undefined : t("sheet.hardStop")}>
                      <Button
                        variant={isApproved ? "default" : "outline"}
                        className="w-full"
                        disabled={!isApproved}
                        title={isApproved ? t("sheet.implement.ready") : t("sheet.hardStop")}
                        onClick={() => setImplementOpen(true)}
                      >
                        {t("sheet.implement")}
                      </Button>
                    </span>
                    {/* Spec 025: drift of the governed code vs. approval. Only the
                        actionable "drifted" state gets a panel; the offending
                        commits are the evidence. */}
                    {summary?.drift?.state === "drifted" && summary.drift.commits.length > 0 ? (
                      <div className="mt-3 border border-[var(--amber,#ca8a04)] bg-[var(--amber-soft,rgba(202,138,4,0.12))] px-3 py-2.5">
                        <h3 className="m-0 mb-1.5 flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase text-[var(--amber,#ca8a04)]">
                          🔀 {t("status.driftTitle")}
                        </h3>
                        <p className="m-0 mb-2 text-xs text-muted-foreground">{t("status.drift")}</p>
                        <ul className="m-0 flex list-none flex-col gap-1 p-0">
                          {summary.drift.commits.map((c) => (
                            <li key={c.hash} className="flex gap-2 text-xs">
                              <code className="flex-none text-[var(--amber,#ca8a04)]">{c.hash}</code>
                              <span className="text-muted-foreground">{c.date.slice(0, 10)}</span>
                              <span className="truncate" title={c.subject}>{c.subject}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {detail.tasks.length === 0 ? (
                      <>
                        <h3 className="mt-4 mb-2 flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                          {t("sheet.tasks")}
                          <HelpHint topic="tasks" guide="builder" />
                        </h3>
                        {/* Educational empty state: what it means + the next action.
                            Nothing to fold here, so it keeps no fold control. */}
                        <div className="rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                          <p className="m-0 font-medium">{t("sheet.noTasks")}</p>
                          <p className="m-0 mt-1 text-xs">{t("sheet.noTasks.hint")}</p>
                        </div>
                      </>
                    ) : (
                      // Spec 022: the tasks list is the only section long enough to
                      // push the issues panel and the excerpt out of reach, so it folds.
                      <Accordion
                        type="single"
                        collapsible
                        value={tasksCollapsed ? "" : "tasks"}
                        onValueChange={(value) => {
                          const collapsed = value !== "tasks";
                          setTasksCollapsed(collapsed);
                          writeTasksCollapsed(collapsed);
                        }}
                      >
                        <AccordionItem value="tasks" className="border-b-0">
                          {/* The count sits outside the trigger on purpose: folding must
                              not hide how much it folded away, and the HelpHint popover
                              is a button, which cannot nest inside the trigger button. */}
                          <div className="mt-4 flex items-center gap-1.5">
                            <AccordionTrigger className="flex-none items-center gap-1.5 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase hover:no-underline">
                              {t("sheet.tasks")}
                            </AccordionTrigger>
                            <HelpHint topic="tasks" guide="builder" />
                            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                              {t("sheet.tasks.count", { done: doneCount, total: detail.tasks.length })}
                            </span>
                          </div>
                          <AccordionContent className="pt-0 pb-0">
                            <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                              {detail.tasks.map((task) => (
                                <li key={task.line}>
                                  <label className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-accent">
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
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                    <IssuesPanel key={specId} specId={specId} pendingCount={pendingCount} />
                    <Separator className="my-4" />
                    <h3 className="m-0 mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                      {t("sheet.excerpt")}
                    </h3>
                    <pre className="m-0 max-h-64 overflow-auto rounded-md border bg-muted/50 px-3 py-2.5 text-xs leading-relaxed break-words whitespace-pre-wrap">
                      {excerpt}
                    </pre>
                    <p className="mt-2 mb-0 text-xs text-muted-foreground">{t("sheet.excerptNote")}</p>
                  </div>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="edit" className="nowheel min-h-0 flex-1">
                <ScrollArea className="h-full pr-3">
                  <SectionEditor specId={specId} specMarkdown={detail.docs.spec} onSaved={handleSectionsSaved} />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="approval" className="nowheel min-h-0 flex-1">
                <ScrollArea className="h-full pr-3">
                  <ApprovalPanel specId={specId} specMarkdown={detail.docs.spec} onDone={handleApproved} />
                </ScrollArea>
              </TabsContent>
              <TabsContent value="relations" className="nowheel min-h-0 flex-1">
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
