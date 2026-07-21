import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../api";
import { useBuilderStore } from "../store";
import { SectionEditor } from "./SectionEditor";
import type { SpecDetail, TaskItem } from "../types";

const EXCERPT_LINES = 25;

type DrawerTab = "view" | "edit";

// Inline confirmation for "Approve spec": asks who approves and states what
// will be written into spec.md before touching the disk (spec 007, R2).
function ApprovePanel({ specId, onDone }: { specId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [approver, setApprover] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!approver.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.approveSpec(specId, approver.trim());
      setOpen(false);
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button className="btn primary approve-btn" onClick={() => setOpen(true)}>
        ✅ Aprobar spec / Approve spec
      </button>
    );
  }

  return (
    <div className="approve-panel">
      <p className="drawer-note">
        Se escribirá la aprobación real en spec.md (estado, fecha de hoy y aprobador). / The real
        approval will be written into spec.md (status, today's date and approver).
      </p>
      <input
        autoFocus
        value={approver}
        placeholder="¿Quién aprueba? / Who approves?"
        onChange={(e) => setApprover(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void confirm();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      {error ? <p className="drawer-error">⚠ {error}</p> : null}
      <div className="approve-actions">
        <button className="btn small" onClick={() => setOpen(false)} disabled={busy}>
          Cancelar / Cancel
        </button>
        <button className="btn small primary" onClick={() => void confirm()} disabled={busy || !approver.trim()}>
          {busy ? "Aprobando… / Approving…" : "Confirmar / Confirm"}
        </button>
      </div>
    </div>
  );
}

export function SpecDrawer() {
  const specId = useBuilderStore((s) => s.selectedSpecId);
  const summary = useBuilderStore((s) => (s.selectedSpecId ? s.specs[s.selectedSpecId] : undefined));
  const specsVersion = useBuilderStore((s) => s.specsVersion);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const applyTasks = useBuilderStore((s) => s.applyTasks);
  const refreshSpecs = useBuilderStore((s) => s.refreshSpecs);
  const refreshGate = useBuilderStore((s) => s.refreshGate);

  const [tab, setTab] = useState<DrawerTab>("view");
  const [detail, setDetail] = useState<SpecDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingLine, setPendingLine] = useState<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  pendingRef.current = pendingLine;

  useEffect(() => {
    setTab("view");
    if (!specId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    api
      .getSpec(specId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [specId]);

  // Live sync: when spec documents change on disk (specsVersion bump from the
  // SSE watcher), silently re-fetch the open spec so the drawer reflects the
  // disk without a loading flash. Skipped while a checkbox toggle is in
  // flight — that PUT already returns the fresh tasks.
  useEffect(() => {
    if (!specId || specsVersion === 0) return;
    if (pendingRef.current !== null) return;
    let cancelled = false;
    api
      .getSpec(specId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        // Keep showing the last good detail; the next change will retry.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specsVersion, specId]);

  if (!specId) return null;

  const toggle = async (task: TaskItem) => {
    if (!detail || pendingLine !== null) return;
    setPendingLine(task.line);
    setError(null);
    try {
      const res = await api.putTask(specId, task.line, !task.done);
      setDetail({ ...detail, tasks: res.tasks });
      applyTasks(specId, res.tasks);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPendingLine(null);
    }
  };

  const refetchDetail = () => {
    api
      .getSpec(specId)
      .then(setDetail)
      .catch(() => {
        // The SSE change event will retry shortly.
      });
  };

  const handleApproved = () => {
    refetchDetail();
    void refreshSpecs();
    void refreshGate();
  };

  const handleSectionsSaved = () => {
    refetchDetail();
    void refreshGate();
  };

  const isApproved = summary ? /aprobado|approved/i.test(summary.status) : false;
  const excerpt = detail ? detail.docs.spec.split("\n").slice(0, EXCERPT_LINES).join("\n") : "";

  return (
    <section className="drawer" aria-label={`Detalle de spec ${specId} / Spec detail`}>
      <header className="drawer-head">
        <h2>📋 {specId}</h2>
        <button className="icon-btn" onClick={() => selectSpec(null)} aria-label="Cerrar / Close">
          ✕
        </button>
      </header>
      {summary ? (
        <p className="drawer-sub">
          <span className={`badge ${isApproved ? "ok" : "pending"}`}>{summary.status}</span>
          <code>{summary.dir}</code>
        </p>
      ) : null}
      <nav className="drawer-tabs" aria-label="Pestañas / Tabs">
        <button className={`drawer-tab${tab === "view" ? " active" : ""}`} onClick={() => setTab("view")}>
          Ver / View
        </button>
        <button className={`drawer-tab${tab === "edit" ? " active" : ""}`} onClick={() => setTab("edit")}>
          ✏️ Editar / Edit
        </button>
      </nav>
      {loading ? <p className="drawer-dim">Cargando… / Loading…</p> : null}
      {error ? <p className="drawer-error">⚠ {error}</p> : null}
      {detail && tab === "view" ? (
        <div className="drawer-body nowheel">
          {!isApproved ? <ApprovePanel specId={specId} onDone={handleApproved} /> : null}
          <h3>Tareas / Tasks</h3>
          <ul className="task-list">
            {detail.tasks.length === 0 ? (
              <li className="drawer-dim">Sin tareas / No tasks</li>
            ) : (
              detail.tasks.map((task) => (
                <li key={task.line}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.done}
                      disabled={pendingLine !== null}
                      onChange={() => void toggle(task)}
                    />
                    <span className={task.done ? "task-done" : ""}>{task.text}</span>
                  </label>
                </li>
              ))
            )}
          </ul>
          <h3>spec.md (extracto / excerpt)</h3>
          <pre className="spec-excerpt">{excerpt}</pre>
          <p className="drawer-note">
            Usa la pestaña «Editar» para las secciones guiadas; el contenido largo se edita en tu
            editor. / Use the “Edit” tab for the guided sections; long-form content is edited in your
            editor.
          </p>
        </div>
      ) : null}
      {detail && tab === "edit" ? (
        <div className="drawer-body nowheel">
          <SectionEditor specId={specId} specMarkdown={detail.docs.spec} onSaved={handleSectionsSaved} />
        </div>
      ) : null}
    </section>
  );
}
