import { useEffect, useMemo, useState } from "react";

interface ModuleDefinition {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly category: string;
  readonly description: string;
  readonly testScript?: string;
  readonly targetMs?: number;
}

interface HealthResult {
  readonly moduleId: string;
  readonly status: "HEALTHY" | "DEGRADED" | "UNAVAILABLE" | "UNKNOWN";
  readonly checkedAt: string;
  readonly durationMs: number;
  readonly message: string;
}

interface Snapshot {
  readonly generatedAt: string;
  readonly platformVersion: string;
  readonly nodeVersion: string;
  readonly platform: string;
  readonly uptimeSeconds: number;
  readonly modules: readonly ModuleDefinition[];
  readonly health: readonly HealthResult[];
  readonly summary: {
    readonly totalModules: number;
    readonly healthy: number;
    readonly degraded: number;
    readonly unavailable: number;
    readonly unknown: number;
  };
}

function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function PlatformHealthApp() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function refresh(): Promise<void> {
    setBusy(true);
    setError(undefined);
    try {
      const response = await fetch("/api/v1/platform-foundation/health");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setSnapshot(await response.json() as Snapshot);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const rows = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.modules
      .map((module) => ({
        module,
        health: snapshot.health.find((item) => item.moduleId === module.id),
      }))
      .filter(({ health }) =>
        filter === "all" ? true : health?.status === filter,
      );
  }, [snapshot, filter]);

  async function copyDiagnostic(): Promise<void> {
    await navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
  }

  return (
    <main className="platformHealth">
      <header className="platformHealth__header">
        <div>
          <p>RecuerdArte · Plataforma</p>
          <h1>System Health Dashboard</h1>
          <span>
            Salud, versiones, tests y observabilidad de Platform 2.0.
          </span>
        </div>
        <div className="platformHealth__actions">
          <button type="button" onClick={() => void refresh()} disabled={busy}>
            {busy ? "Comprobando…" : "Actualizar"}
          </button>
          <button type="button" onClick={() => void copyDiagnostic()}>
            Copiar diagnóstico
          </button>
          <button
            type="button"
            onClick={() =>
              snapshot &&
              downloadJson(
                `recuerdarte-platform-health-${new Date().toISOString().replace(/[:.]/gu, "-")}.json`,
                snapshot,
              )
            }
          >
            Exportar JSON
          </button>
          <a href="/admin/tools">Consola de ingeniería</a>
        </div>
      </header>

      {error ? <div className="platformHealth__error">{error}</div> : null}

      {snapshot ? (
        <>
          <section className="platformHealth__summary">
            <article><span>Módulos</span><strong>{snapshot.summary.totalModules}</strong></article>
            <article><span>Saludables</span><strong>{snapshot.summary.healthy}</strong></article>
            <article><span>Degradados</span><strong>{snapshot.summary.degraded}</strong></article>
            <article><span>No disponibles</span><strong>{snapshot.summary.unavailable}</strong></article>
            <article><span>Uptime</span><strong>{snapshot.uptimeSeconds}s</strong></article>
          </section>

          <section className="platformHealth__meta">
            <span>Platform {snapshot.platformVersion}</span>
            <span>Node {snapshot.nodeVersion}</span>
            <span>{snapshot.platform}</span>
            <span>{snapshot.generatedAt}</span>
          </section>

          <section className="platformHealth__toolbar">
            <label>
              Estado
              <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="HEALTHY">Saludables</option>
                <option value="DEGRADED">Degradados</option>
                <option value="UNAVAILABLE">No disponibles</option>
                <option value="UNKNOWN">Desconocidos</option>
              </select>
            </label>
          </section>

          <section className="platformHealth__modules">
            {rows.map(({ module, health }) => (
              <article key={module.id}>
                <header>
                  <div>
                    <span>{module.category}</span>
                    <h2>{module.name}</h2>
                    <small>v{module.version}</small>
                  </div>
                  <b className={`status status--${health?.status.toLowerCase() ?? "unknown"}`}>
                    {health?.status ?? "UNKNOWN"}
                  </b>
                </header>
                <p>{module.description}</p>
                <dl>
                  <div><dt>Comprobación</dt><dd>{health?.durationMs ?? 0} ms</dd></div>
                  <div><dt>Objetivo</dt><dd>{module.targetMs ? `${module.targetMs} ms` : "—"}</dd></div>
                </dl>
                <code>{module.testScript ?? "Sin test registrado"}</code>
                <footer>{health?.message}</footer>
              </article>
            ))}
          </section>
        </>
      ) : (
        <p>Cargando estado de la plataforma…</p>
      )}
    </main>
  );
}
