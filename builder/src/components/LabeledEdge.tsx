import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { edgeKind } from "../convert";
import { useBuilderStore } from "../store";
import type { AppEdge } from "../types";

/** Sentinel for the free-text option of the type selector. */
const CUSTOM = "__custom";

/**
 * Edge type selector (spec 009, R2): the canonical types apply on selection;
 * "other" keeps the free-text labels from spec 006. The ES spelling is what
 * gets written, and the EN spelling ("depends on"/"blocks") is read as the
 * same type everywhere (convert.edgeKind / sdd-core classifyEdgeLabel).
 */
function EdgeTypeEditor({ id, label }: { id: string; label: string }) {
  const updateEdgeLabel = useBuilderStore((s) => s.updateEdgeLabel);
  const setEditingEdge = useBuilderStore((s) => s.setEditingEdge);
  const kind = edgeKind(label);
  const initial = kind === "depends" ? "depende de" : kind === "blocks" ? "bloquea" : label ? CUSTOM : "";
  const [choice, setChoice] = useState(initial);

  return (
    <span className="edge-editor nodrag">
      <select
        autoFocus={choice !== CUSTOM}
        value={choice}
        aria-label="Tipo de unión / Connection type"
        onChange={(e) => {
          const value = e.target.value;
          if (value === CUSTOM) {
            setChoice(CUSTOM);
            return;
          }
          updateEdgeLabel(id, value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditingEdge(null);
        }}
      >
        <option value="">relacionada / related</option>
        <option value="depende de">depende de / depends on</option>
        <option value="bloquea">bloquea / blocks</option>
        <option value={CUSTOM}>otra etiqueta / other label…</option>
      </select>
      {choice === CUSTOM ? (
        <input
          className="nodrag edge-label-input"
          autoFocus
          defaultValue={kind === "related" ? label : ""}
          placeholder="etiqueta / label"
          onBlur={(e) => updateEdgeLabel(id, e.currentTarget.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateEdgeLabel(id, e.currentTarget.value.trim());
            if (e.key === "Escape") setEditingEdge(null);
          }}
        />
      ) : null}
    </span>
  );
}

export function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
  selected
}: EdgeProps<AppEdge>) {
  const editing = useBuilderStore((s) => s.editingEdgeId === id);
  const setEditingEdge = useBuilderStore((s) => s.setEditingEdge);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  const label = data?.label ?? "";
  const kind = edgeKind(label);

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className={`edge-label nodrag nopan kind-${kind}${selected ? " selected" : ""}${label ? "" : " empty"}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingEdge(id);
          }}
          title="Doble clic para elegir el tipo de unión / Double-click to pick the connection type"
        >
          {editing ? <EdgeTypeEditor id={id} label={label} /> : <span>{label || "✎"}</span>}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
