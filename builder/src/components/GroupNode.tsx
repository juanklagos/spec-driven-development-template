// Tarjeta de grupo (spec 041): un marco titulado, no una nota. El título vive
// en `label` de JSON Canvas, y hasta esta spec el builder lo leía de `text` —
// que un grupo no tiene—, así que pintaba una tarjeta IDEA vacía y al guardar
// escribía la pérdida en el archivo del usuario.
//
// El cuerpo del marco no captura el puntero: lo que está encima tiene que
// seguir siendo clicable. El grupo se arrastra por su cabecera, que es el
// único trozo con `pointer-events`, y eso es también lo que declara
// `dragHandle` en convert.ts.
import { useState } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { colorToHex } from "../convert";
import { useT } from "../i18n";
import { useBuilderStore } from "../store";
import type { GroupFlowNode } from "../types";

const DEFAULT_GROUP_COLOR = "#6b7280";

export function GroupNode({ id, data, selected }: NodeProps<GroupFlowNode>) {
  const { t } = useT();
  const renameGroup = useBuilderStore((s) => s.renameGroup);
  const resizeGroup = useBuilderStore((s) => s.resizeGroup);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const color = colorToHex(data.color, DEFAULT_GROUP_COLOR);

  const commit = () => {
    setEditing(false);
    if (draft !== data.label) renameGroup(id, draft);
  };

  const backgroundImage = data.background ? `url(${JSON.stringify(data.background)})` : undefined;
  const backgroundSize =
    data.backgroundStyle === "ratio" ? "contain" : data.backgroundStyle === "repeat" ? "auto" : "cover";

  return (
    <>
      {/* Fuera del marco a propósito: `.group-frame` no captura el puntero, así
          que las asas dentro de él serían inagarrables. */}
      <NodeResizer
        isVisible={selected}
        minWidth={220}
        minHeight={160}
        onResizeEnd={(_, params) => resizeGroup(id, params.width, params.height)}
      />
    <div
      className={`group-frame${selected ? " selected" : ""}`}
      style={{
        // 100% para que el marco siga a las asas mientras se arrastra; el
        // tamaño real lo fija el nodo desde el archivo.
        width: "100%",
        height: "100%",
        borderColor: color,
        backgroundColor: `color-mix(in oklab, ${color} 7%, transparent)`,
        ...(backgroundImage
          ? {
              backgroundImage,
              backgroundSize,
              backgroundRepeat: data.backgroundStyle === "repeat" ? "repeat" : "no-repeat",
              backgroundPosition: "center"
            }
          : {})
      }}
    >
      <div className="group-handle" style={{ color }} onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <input
            className="nodrag group-title-input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(data.label);
                setEditing(false);
              }
            }}
          />
        ) : (
          <span title={t("group.editTitle")}>{data.label.trim() || t("group.untitled")}</span>
        )}
      </div>
    </div>
    </>
  );
}
