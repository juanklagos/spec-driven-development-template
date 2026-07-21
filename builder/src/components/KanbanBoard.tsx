import { useEffect, useMemo, useRef, useState } from "react";
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
import { useBuilderStore } from "../store";
import type { SpecSummary } from "../types";

// Kanban view (spec 009, R1): the SAME store data as the canvas (specs from
// /api/board, gate from /api/gate) projected into columns by the real state
// of the .md files. v1 is read-only for approval: dragging a card to another
// column changes NOTHING on disk — a toast points to the drawer, where the
// real Approve button (spec 007) lives.

type ColumnKey = "draft" | "approved" | "done";

const COLUMNS: { key: ColumnKey; emoji: string; title: string }[] = [
  { key: "draft", emoji: "📝", title: "Borrador / Draft · Pendiente" },
  { key: "approved", emoji: "✅", title: "Aprobada / Approved" },
  { key: "done", emoji: "🏁", title: "Hecha / Done" }
];

const TOAST_MS = 7000;

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
      <div className="spec-card-head">
        <span className="spec-num">📋 {num}</span>
        <span className="spec-card-badges">
          {gateErrors.length > 0 ? (
            <span
              className="badge error"
              title={`Errores del gate / Gate errors:\n${gateErrors.map((e) => `• ${e.message}`).join("\n")}`}
            >
              ⚠ {gateErrors.length}
            </span>
          ) : null}
          {myDeps.length > 0 ? (
            <span
              className="badge warn"
              title={`Dependencias sin aprobar / Unapproved dependencies:\n${myDeps.map((w) => `• ${w.message}`).join("\n")}`}
            >
              ⚠ dep
            </span>
          ) : null}
        </span>
      </div>
      <h3 className="spec-name">{name}</h3>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={`${done}/${total} tareas / tasks`}
      >
        <div className={`progress-fill ${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="spec-meta">
        <span>
          {done}/{total} tareas / tasks
        </span>
        <span className="spec-open-hint">Abrir / Open →</span>
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
      className={`card spec-card kanban-card${selected ? " selected" : ""}${isDragging ? " dragging" : ""}`}
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
  const { setNodeRef, isOver } = useDroppable({ id: `col-${column.key}`, data: { column: column.key } });
  return (
    <section ref={setNodeRef} className={`kanban-col${isOver ? " over" : ""}`} aria-label={column.title}>
      <header className="kanban-col-head">
        <span>
          {column.emoji} {column.title}
        </span>
        <span className="kanban-count">{specs.length}</span>
      </header>
      <div className="kanban-col-body">
        {specs.length === 0 ? (
          <p className="kanban-empty">— vacío / empty —</p>
        ) : (
          specs.map((spec) => <KanbanCard key={spec.id} spec={spec} column={column.key} onOpen={onOpen} />)
        )}
      </div>
    </section>
  );
}

export function KanbanBoard() {
  const specsById = useBuilderStore((s) => s.specs);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [dragId, setDragId] = useState<string | null>(null);
  const [toastSpecId, setToastSpecId] = useState<string | null>(null);
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

  // The toast dismisses itself; a new drop restarts the timer.
  useEffect(() => {
    if (!toastSpecId) return;
    const t = setTimeout(() => setToastSpecId(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toastSpecId]);

  const handleOpen = (id: string) => {
    if (suppressClick.current) return;
    selectSpec(id);
  };

  const onDragStart = (event: DragStartEvent) => setDragId(String(event.active.id));

  const onDragEnd = (event: DragEndEvent) => {
    setDragId(null);
    // The click that follows a drop must not open the drawer.
    suppressClick.current = true;
    setTimeout(() => {
      suppressClick.current = false;
    }, 0);
    const specId = String(event.active.id);
    const spec = specsById[specId];
    const target = event.over?.data.current?.column as ColumnKey | undefined;
    if (!spec || !target || target === columnForSpec(spec)) return;
    // v1: state lives in the .md files only — moving a card changes nothing.
    setToastSpecId(specId);
  };

  const dragSpec = dragId ? specsById[dragId] : undefined;

  return (
    <div className="kanban-area" data-tour="canvas">
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="kanban-grid">
          {COLUMNS.map((column) => (
            <KanbanColumn key={column.key} column={column} specs={byColumn[column.key]} onOpen={handleOpen} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {dragSpec ? (
            <div className="card spec-card kanban-card ghost">
              <KanbanCardBody spec={dragSpec} column={columnForSpec(dragSpec)} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {toastSpecId ? (
        <div className="kanban-toast" role="status">
          <span>🔒 La aprobación se hace en la spec / Approval happens on the spec</span>
          <button
            className="btn small primary"
            onClick={() => {
              selectSpec(toastSpecId);
              setToastSpecId(null);
            }}
          >
            Abrir spec / Open spec
          </button>
          <button className="icon-btn" onClick={() => setToastSpecId(null)} aria-label="Cerrar / Close">
            ✕
          </button>
        </div>
      ) : null}
    </div>
  );
}
