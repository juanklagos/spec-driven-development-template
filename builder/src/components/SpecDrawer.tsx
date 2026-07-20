import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../api";
import { useBuilderStore } from "../store";
import type { SpecDetail, TaskItem } from "../types";

const EXCERPT_LINES = 25;

export function SpecDrawer() {
  const specId = useBuilderStore((s) => s.selectedSpecId);
  const summary = useBuilderStore((s) => (s.selectedSpecId ? s.specs[s.selectedSpecId] : undefined));
  const specsVersion = useBuilderStore((s) => s.specsVersion);
  const selectSpec = useBuilderStore((s) => s.selectSpec);
  const applyTasks = useBuilderStore((s) => s.applyTasks);

  const [detail, setDetail] = useState<SpecDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingLine, setPendingLine] = useState<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  pendingRef.current = pendingLine;

  useEffect(() => {
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
      {loading ? <p className="drawer-dim">Cargando… / Loading…</p> : null}
      {error ? <p className="drawer-error">⚠ {error}</p> : null}
      {detail ? (
        <div className="drawer-body nowheel">
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
            Solo lectura — edita el contenido largo en tu editor. / Read-only — edit the long content in
            your editor.
          </p>
        </div>
      ) : null}
    </section>
  );
}
