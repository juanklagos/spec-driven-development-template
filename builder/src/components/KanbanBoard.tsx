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
import { toast } from "sonner";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { SpecSummary } from "../types";

// Kanban view (spec 009, R1): the SAME store data as the canvas (specs from
// /api/board, gate from /api/gate) projected into columns by the real state
// of the .md files. v1 is read-only for approval: dragging a card to another
// column changes NOTHING on disk — a toast points to the sheet, where the
// real Approve flow (spec 007/010) lives.

type ColumnKey = "draft" | "approved" | "done";

const COLUMNS: { key: ColumnKey; emoji: string; titleKey: string }[] = [
  { key: "draft", emoji: "📝", titleKey: "kanban.col.draft" },
  { key: "approved", emoji: "✅", titleKey: "kanban.col.approved" },
  { key: "done", emoji: "🏁", titleKey: "kanban.col.done" }
];

/**
 * Column from the real .md state — the exact same derivation as the canvas
 * card (SpecNode): all tasks done wins, then the approval status written in
 * spec.md (`Estado / Status`), else draft.
 */
export function columnForSpec(spec: SpecSummary): ColumnKey {
  if (spec.tasks.total > 0 && spec.tasks.done === spec.tasks.total) return "done";
  if (/aprobad[oa]|approved/i.test(spec.status)) return "approved";
  return "draft";
}

function splitSpecId(id: string): { num: string; name: string } {
  const match = id.match(/^(\d{3})-(.+)$/);
  return match ? { num: match[1], name: match[2].replace(/-/g, " ") } : { num: "", name: id };
}

function KanbanCardBody({ spec, column }: { spec: SpecSummary; column: ColumnKey }) {
  const { t } = useT();
  const gateIssues = useBuilderStore((s) => s.gate?.specIssues[spec.id]);
  const depWarnings = useBuilderStore((s) => s.gate?.dependencyWarnings);
  const gateErrors = gateIssues?.filter((issue) => issue.level === "error") ?? [];
  const myDeps = (depWarnings ?? []).filter((w) => w.dependent === spec.id);
  const { num, name } = splitSpecId(spec.id);
  const { done, total } = spec.tasks;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const tone = column === "done" ? "done" : column === "approved" ? "ok" : "pending";

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-muted-foreground">📋 {num}</span>
        <span className="inline-flex items-center gap-1.5">
          {gateErrors.length > 0 ? (
            <span
              className="badge-tone error"
              title={`${t("status.gateErrors")}\n${gateErrors.map((e) => `• ${e.message}`).join("\n")}`}
            >
              ⚠ {gateErrors.length}
            </span>
          ) : null}
          {myDeps.length > 0 ? (
            <span
              className="badge-tone warn"
              title={`${t("status.depWarn")}\n${myDeps.map((w) => `• ${w.message}`).join("\n")}`}
            >
              ⚠ dep
            </span>
          ) : null}
        </span>
      </div>
      <h3 className="mt-2 mb-2.5 text-base leading-snug font-semibold capitalize">{name}</h3>
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
      <div className="mt-2 flex items-baseline justify-between text-xs text-muted-foreground">
        <span>{t("status.tasks", { done, total })}</span>
        <span className="spec-open-hint">{t("status.open")}</span>
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
  onOpen
}: {
  column: (typeof COLUMNS)[number];
  specs: SpecSummary[];
  onOpen: (id: string) => void;
}) {
  const { t } = useT();
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.key}`, data: { column: column.key } });
  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-0 flex-col rounded-xl border bg-muted/60 transition-colors ${isOver ? "border-primary" : ""}`}
      aria-label={t(column.titleKey)}
    >
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
        <span>
          {column.emoji} {t(column.titleKey)}
        </span>
        <span className="rounded-full border bg-card px-2 py-0.5 text-[0.72rem]">{specs.length}</span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {specs.length === 0 ? (
          <p className="my-2.5 text-center text-xs text-muted-foreground">{t("kanban.empty")}</p>
        ) : (
          specs.map((spec) => <KanbanCard key={spec.id} spec={spec} column={column.key} onOpen={onOpen} />)
        )}
      </div>
    </section>
  );
}

export function KanbanBoard() {
  const { t } = useT();
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
    // v1: state lives in the .md files only — moving a card changes nothing.
    toast(t("kanban.toast"), {
      action: {
        label: t("kanban.openSpec"),
        onClick: () => selectSpec(specId)
      }
    });
  };

  const dragSpec = dragId ? specsById[dragId] : undefined;

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-background" data-tour="canvas">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(3,minmax(15rem,1fr))] gap-3.5 overflow-x-auto p-4">
          {COLUMNS.map((column) => (
            <KanbanColumn key={column.key} column={column} specs={byColumn[column.key]} onOpen={handleOpen} />
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
