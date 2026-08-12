import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from "@dnd-kit/core";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { SpecSummary } from "../types";

// Kanban view (spec 009, R1 → spec 030): the SAME store data as the graph
// (specs from /api/board, gate from /api/gate) projected into columns by the
// real state of the .md files. Spec 030 turns the framed column cards into
// full-bleed columns separated by hairlines, without emojis in the chrome.
// Dragging a draft to "approved" OPENS the approval form; it never approves.

type ColumnKey = "draft" | "approved" | "done";

const COLUMNS: { key: ColumnKey; box: string; titleKey: string }[] = [
  { key: "draft", box: "bg-[var(--amber)]", titleKey: "kanban.col.draft" },
  { key: "approved", box: "bg-primary", titleKey: "kanban.col.approved" },
  { key: "done", box: "bg-[var(--primary-strong)]", titleKey: "kanban.col.done" }
];

/**
 * Column from the tone computed once in sdd-core (specTone) and shipped by the
 * API — the exact same value the graph card and the dashboard render.
 */
export function columnForSpec(spec: SpecSummary): ColumnKey {
  if (spec.tone === "done") return "done";
  if (spec.tone === "ok") return "approved";
  return "draft";
}

function splitSpecId(id: string): { num: string; name: string } {
  const match = id.match(/^(\d{3})-(.+)$/);
  return match ? { num: match[1], name: match[2].replace(/-/g, " ") } : { num: "", name: id };
}

