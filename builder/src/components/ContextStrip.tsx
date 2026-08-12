// Franja 2 de la chrome (spec 030): qué vista, qué está filtrado, cuánto hay.
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { Separator } from "@/components/ui/separator";

function ViewToggle() {
  const { t } = useT();
  const viewMode = useBuilderStore((s) => s.viewMode);
  const setViewMode = useBuilderStore((s) => s.setViewMode);
  const base =
    "h-[22px] cursor-pointer rounded-[4px] px-2.5 text-xs font-semibold transition-colors";
  const on = "bg-card text-foreground shadow-[var(--shadow-raised)]";
  const off = "bg-transparent text-muted-foreground hover:text-foreground";
  return (
    <span
      className="inline-flex rounded-[6px] bg-muted p-[2px]"
      role="group"
      aria-label={t("topbar.view.label")}
    >
      <button
        className={`${base} ${viewMode === "canvas" ? on : off}`}
        onClick={() => setViewMode("canvas")}
        aria-pressed={viewMode === "canvas"}
      >
        {t("topbar.view.canvas")}
      </button>
      <button
        className={`${base} ${viewMode === "board" ? on : off}`}
        onClick={() => setViewMode("board")}
        aria-pressed={viewMode === "board"}
      >
        {t("topbar.view.board")}
      </button>
    </span>
  );
}

/**
 * Chip de filtro. El de avisos se tiñe de ámbar SOLO si hay algo que contar:
 * un chip ámbar con "0" enseña a ignorar el ámbar.
 */
function FilterChip({
  label,
  count,
  active,
  tone,
  onToggle
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: "amber";
  onToggle: () => void;
}) {
  const warn = tone === "amber" && count > 0;
  const cls = active
    ? "border-primary bg-[var(--primary-soft)] text-primary font-semibold"
    : warn
      ? "border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber-text)] font-semibold"
      : "border-border bg-card text-foreground";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={`h-[22px] cursor-pointer rounded-full border px-[9px] text-xs whitespace-nowrap transition-colors ${cls}`}
    >
      {label} {count}
    </button>
  );
}

export function ContextStrip() {
  const { t } = useT();
  const viewMode = useBuilderStore((s) => s.viewMode);
  const specs = useBuilderStore((s) => s.specs);
  const edges = useBuilderStore((s) => s.edges);
  const gate = useBuilderStore((s) => s.gate);
  const zoom = useBuilderStore((s) => s.zoom);
  const filters = useBuilderStore((s) => s.filters);
  const toggleFilter = useBuilderStore((s) => s.toggleFilter);

  const list = Object.values(specs);
  const pending = list.filter((s) => s.tone === "pending").length;
  const warnings = (gate?.warnings ?? 0) + (gate?.dependencyWarnings?.length ?? 0);
  const drift = list.filter((s) => s.drift?.state === "drifted").length;

  const meta =
    viewMode === "board"
      ? t("context.metaBoard", { n: list.length, c: 3 })
      : t("context.meta", {
          n: list.length,
          e: edges.length,
          z: Math.round((zoom ?? 1) * 100)
        });

  return (
    <div className="flex h-[34px] shrink-0 items-center gap-2.5 border-b bg-[var(--chrome)] px-3.5">
      <ViewToggle />
      <Separator orientation="vertical" className="!h-4" />
      <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
        {t("context.filter")}
      </span>
      <FilterChip
        label={t("context.pending")}
        count={pending}
        active={filters.pending}
        onToggle={() => toggleFilter("pending")}
      />
      <FilterChip
        label={t("context.warnings")}
        count={warnings}
        active={filters.warnings}
        tone="amber"
        onToggle={() => toggleFilter("warnings")}
      />
      <FilterChip
        label={t("context.drift")}
        count={drift}
        active={filters.drift}
        onToggle={() => toggleFilter("drift")}
      />
      <span className="ml-auto font-mono text-xs whitespace-nowrap text-muted-foreground">
        {meta}
      </span>
    </div>
  );
}
