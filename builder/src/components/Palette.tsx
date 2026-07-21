import { useDraggable } from "@dnd-kit/core";
import type { PaletteKind } from "../types";

export interface PaletteEntry {
  kind: PaletteKind;
  emoji: string;
  label: string;
  hint: string;
}

export const PALETTE_ITEMS: PaletteEntry[] = [
  { kind: "idea", emoji: "💡", label: "Idea", hint: "Nota libre / Free note" },
  { kind: "epic", emoji: "📦", label: "Épica / Epic", hint: "Agrupa specs / Groups specs" },
  { kind: "spec", emoji: "📋", label: "Spec", hint: "Crea specs/NNN-… real / Creates a real specs/NNN-…" }
];

function PaletteItem({
  item,
  onQuickAdd
}: {
  item: PaletteEntry;
  onQuickAdd: (kind: PaletteKind) => void;
}) {
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
      className={`palette-item${isDragging ? " dragging" : ""}`}
      data-tour={item.kind === "spec" ? "palette-spec" : undefined}
      onClick={() => onQuickAdd(item.kind)}
    >
      <span className="palette-emoji" aria-hidden>
        {item.emoji}
      </span>
      <span className="palette-texts">
        <strong>{item.label}</strong>
        <small>{item.hint}</small>
      </span>
    </button>
  );
}

export function Palette({ onQuickAdd }: { onQuickAdd: (kind: PaletteKind) => void }) {
  return (
    <aside className="palette" data-tour="palette">
      <h2>Paleta / Palette</h2>
      <p className="palette-help">Arrastra al lienzo (o clic) / Drag onto the canvas (or click)</p>
      {PALETTE_ITEMS.map((item) => (
        <PaletteItem key={item.kind} item={item} onQuickAdd={onQuickAdd} />
      ))}
      <div className="palette-foot">
        <p>Doble clic en una unión para etiquetarla / Double-click a connection to label it</p>
        <p>Supr/Backspace borra la selección / Delete removes the selection</p>
      </div>
    </aside>
  );
}