function KanbanCardBody({ spec, column }: { spec: SpecSummary; column: ColumnKey }) {
  const { t } = useT();
  const score = useBuilderStore((s) => s.scores[spec.id]);
  const gateIssues = useBuilderStore((s) => s.gate?.specIssues[spec.id]);
  const depWarnings = useBuilderStore((s) => s.gate?.dependencyWarnings);
  const gateErrors = gateIssues?.filter((issue) => issue.level === "error") ?? [];
  const myDeps = (depWarnings ?? []).filter((w) => w.dependent === spec.id);
  const { num, name } = splitSpecId(spec.id);
  const label = spec.title || name;
  const { done, total } = spec.tasks;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const tone = column === "done" ? "done" : column === "approved" ? "ok" : "pending";
  const stateWord = t(
    tone === "done" ? "status.done" : tone === "ok" ? "status.approved" : "status.pending"
  ).toLowerCase();

  return (
    <>
      <div className="mb-[9px] flex items-center gap-2">
        <span className="font-mono text-xs font-semibold tracking-[0.06em] text-muted-foreground">
          {num}
        </span>
        {gateErrors.length > 0 ? (
          <span
            className="cursor-help rounded-[4px] border border-destructive px-1.5 py-px font-mono text-[10.5px] whitespace-nowrap text-[var(--destructive-text)]"
            title={`${t("status.gateErrors")}\n${gateErrors.map((e) => `• ${e.message}`).join("\n")}`}
          >
            {gateErrors.length} error
          </span>
        ) : null}
        {myDeps.length > 0 ? (
          <span
            className="cursor-help rounded-[4px] border border-[var(--amber)] px-1.5 py-px font-mono text-[10.5px] whitespace-nowrap text-[var(--amber-text)]"
            title={`${t("status.depWarn")}\n${myDeps.map((w) => `• ${w.message}`).join("\n")}`}
          >
            dep
          </span>
        ) : null}
        <span className={`badge-tone ${tone} ml-auto`}>{stateWord}</span>
      </div>
      <h3
        className="m-0 mb-3 text-[16.5px] leading-[1.3] font-semibold tracking-[-0.005em]"
        title={label}
      >
        {label}
      </h3>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={t("status.tasks", { done, total })}
      >
        <div className={`progress-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-[9px] flex items-baseline justify-between font-mono text-[11.5px] text-muted-foreground">
        <span>{t("status.tasks", { done, total })}</span>
        {score ? (
          <span title={score.notes.join("\n")}>
            {score.grade} · {score.score}
          </span>
        ) : null}
      </div>
    </>
  );
}

function KanbanCard({
  spec,
  column,
  onOpen
}: {
  spec: SpecSummary;
  column: ColumnKey;
  onOpen: (id: string) => void;
}) {
  const selected = useBuilderStore((s) => s.selectedSpecId === spec.id);
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: spec.id,
    data: { column }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`card spec-card cursor-grab touch-none${selected ? " selected" : ""}${isDragging ? " opacity-35" : ""}`}
      onClick={() => onOpen(spec.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(spec.id);
        }
      }}
    >
      <KanbanCardBody spec={spec} column={column} />
    </div>
  );
}

function KanbanColumn({
  column,
  specs,
  onOpen,
  acceptsDrop
}: {
  column: (typeof COLUMNS)[number];
  specs: SpecSummary[];
  onOpen: (id: string) => void;
  acceptsDrop: boolean;
}) {
  const { t } = useT();
  // Only the one legal transition accepts a drop: draft -> approved. "done" is
  // derived from task completion, so it can never be a destination.
  const { setNodeRef, isOver } = useDroppable({
    id: `col-${column.key}`,
    data: { column: column.key },
    disabled: !acceptsDrop
  });
  return (
    <section ref={setNodeRef} className="flex min-h-0 flex-col bg-background" aria-label={t(column.titleKey)}>
      <header className="flex h-10 shrink-0 items-center gap-[9px] border-b bg-card px-3.5">
        <span className={`size-[7px] rounded-[2px] ${column.box}`} aria-hidden />
        <span className="font-mono text-[11.5px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {t(column.titleKey)}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">{specs.length}</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {specs.length === 0 && !acceptsDrop ? (
          <p className="my-2.5 text-center font-mono text-xs text-muted-foreground">
            {t("kanban.empty")}
          </p>
        ) : null}
        {specs.map((spec) => (
          <KanbanCard key={spec.id} spec={spec} column={column.key} onOpen={onOpen} />
        ))}
        {acceptsDrop ? (
          // Soltar aquí abre el formulario de aprobación (spec 030): la zona
          // dice qué va a pedir antes de que el usuario suelte.
          <div
            className={`rounded-[9px] border border-dashed p-3.5 text-center transition-colors ${
              isOver ? "border-primary bg-[var(--primary-soft)]" : "border-border"
            }`}
          >
            <p className="m-0 font-mono text-[11.5px] text-muted-foreground">
              {t("kanban.dropHint")}
            </p>
            <p className="m-0 mt-1 text-[12.5px] text-muted-foreground">{t("kanban.dropBody")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function KanbanBoard() {
  const specsById = useBuilderStore((s) => s.specs);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [dragId, setDragId] = useState<string | null>(null);
  const suppressClick = useRef(false);

  const specs = useMemo(
    () => Object.values(specsById).sort((a, b) => a.id.localeCompare(b.id)),
    [specsById]
  );
  const byColumn = useMemo(() => {
    const groups: Record<ColumnKey, SpecSummary[]> = { draft: [], approved: [], done: [] };
    for (const spec of specs) groups[columnForSpec(spec)].push(spec);
    return groups;
  }, [specs]);

  const handleOpen = (id: string) => {
    if (suppressClick.current) return;
    selectSpec(id);
  };

  const onDragStart = (event: DragStartEvent) => setDragId(String(event.active.id));

  const onDragEnd = (event: DragEndEvent) => {
    setDragId(null);
    // The click that follows a drop must not open the sheet.
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    const specId = String(event.active.id);
    const spec = specsById[specId];
    const target = event.over?.data.current?.column as ColumnKey | undefined;
    if (!spec || !target || target === columnForSpec(spec)) return;

    // Dragging OPENS the approval, it never performs it: approval is a
    // deliberate act with an approver and evidence, not a gesture.
    if (columnForSpec(spec) === "draft" && target === "approved") {
      selectSpec(specId, "approval");
    }
  };

  const dragSpec = dragId ? specsById[dragId] : undefined;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background" data-tour="canvas">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {/* gap-px sobre fondo --border: hairlines de 1px sin bordes por columna. */}
        <div className="grid min-h-0 flex-1 grid-cols-3 gap-px overflow-x-auto bg-border max-[900px]:grid-cols-[repeat(3,minmax(15rem,1fr))]">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.key}
              column={column}
              specs={byColumn[column.key]}
              onOpen={handleOpen}
              // Only while a draft is in hand, and only the approved column.
              acceptsDrop={column.key === "approved" && dragSpec != null && columnForSpec(dragSpec) === "draft"}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragSpec ? (
            <div className="card spec-card w-68 cursor-grabbing shadow-xl">
              <KanbanCardBody spec={dragSpec} column={columnForSpec(dragSpec)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
