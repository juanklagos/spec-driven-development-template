// "Implement with agent" modal (spec 008, R2). Copy-first by design: no
// fragile deep links into a specific agent app — the exact, gate-respecting
// kickoff prompt is preloaded and copyable, and works with any agent
// (Claude Code, Codex, Cursor, ...). Only reachable for APPROVED specs; the
// hard stop lives on the drawer button that opens this modal.

import { useEffect } from "react";
import { buildImplementPrompt } from "../prompts";
import { PromptBox } from "./PromptBox";

interface Props {
  specId: string;
  /** Absolute spec directory (summary.dir from the API). */
  specDir: string;
  projectRoot: string;
  onClose: () => void;
}

export function ImplementModal({ specId, specDir, projectRoot, onClose }: Props) {
  const prompt = buildImplementPrompt({ projectRoot, specId, specDir });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Implementar ${specId} con agente / Implement ${specId} with an agent`}
      >
        <h2>🤖 Implementar con agente / Implement with agent</h2>
        <p className="modal-note">
          Copia este prompt y pégalo en tu agente (Claude Code, Codex, Cursor…). Incluye el
          workspace, la spec aprobada y la compuerta SDD con consentimiento. / Copy this prompt and
          paste it into your agent (Claude Code, Codex, Cursor…). It includes the workspace, the
          approved spec and the SDD gate with consent.
        </p>
        <PromptBox prompt={prompt} rows={14} />
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            Cerrar / Close
          </button>
        </div>
      </div>
    </div>
  );
}
