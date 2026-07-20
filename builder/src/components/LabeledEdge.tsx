import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { useBuilderStore } from "../store";
import type { AppEdge } from "../types";

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
  selected
}: EdgeProps<AppEdge>) {
  const editing = useBuilderStore((s) => s.editingEdgeId === id);
  const setEditingEdge = useBuilderStore((s) => s.setEditingEdge);
  const updateEdgeLabel = useBuilderStore((s) => s.updateEdgeLabel);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  const label = data?.label ?? "";

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          className={`edge-label nodrag nopan${selected ? " selected" : ""}${label ? "" : " empty"}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setEditingEdge(id);
          }}
          title="Doble clic para editar la etiqueta / Double-click to edit the label"
        >
          {editing ? (
            <input
              className="nodrag edge-label-input"
              autoFocus
              defaultValue={label}
              placeholder="etiqueta / label"
              onBlur={(e) => updateEdgeLabel(id, e.currentTarget.value.trim())}
              onKeyDown={(e) => {
                if (e.key === "Enter") updateEdgeLabel(id, e.currentTarget.value.trim());
                if (e.key === "Escape") setEditingEdge(null);
              }}
            />
          ) : (
            <span>{label || "✎"}</span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
