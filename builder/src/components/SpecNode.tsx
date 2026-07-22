import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { SpecFlowNode } from "../types";

function splitSpecId(id: string): { num: string; name: string } {
  const match = id.match(/^(\d{3})-(.+)$/);
  return match ? { num: match[1], name: match[2].replace(/-/g, " ") } : { num: "", name: id };
}

export function SpecNode({ data, selected }: NodeProps<SpecFlowNode>) {
  const { t } = useT();
  const spec = useBuilderStore((s) => s.specs[data.specId]);
  const gateIssues = useBuilderStore((s) => s.gate?.specIssues[data.specId]);
  const depWarningsAll = useBuilderStore((s) => s.gate?.dependencyWarnings);
  const gateErrors = gateIssues?.filter((issue) => issue.level === "error") ?? [];
  const depWarnings = (depWarningsAll ?? []).filter((w) => w.dependent === data.specId);
  const done = spec?.tasks.done ?? 0;
  const total = spec?.tasks.total ?? 0;
  // Tone comes from the server (sdd-core specTone) so the card, the kanban and
  // the dashboard can never disagree about what a spec's state is.
  const tone = spec?.tone ?? "pending";
  const badgeText = t(tone === "done" ? "status.done" : tone === "ok" ? "status.approved" : "status.pending");
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const { num, name } = splitSpecId(data.specId);
  // The human title from line 1 of spec.md. `name` (the directory slug) is the
  // fallback: "builder-v5-pro-ux" and "builder-v4-teams" are indistinguishable
  // at a glance, and the title was already being read and thrown away.
  const label = spec?.title || name;

  return (
    <div className={`card spec-card${selected ? " selected" : ""}`} style={{ width: data.width }}>
      <Handle type="target" position={Position.Left} />
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
          {depWarnings.length > 0 ? (
            // Approved spec leaning on a not-approved dependency (spec 009, R2).
            <span
              className="badge-tone warn"
              title={`${t("status.depWarn")}\n${depWarnings.map((w) => `• ${w.message}`).join("\n")}`}
            >
              ⚠ dep
            </span>
          ) : null}
          <span className={`badge-tone ${tone}`}>{badgeText}</span>
        </span>
      </div>
      <h3 className="mt-2 mb-2.5 text-base leading-snug font-semibold" title={label}>{label}</h3>
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
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
