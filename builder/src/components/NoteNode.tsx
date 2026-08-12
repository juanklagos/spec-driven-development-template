// Tarjeta de nota (spec 030): espina izquierda del color de la nota (antes
// border-top) y cabecera con el tipo (idea / épica) en mono uppercase, para
// que el grafo diga qué es cada cosa sin emojis.
import { useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { colorToHex, EPIC_COLOR, IDEA_COLOR } from "../convert";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import { AiAssistButton } from "./AiAssistButton";
import type { NoteFlowNode } from "../types";

export function NoteNode({ id, data, selected }: NodeProps<NoteFlowNode>) {
  const { t } = useT();
  const updateNoteText = useBuilderStore((s) => s.updateNoteText);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
  const color = colorToHex(data.color, IDEA_COLOR);
  const isEpic = colorToHex(data.color, IDEA_COLOR) === colorToHex(EPIC_COLOR, IDEA_COLOR);
  const kindLabel = t(isEpic ? "palette.epic" : "palette.idea");

  const startEdit = () => {
    setDraft(data.text);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (draft !== data.text) updateNoteText(id, draft);
  };

  const [firstLine, ...rest] = (data.text || "").split("\n");
  const body = rest.join("\n").trim();

  return (
    <div
      className={`card note-card${selected ? " selected" : ""}`}
      style={{
        width: data.width,
        minHeight: data.height,
        borderLeftColor: color
      }}
      onDoubleClick={startEdit}
      title={t("note.editTitle")}
    >
      <Handle type="target" position={Position.Left} />
      <span
        className="flex items-center font-mono text-[10.5px] font-semibold tracking-[0.14em] uppercase"
        style={{ color }}
      >
        {kindLabel}
        {selected ? (
          // Ampliar con IA (spec 031, R4): accepting rewrites the note through
          // the same store action (and PUT /api/board) as a manual edit.
          <span className="nodrag ml-auto">
            <AiAssistButton
              kind="note"
              refId={id}
              currentText={data.text}
              onAccept={(proposal) => updateNoteText(id, proposal.trim())}
              compact
            />
          </span>
        ) : null}
      </span>
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
        <>
          <p className="m-0 text-[15px] leading-snug font-semibold break-words whitespace-pre-wrap">
            {firstLine || t("note.empty")}
          </p>
          {body ? (
            <p className="m-0 text-[13px] break-words whitespace-pre-wrap text-muted-foreground">
              {body}
            </p>
          ) : null}
        </>
      )}
      {data.file ? (
        <span className="font-mono text-[0.7rem] break-all text-muted-foreground">{data.file}</span>
      ) : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
