import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type JobStatus = "QUEUED" | "RUNNING" | "PAUSED" | "COMPLETED" | "FAILED" | "CANCELLED";
type JobProgress = { step?: string; completed?: number; total?: number; percent?: number; message?: string; etaMs?: number; rate?: number };
type ImportJob = {
  id: string;
  type: string;
  provider?: string;
  status: JobStatus;
  progress?: JobProgress;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  result?: Record<string, unknown>;
  error?: { name?: string; message?: string; stack?: string };
  metadata?: Record<string, unknown>;
};

type ImportForm = {
  provider: string;
  limit: number;
  batchSize: number;
  mediaConcurrency: number;
  markMissingInactive: boolean;
  classifyProducts: boolean;
  forceClassification: boolean;
  importMedia: boolean;
  forceMedia: boolean;
  buildKnowledge: boolean;
  saveSnapshot: boolean;
};

const API_ROOT = "/api/v1";
const TERMINAL = new Set<JobStatus>(["COMPLETED", "FAILED", "CANCELLED"]);
const STAGES = [
  ["initialize", "Preparación"],
  ["download-and-normalize", "Descarga y normalización"],
  ["save-snapshot", "Snapshot de seguridad"],
  ["canonical-import", "Catálogo canónico"],
  ["product-brain-classification", "Clasificación Product Brain"],
  ["local-media-sync", "Imágenes locales"],
  ["knowledge-graph-build", "Grafo de conocimiento"],
  ["report", "Informe final"],
] as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof body.message === "string" ? body.message : `HTTP ${response.status}`);
  return body as T;
}

