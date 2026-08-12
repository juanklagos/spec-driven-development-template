// Franja 3 de la chrome (spec 030): el rail. Reemplaza Palette.tsx.
//
// La paleta antigua ocupaba 218px con tres botones y dos líneas de pie: ~40%
// del alto vacío. Aquí arriba va lo que se puede colocar (una línea cada uno,
// con atajo) y el resto es un navegador real de specs/ — la lista que el
// usuario necesita para orientarse en un proyecto de 29 specs.
import { useDraggable } from "@dnd-kit/core";
import { useReactFlow } from "@xyflow/react";
import { Box, ClipboardList, Lightbulb, type LucideIcon } from "lucide-react";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { PaletteKind, SpecSummary } from "../types";

export interface PaletteEntry {
  kind: PaletteKind;
  icon: LucideIcon;
  iconClass: string;
  labelKey: string;
  shortcut: string;
  /** Spec es la única que escribe en disco: es la única destacada. */
  primary?: boolean;
}

export const PALETTE_ITEMS: PaletteEntry[] = [
  {
    kind: "idea",
    icon: Lightbulb,
    iconClass: "text-[var(--amber)]",
    labelKey: "palette.idea",
    shortcut: "I"
  },
  {
    kind: "epic",
    icon: Box,
    iconClass: "text-[var(--epic)]",
    labelKey: "palette.epic",
    shortcut: "E"
  },
  {
    kind: "spec",
    icon: ClipboardList,
    iconClass: "text-primary",
    labelKey: "palette.spec",
    shortcut: "S",
    primary: true
  }
];

function PaletteItem({
  item,
  onQuickAdd
}: {
  item: PaletteEntry;
  onQuickAdd: (kind: PaletteKind) => void;
}) {
  const { t } = useT();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.kind}`,
    data: { kind: item.kind }
  });
  const Icon = item.icon;
  const skin = item.primary
    ? "border-primary/45 bg-[var(--primary-soft)] font-semibold"
    : "border-border bg-background";
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={`flex h-8 w-full cursor-grab touch-none items-center gap-[9px] rounded-[6px] border px-[9px] text-left text-[13px] transition-colors hover:border-primary ${skin} ${isDragging ? "opacity-40" : ""}`}
      data-tour={item.kind === "spec" ? "palette-spec" : undefined}
      title={t("palette.help")}
      onClick={() => onQuickAdd(item.kind)}
    >
      <Icon className={`size-3.5 shrink-0 ${item.iconClass}`} aria-hidden />
      <span className="min-w-0 truncate">{t(item.labelKey)}</span>
      <kbd className="ml-auto shrink-0 font-mono text-[11px] font-normal text-muted-foreground">
        {item.shortcut}
      </kbd>
    </button>
  );
}

function toneDot(spec: SpecSummary): string {
  if (spec.tone === "done") return "bg-[var(--primary-strong)]";
  if (spec.tone === "ok") return "bg-primary";
  if (spec.tone === "pending") return "bg-[var(--amber)]";
  return "bg-[var(--disabled-foreground)]";
}

function SpecRow({ spec, active }: { spec: SpecSummary; active: boolean }) {
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const viewMode = useBuilderStore((s) => s.viewMode);
  const { setCenter, getNode } = useReactFlow();
  const match = spec.id.match(/^(\d{3})-(.+)$/);

  const open = () => {
    selectSpec(spec.id);
    // Centrar el nodo en el grafo, si está montado (solo en vista grafo).
    if (viewMode !== "canvas") return;
    const node = getNode(spec.id);
    if (!node) return;
    const x = node.position.x + (node.measured?.width ?? node.width ?? 0) / 2;
    const y = node.position.y + (node.measured?.height ?? node.height ?? 0) / 2;
    void setCenter(x, y, { zoom: 1, duration: 300 });
  };

  return (
    <button
      type="button"
      onClick={open}
      // min-h y no h: "029-actualizacion-sin-sorpresas" debe poder envolver
      // a dos líneas sin invadir la fila siguiente.
      className={`flex min-h-[26px] w-full items-center gap-2 rounded-[5px] px-2 py-[3px] text-left leading-[1.35] transition-colors hover:bg-muted ${
        active ? "bg-muted font-medium text-foreground" : "text-[var(--list-foreground)]"
      }`}
      title={spec.title}
    >
      <span className={`size-[5px] shrink-0 rounded-full ${toneDot(spec)}`} aria-hidden />
      <span className="min-w-0">{match ? `${match[1]} ${match[2]}` : spec.id}</span>
    </button>
  );
}

export function Rail({ onQuickAdd }: { onQuickAdd: (kind: PaletteKind) => void }) {
  const { t } = useT();
  const specs = useBuilderStore((s) => s.specs);
  const selected = useBuilderStore((s) => s.selectedSpecId);
  const list = Object.values(specs).sort((a, b) => a.id.localeCompare(b.id));

  return (
    <aside
      className="z-10 flex w-[246px] shrink-0 flex-col border-r bg-card max-[900px]:w-[200px]"
      data-tour="palette"
    >
      <div className="flex flex-col gap-[5px] px-3 pt-3 pb-2.5">
        <span className="mb-[3px] font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
          {t("rail.add")}
        </span>
        {PALETTE_ITEMS.map((item) => (
          <PaletteItem key={item.kind} item={item} onQuickAdd={onQuickAdd} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t px-3 pt-1.5 pb-2">
        <span className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
          specs/
        </span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">{list.length}</span>
      </div>

      {list.length === 0 ? (
        <p className="m-0 px-3 py-2.5 font-mono text-xs text-muted-foreground">
          {t("rail.specsEmpty")}
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-px overflow-y-auto px-1.5 pb-2.5 font-mono text-[12.5px]">
          {list.map((spec) => (
            <SpecRow key={spec.id} spec={spec} active={spec.id === selected} />
          ))}
        </div>
      )}
    </aside>
  );
}
