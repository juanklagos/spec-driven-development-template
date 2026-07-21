// Purposeful connections (spec 009, R2 + spec 010, R3): every edge carries a
// purpose — related (blue, default), depends on (amber), blocks (red) or
// contains (gray, epic → spec) — plus free-text labels for anything else.
// The picker opens IMMEDIATELY when a connection is created (store.onConnect
// sets editingEdgeId) and again on double-click. Canonical labels are written
// in the UI language; both spellings are canonical everywhere (convert.ts /
// sdd-core classifyEdgeLabel).

import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { ArrowRight, Ban, Box, Link2, Pencil } from "lucide-react";
import { EDGE_KIND_LABELS, edgeKind, type EdgeKind } from "../convert";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { AppEdge } from "../types";

export const EDGE_KIND_ICON: Record<EdgeKind, typeof Link2> = {
  related: Link2,
  depends: ArrowRight,
  blocks: Ban,
  contains: Box
};

const EDGE_KIND_DOT: Record<EdgeKind, string> = {
  related: "#3b82f6",
  depends: "#d97706",
  blocks: "#dc2626",
  contains: "#6b7280"
};

/** Picker order: contains (epic→spec), depends, blocks, related (default). */
const PICKER_KINDS: EdgeKind[] = ["contains", "depends", "blocks", "related"];

/**
 * Purpose picker (spec 010, R3): canonical purposes apply on click; "other
 * label" keeps the free-text option from spec 006. The canonical label is
 * written in the current UI language; the other spelling reads as the same
 * purpose everywhere.
 */
function EdgePurposePicker({ id, label }: { id: string; label: string }) {
  const { t, lang } = useT();
  const updateEdgeLabel = useBuilderStore((s) => s.updateEdgeLabel);
  const setEditingEdge = useBuilderStore((s) => s.setEditingEdge);
  const kind = edgeKind(label);
  const isCustom = kind === "related" && label !== "";
  const [customOpen, setCustomOpen] = useState(isCustom);

  const pick = (next: EdgeKind) => {
    updateEdgeLabel(id, next === "related" ? "" : EDGE_KIND_LABELS[next][lang]);
  };

  return (
    <div
      className="edge-picker nodrag nopan"
      role="menu"
      aria-label={t("edge.pickerAria")}
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditingEdge(null);
      }}
    >
      {PICKER_KINDS.map((option) => {
        const Icon = EDGE_KIND_ICON[option];
        const active = !isCustom && kind === option && !customOpen;
        return (
          <button
            key={option}
            type="button"
            className={active ? "active" : undefined}
            autoFocus={active}
            onClick={() => pick(option)}
          >
            <span className="picker-dot" style={{ background: EDGE_KIND_DOT[option] }} aria-hidden />
            <Icon size={13} aria-hidden style={{ color: EDGE_KIND_DOT[option] }} />
            {t(`edge.kind.${option}`)}
          </button>
        );
      })}
      {customOpen ? (
        <input
          autoFocus
          defaultValue={isCustom ? label : ""}
          placeholder={t("edge.customPh")}
          onBlur={(e) => updateEdgeLabel(id, e.currentTarget.value.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateEdgeLabel(id, e.currentTarget.value.trim());
            if (e.key === "Escape") setEditingEdge(null);
          }}
        />
      ) : (
        <button type="button" className={isCustom ? "active" : undefined} onClick={() => setCustomOpen(true)}>
          <Pencil size={13} aria-hidden />
          {t("edge.kind.custom")}
        </button>
      )}
      {/* Short "why" on the decision (teaching layer): the purpose has real
          consequences, so say so where the choice is made. */}
      <p className="picker-why">💡 {t("edge.why")}</p>
    </div>
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
  const { t } = useT();
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
  const Icon = EDGE_KIND_ICON[kind];

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        {editing ? (
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -8px) translate(${labelX}px, ${labelY}px)`,
              zIndex: 10
            }}
          >
            <EdgePurposePicker id={id} label={label} />
          </div>
        ) : (
          <div
            className={`edge-label nodrag nopan kind-${kind}${selected ? " selected" : ""}${label ? "" : " empty"}`}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingEdge(id);
            }}
            title={t("edge.chipTitle")}
          >
            {label ? (
              <>
                <Icon size={12} aria-hidden />
                <span>{label}</span>
              </>
            ) : (
              <Pencil size={12} aria-hidden />
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
