import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { colorToHex, IDEA_COLOR } from "../convert";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { NoteFlowNode } from "../types";

export function NoteNode({ id, data, selected }: NodeProps<NoteFlowNode>) {
  const { t } = useT();
  const updateNoteText = useBuilderStore((s) => s.updateNoteText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const color = colorToHex(data.color, IDEA_COLOR);

  const startEdit = () => {
    setDraft(data.text);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft !== data.text) updateNoteText(id, draft);
  };

  return (
    <div
      className={`card note-card${selected ? " selected" : ""}`}
      style={{
        width: data.width,
        minHeight: data.height,
        borderTopColor: color,
        background: `color-mix(in srgb, ${color} 8%, var(--card))`
      }}
      onDoubleClick={startEdit}
      title={t("note.editTitle")}
    >
      <Handle type="target" position={Position.Left} />
      {editing ? (
        <textarea
          className="nodrag note-editor"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(data.text);
              setEditing(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
          }}
        />
      ) : (
        <p className="m-0 text-sm break-words whitespace-pre-wrap">{data.text || t("note.empty")}</p>
      )}
      {data.file ? (
        <span className="font-mono text-[0.7rem] break-all text-muted-foreground">📄 {data.file}</span>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
