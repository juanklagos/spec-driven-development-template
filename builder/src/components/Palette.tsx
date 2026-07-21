import { useDraggable } from "@dnd-kit/core";
import { useT } from "../i18n";
import { HelpHint } from "./HelpHint";
import type { PaletteKind } from "../types";

export interface PaletteEntry {
  kind: PaletteKind;
  emoji: string;
  labelKey: string;
  hintKey: string;
}

export const PALETTE_ITEMS: PaletteEntry[] = [
  { kind: "idea", emoji: "💡", labelKey: "palette.idea", hintKey: "palette.idea.hint" },
  { kind: "epic", emoji: "📦", labelKey: "palette.epic", hintKey: "palette.epic.hint" },
  { kind: "spec", emoji: "📋", labelKey: "palette.spec", hintKey: "palette.spec.hint" }
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
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={`flex w-full cursor-grab touch-none items-center gap-2.5 rounded-lg border bg-muted px-2.5 py-2.5 text-left transition-all hover:border-primary hover:shadow-sm ${isDragging ? "opacity-40" : ""}`}
      data-tour={item.kind === "spec" ? "palette-spec" : undefined}
      onClick={() => onQuickAdd(item.kind)}
    >
      <span className="text-xl" aria-hidden>
        {item.emoji}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <strong className="text-sm">{t(item.labelKey)}</strong>
        <small className="text-xs text-muted-foreground">{t(item.hintKey)}</small>
      </span>
    </button>
  );
}

export function Palette({ onQuickAdd }: { onQuickAdd: (kind: PaletteKind) => void }) {
  const { t } = useT();
  return (
    <aside
      className="z-10 flex w-[218px] shrink-0 flex-col gap-2.5 overflow-y-auto border-r bg-card px-3 py-3.5 max-[800px]:w-[170px]"
      data-tour="palette"
    >
      <h2 className="m-0 flex items-center gap-1.5 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        {t("palette.title")}
        {/* Idea vs Épica vs Spec: the first concept a beginner needs. */}
        <HelpHint topic="palette" guide="builder" />
      </h2>
      <p className="m-0 mb-1 text-xs text-muted-foreground">{t("palette.help")}</p>
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.kind} item={item} onQuickAdd={onQuickAdd} />
      ))}
      <div className="mt-auto space-y-1.5 border-t border-dashed pt-3 text-xs text-muted-foreground">
        <p className="m-0">{t("palette.foot1")}</p>
        <p className="m-0">{t("palette.foot2")}</p>
      </div>
    </aside>
  );
}
