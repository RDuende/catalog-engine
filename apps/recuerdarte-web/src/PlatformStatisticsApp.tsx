import { useEffect, useMemo, useState } from "react";

type Dict = Record<string, unknown>;
type Snapshot = {
  generatedAt: string;
  catalog: Dict;
  productBrain: Dict;
  media: Dict;
  knowledge: Dict;
  recommendations: Dict;
  imports: Dict;
  quality: Dict;
};

function n(value: unknown): number { return typeof value === "number" ? value : Number(value ?? 0); }
function fmt(value: unknown): string { return new Intl.NumberFormat("es-ES").format(n(value)); }
function pct(value: unknown): string { return `${n(value).toFixed(1).replace(".0", "")}%`; }
function bytes(value: unknown): string {
  const size = n(value);
  if (size >= 1024 ** 3) return `${(size / 1024 ** 3).toFixed(2)} GB`;
  if (size >= 1024 ** 2) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024).toFixed(1)} KB`;
}
function duration(value: unknown): string {
  const ms = n(value);
  if (!ms) return "—";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return minutes ? `${minutes} min ${seconds} s` : `${seconds} s`;
}
function entries(value: unknown): [string, number][] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Dict).map(([key, count]): [string, number] => [key, n(count)]).sort((a, b) => b[1] - a[1]);
}
function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return <article className="statsMetric"><span>{label}</span><strong>{value}</strong>{hint && <small>{hint}</small>}</article>;
}
function Breakdown({ title, values }: { title: string; values: [string, number][] }) {
  const max = Math.max(1, ...values.map(([, value]) => value));
  return <section className="statsPanel"><h3>{title}</h3><div className="statsBars">{values.slice(0, 12).map(([label, value]) => <div className="statsBar" key={label}><div><span>{label.replaceAll("_", " ")}</span><b>{fmt(value)}</b></div><i><em style={{ width: `${Math.max(2, value / max * 100)}%` }}/></i></div>)}</div></section>;
}

export function PlatformStatisticsApp() {
  const [data, setData] = useState<Snapshot>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setError(undefined);
    try {
      const response = await fetch("/api/v1/platform-statistics");
      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "No se pudieron cargar las estadísticas.");
      setData(body as Snapshot);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error desconocido"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 30000); return () => window.clearInterval(timer); }, []);
  const imports = useMemo(() => Array.isArray(data?.imports.latest) ? data?.imports.latest as Dict[] : [], [data]);

  return <main className="statsShell">
    <header className="statsHeader"><div><p>RecuerdArte · Administración</p><h1>Estadísticas de plataforma</h1><span>Métricas reales del catálogo, clasificación, medios, importaciones y recomendaciones.</span></div><nav><a href="/admin/catalog-imports">Importaciones</a><a href="/admin/catalog-intelligence">Catálogo Inteligente</a><a href="/">Rai</a></nav></header>
    <div className="statsToolbar"><span>{data ? `Actualizado ${new Date(data.generatedAt).toLocaleString("es-ES")}` : "Esperando datos"}</span><button onClick={() => void load()} disabled={loading}>{loading ? "Actualizando…" : "Actualizar"}</button></div>
    {error && <div className="statsError">{error}</div>}
    {!data ? <div className="statsEmpty">{loading ? "Calculando métricas…" : "No hay datos disponibles."}</div> : <>
      <section className="statsHeroGrid">
        <Metric label="Productos" value={fmt(data.catalog.products)} hint={`${fmt(data.catalog.active)} activos`} />
        <Metric label="Product Brain" value={pct(data.productBrain.coveragePercent)} hint={`${fmt(data.productBrain.ready)} listos · ${fmt(data.productBrain.reviewRequired)} en revisión`} />
        <Metric label="Cobertura de imágenes" value={pct(data.quality.mediaCoveragePercent)} hint={`${fmt(data.media.local)} locales · ${fmt(data.media.remote)} remotas`} />
        <Metric label="Archivos locales" value={fmt(data.media.localFiles)} hint={bytes(data.media.localBytes)} />
        <Metric label="Grafo de conocimiento" value={fmt(data.knowledge.entities)} hint={`${fmt(data.knowledge.relations)} relaciones`} />
        <Metric label="Importaciones" value={fmt(data.imports.total)} hint={`${pct(data.imports.successPercent)} completadas correctamente`} />
      </section>

      <section className="statsSection"><div className="statsSectionTitle"><div><small>Calidad de datos</small><h2>Estado general del catálogo</h2></div></div><div className="statsQualityGrid">
        {[['Descripciones', data.quality.descriptionCoveragePercent], ['Categorías', data.quality.categoryCoveragePercent], ['Imágenes', data.quality.mediaCoveragePercent], ['Imágenes locales', data.quality.localMediaPercent], ['Product Brain', data.quality.brainCoveragePercent]].map(([label, value]) => <article key={String(label)}><div><span>{String(label)}</span><strong>{pct(value)}</strong></div><i><em style={{ width: `${Math.min(100, n(value))}%` }}/></i></article>)}
      </div></section>

      <section className="statsColumns">
        <Breakdown title="Productos por proveedor" values={entries(data.catalog.byProvider)} />
        <Breakdown title="Objetos físicos más frecuentes" values={entries(data.productBrain.byObjectType)} />
        <Breakdown title="Intereses clasificados" values={entries(data.productBrain.byInterest)} />
        <Breakdown title="Roles dentro del regalo" values={entries(data.productBrain.byRole)} />
      </section>

      <section className="statsSection"><div className="statsSectionTitle"><div><small>Operación</small><h2>Importaciones y almacenamiento</h2></div></div><div className="statsMetricGrid">
        <Metric label="Completadas" value={fmt(data.imports.completed)} />
        <Metric label="Fallidas" value={fmt(data.imports.failed)} />
        <Metric label="En curso" value={fmt(data.imports.running)} />
        <Metric label="Duración media" value={duration(data.imports.averageDurationMs)} />
        <Metric label="Medios registrados" value={fmt(data.media.total)} />
        <Metric label="Productos sin imagen" value={fmt(data.media.productsWithoutMedia)} />
      </div>
      <div className="statsTableWrap"><table><thead><tr><th>Fecha</th><th>Proveedor</th><th>Estado</th><th>Fase</th><th>Progreso</th></tr></thead><tbody>{imports.map((job) => { const progress = (job.progress && typeof job.progress === "object" ? job.progress : {}) as Dict; return <tr key={String(job.id)}><td>{job.createdAt ? new Date(String(job.createdAt)).toLocaleString("es-ES") : "—"}</td><td>{String(job.provider ?? "—")}</td><td><span className={`statsStatus statsStatus--${String(job.status).toLowerCase()}`}>{String(job.status)}</span></td><td>{String(progress.step ?? "—")}</td><td>{fmt(progress.completed)} / {fmt(progress.total)}</td></tr>; })}</tbody></table></div></section>

      <section className="statsColumns statsColumns--three">
        <section className="statsPanel"><h3>Clasificación media</h3><div className="statsMetricGrid statsMetricGrid--small"><Metric label="Confianza" value={pct(n(data.productBrain.averageConfidence) * 100)} /><Metric label="Personalización" value={pct(n(data.productBrain.averagePersonalization) * 100)} /><Metric label="Calidad como regalo" value={pct(n(data.productBrain.averageGiftSuitability) * 100)} /></div></section>
        <section className="statsPanel"><h3>Recomendaciones</h3><div className="statsMetricGrid statsMetricGrid--small"><Metric label="Ejecuciones" value={fmt(data.recommendations.runs)} /><Metric label="Recomendaciones" value={fmt(data.recommendations.recommendations)} /><Metric label="Compradas" value={fmt(data.recommendations.purchased)} /><Metric label="Conversión" value={pct(data.recommendations.conversionPercent)} /></div></section>
        <Breakdown title="Nodos por tipo" values={entries(data.knowledge.byType)} />
      </section>
    </>}
  </main>;
}
