import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useBuilderStore } from "../store";
import type { SpecFlowNode } from "../types";

function splitSpecId(id: string): { num: string; name: string } {
  const match = id.match(/^(\d{3})-(.+)$/);
  return match ? { num: match[1], name: match[2].replace(/-/g, " ") } : { num: "", name: id };
}

export function SpecNode({ data, selected }: NodeProps<SpecFlowNode>) {
  const spec = useBuilderStore((s) => s.specs[data.specId]);
  const status = spec?.status ?? "Pendiente";
  const done = spec?.tasks.done ?? 0;
  const total = spec?.tasks.total ?? 0;
  const isDone = total > 0 && done === total;
  const isApproved = /aprobado|approved/i.test(status);
  const tone = isDone ? "done" : isApproved ? "ok" : "pending";
  const badgeText = isDone
    ? "Hecho / Done"
    : isApproved
      ? "Aprobado / Approved"
      : "Pendiente / Pending";
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const { num, name } = splitSpecId(data.specId);

  return (
    <div className={`card spec-card${selected ? " selected" : ""}`} style={{ width: data.width }}>
      <Handle type="target" position={Position.Left} />
      <div className="spec-card-head">
        <span className="spec-num">📋 {num}</span>
        <span className={`badge ${tone}`}>{badgeText}</span>
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
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
