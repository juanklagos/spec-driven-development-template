import { useEffect, useState, type FormEvent } from "react";
import { errorMessage } from "../api";

interface Props {
  onClose: () => void;
  onCreate: (name: string, owner: string) => Promise<void>;
}

export function NewSpecModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate(name.trim(), owner.trim());
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void submit(e)}
        aria-label="Nueva spec / New spec"
      >
        <h2>📋 Nueva spec / New spec</h2>
        <label>
          Nombre / Name
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="p. ej. checkout / e.g. checkout"
          />
        </label>
        <label>
          Owner (opcional / optional)
          <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Nombre / Name" />
        </label>
        <p className="modal-note">
          Se creará la carpeta real <code>specs/NNN-slug/</code> con spec, plan, tasks e history. / The
          real <code>specs/NNN-slug/</code> folder will be created with spec, plan, tasks and history.
        </p>
        {error ? <p className="modal-error">⚠ {error}</p> : null}
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose} disabled={busy}>
            Cancelar / Cancel
          </button>
          <button type="submit" className="btn primary" disabled={busy || !name.trim()}>
            {busy ? "Creando… / Creating…" : "Crear / Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