function formatDate(value?: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

function formatDuration(startedAt?: string, finishedAt?: string): string {
  if (!startedAt) return "—";
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const seconds = Math.max(0, Math.round((end - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes > 0 ? `${minutes} min ${rest} s` : `${rest} s`;
}

function progressPercent(job?: ImportJob): number {
  return Math.max(0, Math.min(100, Math.round(job?.progress?.percent ?? 0)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function metric(value: unknown, key: string): number | undefined {
  const record = asRecord(value);
  return typeof record[key] === "number" ? record[key] as number : undefined;
}

export function CatalogImportAdminApp() {
  const [form, setForm] = useState<ImportForm>({
    provider: "makito",
    limit: 100000,
    batchSize: 250,
    mediaConcurrency: 4,
    markMissingInactive: true,
    classifyProducts: true,
    forceClassification: false,
    importMedia: true,
    forceMedia: false,
    buildKnowledge: true,
    saveSnapshot: true,
  });
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selected, setSelected] = useState<ImportJob>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const pollingRef = useRef<number | undefined>(undefined);

  async function loadJobs() {
    const data = await request<{ items: ImportJob[] }>(`/catalog-imports?provider=${encodeURIComponent(form.provider)}`);
    setJobs(data.items);
    if (!selectedId && data.items[0]) setSelectedId(data.items[0].id);
  }

  async function loadSelected(id: string) {
    const job = await request<ImportJob>(`/catalog-imports/${encodeURIComponent(id)}`);
    setSelected(job);
    setJobs(current => current.map(item => item.id === job.id ? job : item));
    if (TERMINAL.has(job.status) && pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = undefined;
      void loadJobs();
    }
  }

  useEffect(() => {
    void loadJobs().catch(e => setError(e instanceof Error ? e.message : "No se pudo cargar el historial."));
  }, [form.provider]);

  useEffect(() => {
    if (!selectedId) return;
    void loadSelected(selectedId).catch(e => setError(e instanceof Error ? e.message : "No se pudo cargar el trabajo."));
    if (pollingRef.current) window.clearInterval(pollingRef.current);
    pollingRef.current = window.setInterval(() => {
      void loadSelected(selectedId).catch(() => undefined);
    }, 1500);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
      pollingRef.current = undefined;
    };
  }, [selectedId]);

  async function startImport(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      const job = await request<ImportJob & { jobId?: string }>(`/catalog-imports/${encodeURIComponent(form.provider)}`, {
        method: "POST",
        body: JSON.stringify({
          limit: form.limit,
          batchSize: form.batchSize,
          mediaConcurrency: form.mediaConcurrency,
          markMissingInactive: form.markMissingInactive,
          classifyProducts: form.classifyProducts,
          forceClassification: form.forceClassification,
          importMedia: form.importMedia,
          forceMedia: form.forceMedia,
          buildKnowledge: form.buildKnowledge,
          saveSnapshot: form.saveSnapshot,
        }),
      });
      const id = job.jobId ?? job.id;
      setSelectedId(id);
      await loadJobs();
      await loadSelected(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar la importación.");
    } finally {
      setBusy(false);
    }
  }

  async function pauseJob() {
    if (!selected || (selected.status !== "RUNNING" && selected.status !== "QUEUED")) return;
    setBusy(true);
    setError(undefined);
    try {
      await request(`/jobs/${encodeURIComponent(selected.id)}/pause`, { method: "POST", body: "{}" });
      await loadSelected(selected.id);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo pausar la importación.");
    } finally {
      setBusy(false);
    }
  }

  async function resumeJob() {
    if (!selected || selected.status !== "PAUSED") return;
    setBusy(true);
    setError(undefined);
    try {
      await request(`/jobs/${encodeURIComponent(selected.id)}/resume`, { method: "POST", body: "{}" });
      await loadSelected(selected.id);
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reanudar la importación.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelJob() {
    if (!selected || TERMINAL.has(selected.status)) return;
    setBusy(true);
    try {
      await request(`/jobs/${encodeURIComponent(selected.id)}/cancel`, { method: "POST", body: "{}" });
      await loadSelected(selected.id);
    } finally {
      setBusy(false);
    }
  }

  const currentStage = selected?.progress?.step ?? "queued";
  const currentStageIndex = STAGES.findIndex(([key]) => key === currentStage);
  const result = asRecord(selected?.result);
  const sync = asRecord(result.sync);
  const classification = asRecord(result.classification);
  const media = asRecord(result.media);
  const knowledge = asRecord(result.knowledge);
  const activeJob = useMemo(() => jobs.find(job => job.status === "RUNNING" || job.status === "QUEUED"), [jobs]);

  return <main className="importAdminShell">
    <header className="importAdminHeader">
      <div>
        <p>RecuerdArte · Administración</p>
        <h1>Importación de catálogos</h1>
        <span>Importa, clasifica y descarga imágenes en un único proceso supervisado.</span>
      </div>
      <nav><a href="/admin/catalog-intelligence">Catálogo Inteligente</a><a href="/">Volver a Rai</a></nav>
    </header>

    {error && <div className="importAdminError">{error}</div>}
    {activeJob && activeJob.id !== selectedId && <button className="importActiveNotice" onClick={() => setSelectedId(activeJob.id)}>
      Hay una importación {activeJob.status === "RUNNING" ? "en curso" : "en cola"}. Ver progreso →
    </button>}

    <div className="importAdminLayout">
      <section className="importAdminCard importConfigCard">
        <div className="importCardTitle"><div><small>Nueva ejecución</small><h2>Configurar importación</h2></div><span className="importProviderBadge">Makito</span></div>
        <form onSubmit={startImport}>
          <label>Proveedor<select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })}><option value="makito">Makito</option></select></label>
          <div className="importFieldsGrid">
            <label>Límite de productos<input type="number" min="1" value={form.limit} onChange={e => setForm({ ...form, limit: Number(e.target.value) })}/></label>
            <label>Tamaño de lote<input type="number" min="10" value={form.batchSize} onChange={e => setForm({ ...form, batchSize: Number(e.target.value) })}/></label>
            <label>Concurrencia de imágenes<input type="number" min="1" max="12" value={form.mediaConcurrency} onChange={e => setForm({ ...form, mediaConcurrency: Number(e.target.value) })}/></label>
          </div>
          <fieldset><legend>Fases incluidas</legend>
            <label><input type="checkbox" checked={form.saveSnapshot} onChange={e => setForm({ ...form, saveSnapshot: e.target.checked })}/> Snapshot de seguridad</label>
            <label><input type="checkbox" checked={form.classifyProducts} onChange={e => setForm({ ...form, classifyProducts: e.target.checked })}/> Clasificar con Product Brain</label>
            <label><input type="checkbox" checked={form.importMedia} onChange={e => setForm({ ...form, importMedia: e.target.checked })}/> Descargar imágenes localmente</label>
            <label><input type="checkbox" checked={form.buildKnowledge} onChange={e => setForm({ ...form, buildKnowledge: e.target.checked })}/> Actualizar grafo de conocimiento</label>
            <label><input type="checkbox" checked={form.markMissingInactive} onChange={e => setForm({ ...form, markMissingInactive: e.target.checked })}/> Desactivar referencias ausentes del proveedor</label>
          </fieldset>
          <details><summary>Opciones avanzadas</summary>
            <label><input type="checkbox" checked={form.forceClassification} onChange={e => setForm({ ...form, forceClassification: e.target.checked })}/> Forzar reclasificación de todos los productos</label>
            <label><input type="checkbox" checked={form.forceMedia} onChange={e => setForm({ ...form, forceMedia: e.target.checked })}/> Volver a descargar imágenes existentes</label>
          </details>
          <button className="importStartButton" disabled={busy || Boolean(activeJob)} type="submit">{activeJob ? "Hay una importación activa" : busy ? "Iniciando…" : "Iniciar importación completa"}</button>
          <p className="importFormHint">El proceso es incremental: omite productos e imágenes que no han cambiado.</p>
        </form>
      </section>

      <section className="importAdminCard importProgressCard">
        <div className="importCardTitle"><div><small>Trabajo seleccionado</small><h2>{selected ? `${selected.provider ?? "Catálogo"} · ${selected.status}` : "Sin ejecución seleccionada"}</h2></div>{selected && <span className={`importStatus importStatus--${selected.status.toLowerCase()}`}>{selected.status}</span>}</div>
        {!selected ? <div className="importEmpty">Inicia una importación o selecciona una ejecución del historial.</div> : <>
          <div className="importProgressHero"><div><strong>{progressPercent(selected)}%</strong><span>{selected.progress?.message ?? "Preparando el trabajo"}</span></div><div className="importProgressTrack"><i style={{ width: `${progressPercent(selected)}%` }}/></div><small>{selected.progress?.completed ?? 0} / {selected.progress?.total ?? 0} · {formatDuration(selected.startedAt, selected.finishedAt)}</small></div>
          <div className="importStageList">{STAGES.map(([key, label], index) => {
            const isDone = selected.status === "COMPLETED" || currentStageIndex > index;
            const isActive = selected.status === "RUNNING" && currentStageIndex === index;
            return <div className={`importStage ${isDone ? "is-done" : ""} ${isActive ? "is-active" : ""}`} key={key}><span>{isDone ? "✓" : index + 1}</span><div><strong>{label}</strong><small>{isActive ? selected.progress?.message ?? "En curso" : isDone ? "Completado" : "Pendiente"}</small></div></div>;
          })}</div>
          {selected.status === "FAILED" && <div className="importFailure"><strong>{selected.error?.name ?? "Error"}</strong><p>{selected.error?.message ?? "La importación no pudo completarse."}</p></div>}
          {!TERMINAL.has(selected.status) && <div className="importJobActions">
            {(selected.status === "RUNNING" || selected.status === "QUEUED") && <button className="importPauseButton" disabled={busy} onClick={() => void pauseJob()}>Pausar</button>}
            {selected.status === "PAUSED" && <button className="importResumeButton" disabled={busy} onClick={() => void resumeJob()}>Reanudar</button>}
            <button className="importCancelButton" disabled={busy} onClick={() => void cancelJob()}>Cancelar definitivamente</button>
          </div>}
          {selected.status === "PAUSED" && <div className="importPausedNotice"><strong>Importación pausada</strong><p>Al reanudar, el pipeline volverá a comprobar el catálogo y omitirá automáticamente productos, clasificaciones e imágenes ya completados.</p></div>}
          {selected.status === "COMPLETED" && <div className="importResultGrid">
            <article><strong>{metric(sync, "processed") ?? metric(sync, "scanned") ?? "—"}</strong><span>Productos procesados</span></article>
            <article><strong>{metric(classification, "classified") ?? "—"}</strong><span>Clasificados</span></article>
            <article><strong>{metric(media, "downloaded") ?? "—"}</strong><span>Imágenes descargadas</span></article>
            <article><strong>{metric(knowledge, "nodes") ?? metric(knowledge, "created") ?? "—"}</strong><span>Nodos de conocimiento</span></article>
          </div>}
          <details className="importTechnical"><summary>Ver resultado técnico</summary><pre>{JSON.stringify(selected.result ?? selected, null, 2)}</pre></details>
        </>}
      </section>
    </div>

    <section className="importAdminCard importHistoryCard">
      <div className="importCardTitle"><div><small>Auditoría</small><h2>Historial de importaciones</h2></div><button onClick={() => void loadJobs()}>Actualizar</button></div>
      <div className="importHistoryTable"><table><thead><tr><th>Inicio</th><th>Proveedor</th><th>Estado</th><th>Progreso</th><th>Duración</th><th></th></tr></thead><tbody>{jobs.map(job => <tr key={job.id} className={job.id === selectedId ? "is-selected" : ""}><td>{formatDate(job.createdAt)}</td><td>{job.provider ?? "—"}</td><td><span className={`importStatus importStatus--${job.status.toLowerCase()}`}>{job.status}</span></td><td>{progressPercent(job)}% · {job.progress?.step ?? "queued"}</td><td>{formatDuration(job.startedAt, job.finishedAt)}</td><td><button onClick={() => setSelectedId(job.id)}>Ver</button></td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
