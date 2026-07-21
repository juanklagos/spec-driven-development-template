// ✨ Assistant wizard (spec 008, R1): describe the project in one sentence,
// preview a locally-generated draft board (editable: rename/remove specs,
// regenerate), and only on "Create on the board" run the same real calls as
// the template gallery (POST /api/spec per spec + PUT /api/board). Nothing
// touches the disk while previewing. The "Have an AI agent?" section offers
// the copyable MCP orchestrator prompt for real-intelligence generation.

import { useEffect, useState } from "react";
import { errorMessage } from "../api";
import { draftToPlan, generateDraft, type AssistantDraft } from "../assistant";
import { buildOrchestratorPrompt } from "../prompts";
import { useBuilderStore } from "../store";
import { PromptBox } from "./PromptBox";

interface EditableSpec {
  key: string;
  name: string;
}

function AgentPromptSection({ description }: { description: string }) {
  const projectRoot = useBuilderStore((s) => s.projectRoot);
  const [open, setOpen] = useState(false);

  return (
    <div className="agent-section">
      <button type="button" className="btn small" onClick={() => setOpen(!open)}>
        {open ? "▾" : "▸"} 🤖 ¿Tienes un agente IA? / Have an AI agent?
      </button>
      {open ? (
        <>
          <p className="modal-note">
            Pega este prompt en tu agente conectado al MCP <code>sdd-mcp</code>: generará el board con
            inteligencia real (specs con borrador incluido). / Paste this prompt into your agent
            connected to the <code>sdd-mcp</code> MCP: it will generate the board with real
            intelligence (specs with a draft included).
          </p>
          <PromptBox prompt={buildOrchestratorPrompt(description, projectRoot)} />
        </>
      ) : null}
    </div>
  );
}

export function AssistantWizard() {
  const setAssistantOpen = useBuilderStore((s) => s.setAssistantOpen);
  const applyBoardPlan = useBuilderStore((s) => s.applyBoardPlan);
  const hasSpecs = useBuilderStore((s) => Object.keys(s.specs).length > 0);

  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<AssistantDraft | null>(null);
  const [specs, setSpecs] = useState<EditableSpec[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (!busy) setAssistantOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const propose = (variant: number) => {
    const next = generateDraft(description, variant);
    setDraft(next);
    setSpecs(next.specs.map(({ key, name }) => ({ key, name })));
    setError(null);
  };

  const renameSpec = (key: string, name: string) => {
    setSpecs(specs.map((spec) => (spec.key === key ? { ...spec, name } : spec)));
  };

  const removeSpec = (key: string) => {
    setSpecs(specs.filter((spec) => spec.key !== key));
  };

  const create = async () => {
    if (!draft || busy) return;
    const chosen = specs.map((spec) => ({ ...spec, name: spec.name.trim() })).filter((spec) => spec.name);
    if (chosen.length === 0) {
      setError("Deja al menos una spec en el borrador / Keep at least one spec in the draft");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await applyBoardPlan(draftToPlan(draft, chosen));
      setAssistantOpen(false);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const epicLabel = (key: string): string =>
    draft?.epics.find((epic) => epic.key === key)?.label ?? key;
  const epicOf = (specKey: string): string =>
    epicLabel(draft?.specs.find((spec) => spec.key === specKey)?.epicKey ?? "");
  const usedEpics = draft
    ? draft.epics.filter((epic) =>
        specs.some((s) => draft.specs.find((d) => d.key === s.key)?.epicKey === epic.key)
      )
    : [];

  return (
    <div className="modal-backdrop" onClick={close} role="presentation">
      <div
        className="modal wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Asistente de proyecto / Project assistant"
      >
        <h2>✨ Descríbeme tu proyecto / Describe your project</h2>

        {draft === null ? (
          <>
            <p className="modal-note">
              Escribe tu proyecto en una frase o párrafo y te propongo un borrador de board: idea,
              épicas y specs conectadas. Nada se guarda hasta que aceptes. / Write your project in a
              sentence or a paragraph and I will propose a draft board: idea, epics and connected
              specs. Nothing is saved until you accept.
            </p>
            <textarea
              autoFocus
              className="assistant-input"
              rows={4}
              value={description}
              placeholder="p. ej. una tienda online de plantas con pagos y panel de administración / e.g. an online plant store with payments and an admin panel"
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && description.trim()) propose(0);
              }}
            />
            <div className="modal-actions">
              <button className="btn" onClick={close}>
                Cancelar / Cancel
              </button>
              <button className="btn primary" disabled={!description.trim()} onClick={() => propose(0)}>
                ✨ Proponer borrador / Propose draft
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-note">
              Borrador (aún sin guardar): renombra o quita specs antes de crear. / Draft (not saved
              yet): rename or remove specs before creating.
            </p>
            {hasSpecs ? (
              <p className="modal-error">
                ⚠ Este workspace ya tiene specs; el asistente solo se aplica en un workspace vacío. /
                This workspace already has specs; the assistant only applies to an empty workspace.
              </p>
            ) : null}
            <div className="draft-preview">
              <p className="draft-idea">{draft.ideaText}</p>
              <p className="draft-meta">
                {specs.length} specs · {usedEpics.length}{" "}
                {usedEpics.length === 1 ? "épica / epic" : "épicas / epics"}:{" "}
                {usedEpics.map((epic) => epic.label).join(" · ")}
              </p>
              <div className="draft-list">
                {specs.map((spec) => (
                  <div className="draft-row" key={spec.key}>
                    <span className="draft-epic-tag" title="Épica / Epic">
                      {epicOf(spec.key)}
                    </span>
                    <input
                      value={spec.name}
                      onChange={(e) => renameSpec(spec.key, e.target.value)}
                      aria-label={`Nombre de la spec ${spec.key} / Spec name`}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Quitar / Remove"
                      title="Quitar / Remove"
                      onClick={() => removeSpec(spec.key)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            {error ? <p className="modal-error">⚠ {error}</p> : null}
            <div className="modal-actions">
              <button className="btn" onClick={() => setDraft(null)} disabled={busy}>
                ← Volver / Back
              </button>
              <button
                className="btn"
                onClick={() => propose(draft.variant + 1)}
                disabled={busy}
                title="Propone nombres alternativos / Proposes alternative names"
              >
                ↺ Regenerar / Regenerate
              </button>
              <button
                className="btn primary"
                onClick={() => void create()}
                disabled={busy || hasSpecs || specs.length === 0}
              >
                {busy ? "Creando… / Creating…" : "✅ Crear en el board / Create on the board"}
              </button>
            </div>
          </>
        )}

        <AgentPromptSection description={description} />
      </div>
    </div>
  );
}
