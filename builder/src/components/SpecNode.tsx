// Tarjeta de spec (spec 030). La lógica (tone, pct, drift, dep) es la misma;
// lo que cambia es la jerarquía visual:
//
//  - el título es lo más pesado (antes competía con una pastilla rellena)
//  - el estado es un punto + palabra en mono, no una pastilla de color
//  - los avisos dicen QUÉ son en palabras ("dep", "deriva 3", "1 error")
//    en lugar de símbolos (⚠ dep, 🔀 3, ⚠ 1) que obligan a pasar el ratón
//  - la barra de progreso baja de 7px a 2px: es un dato periférico
//  - el pie trae el grado del puntaje, para ver la salud sin abrir el drawer
//  - se va el 📋: todas las tarjetas de spec lo llevaban, no distinguía nada
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { SpecFlowNode } from "../types";

function splitSpecId(id: string): { num: string; name: string } {
  const match = id.match(/^(\d{3})-(.+)$/);
  return match ? { num: match[1], name: match[2].replace(/-/g, " ") } : { num: "", name: id };
}

/** Aviso legible: solo borde y texto, sin relleno, para no competir con el título. */
function WarnTag({
  children,
  tone,
  title
}: {
  children: React.ReactNode;
  tone: "amber" | "red";
  title: string;
}) {
  const cls =
    tone === "red"
      ? "border-destructive text-[var(--destructive-text)]"
      : "border-[var(--amber)] text-[var(--amber-text)]";
  return (
    <span
      className={`cursor-help rounded-[4px] border px-1.5 py-px font-mono text-[10.5px] whitespace-nowrap ${cls}`}
      title={title}
    >
      {children}
    </span>
  );
}

export function SpecNode({ data, selected }: NodeProps<SpecFlowNode>) {
  const { t } = useT();
  const spec = useBuilderStore((s) => s.specs[data.specId]);
  const score = useBuilderStore((s) => s.scores[data.specId]);
  const gateIssues = useBuilderStore((s) => s.gate?.specIssues[data.specId]);
  const depWarningsAll = useBuilderStore((s) => s.gate?.dependencyWarnings);

  const gateErrors = gateIssues?.filter((issue) => issue.level === "error") ?? [];
  const depWarnings = (depWarningsAll ?? []).filter((w) => w.dependent === data.specId);
  const done = spec?.tasks.done ?? 0;
  const total = spec?.tasks.total ?? 0;
  // Tone comes from the server (sdd-core specTone) so the card, the kanban and
  // the dashboard can never disagree about what a spec's state is.
  const tone = spec?.tone ?? "pending";
  // Spec 025: amber flag when the code this approved spec governs changed after
  // approval. Only "drifted" earns a tag; clean/unscoped/unknown stay quiet.
  const drift = spec?.drift;
  const driftCount = drift?.state === "drifted" ? drift.commits.length : 0;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const { num, name } = splitSpecId(data.specId);
  const label = spec?.title || name;
  const stateWord = t(
    tone === "done" ? "status.done" : tone === "ok" ? "status.approved" : "status.pending"
  ).toLowerCase();

  return (
    <div className={`card spec-card${selected ? " selected" : ""}`} style={{ width: data.width }}>
      <Handle type="target" position={Position.Left} />

      <div className="mb-[9px] flex items-center gap-2">
        <span className="font-mono text-xs font-semibold tracking-[0.06em] text-muted-foreground">
          {num}
        </span>
        {gateErrors.length > 0 ? (
          <WarnTag
            tone="red"
            title={`${t("status.gateErrors")}\n${gateErrors.map((e) => `• ${e.message}`).join("\n")}`}
          >
            {gateErrors.length} error
          </WarnTag>
        ) : null}
        {depWarnings.length > 0 ? (
          // Approved spec leaning on a not-approved dependency (spec 009, R2).
          <WarnTag
            tone="amber"
            title={`${t("status.depWarn")}\n${depWarnings.map((w) => `• ${w.message}`).join("\n")}`}
          >
            dep
          </WarnTag>
        ) : null}
        {driftCount > 0 ? (
          <WarnTag
            tone="amber"
            title={`${t("status.drift")}\n${(drift?.commits ?? [])
              .map((c) => `• ${c.hash} ${c.subject}`)
              .join("\n")}`}
          >
            deriva {driftCount}
          </WarnTag>
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
          // Salud de la spec sin abrir el drawer (spec 030, R4).
          <span title={score.notes.join("\n")}>
            {score.grade} · {score.score}
          </span>
        ) : null}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}
