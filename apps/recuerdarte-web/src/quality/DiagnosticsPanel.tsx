import { useCallback, useEffect, useMemo, useState } from "react";
import { getDiagnosticRequests, subscribeDiagnostics, type DiagnosticRequest } from "./diagnostics";

type ServiceState = "checking" | "online" | "degraded" | "offline";
type ServiceCheck = { readonly id: string; readonly label: string; readonly path: string; readonly state: ServiceState; readonly latencyMs?: number; readonly detail?: string };

const SESSION_KEY = "recuerdarte.rai-session.v1";

function readSession(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

async function checkService(id: string, label: string, path: string): Promise<ServiceCheck> {
  const started = performance.now();
  try {
    const response = await fetch(path, { headers: { accept: "application/json" } });
    const latencyMs = Math.round(performance.now() - started);
    return { id, label, path, latencyMs, state: response.ok ? "online" : "degraded", detail: `HTTP ${response.status}` };
  } catch (error) {
    return { id, label, path, latencyMs: Math.round(performance.now() - started), state: "offline", detail: error instanceof Error ? error.message : "Sin respuesta" };
  }
}

function stateLabel(state: ServiceState): string {
  if (state === "online") return "Disponible";
  if (state === "degraded") return "Con incidencias";
  if (state === "offline") return "No disponible";
  return "Comprobando";
}

function RequestRow({ request }: { readonly request: DiagnosticRequest }) {
  return <li>
    <span className={`diagnosticRequestState ${request.error ? "offline" : request.ok ? "online" : "degraded"}`} aria-hidden="true" />
    <div><strong>{request.method} {request.url.replace(window.location.origin, "")}</strong><small>{request.error ?? (request.status ? `HTTP ${request.status}` : "Sin estado")}</small></div>
    <b>{request.durationMs} ms</b>
  </li>;
}

export function DiagnosticsPanel() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<readonly ServiceCheck[]>([]);
  const [requests, setRequests] = useState<readonly DiagnosticRequest[]>(getDiagnosticRequests());
  const session = useMemo(readSession, [open]);

  useEffect(() => subscribeDiagnostics(() => setRequests(getDiagnosticRequests())), []);

  const runChecks = useCallback(async () => {
    setServices([
      { id: "backend", label: "Backend", path: "/health", state: "checking" },
      { id: "experience", label: "Experience API", path: "/api/v1/presentations/templates", state: "checking" },
    ]);
    setServices(await Promise.all([
      checkService("backend", "Backend", "/health"),
      checkService("experience", "Experience API", "/api/v1/presentations/templates"),
    ]));
  }, []);

  useEffect(() => {
    if (open) void runChecks();
  }, [open, runChecks]);

  function exportDiagnostics(): void {
    const payload = {
      exportedAt: new Date().toISOString(),
      online: navigator.onLine,
      location: window.location.href,
      userAgent: navigator.userAgent,
      session: { sessionId: session.sessionId, journeyId: session.journeyId, credentials: session.credentials ? "[REDACTED]" : undefined },
      services,
      requests,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recuerdarte-diagnostics-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <>
    <button type="button" className="diagnosticsLauncher" onClick={() => setOpen(true)} aria-label="Abrir diagnóstico">Diagnóstico</button>
    {open && <section className="diagnosticsOverlay" role="dialog" aria-modal="true" aria-label="Centro de diagnóstico">
      <div className="diagnosticsPanel">
        <header><div><small>RC2 · OBSERVABILIDAD</small><h2>Centro de diagnóstico</h2><p>Estado técnico de esta sesión y de los servicios principales.</p></div><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar diagnóstico">×</button></header>
        <div className="diagnosticsSummary">
          <article><span className={navigator.onLine ? "online" : "offline"} /><div><small>Conectividad</small><strong>{navigator.onLine ? "En línea" : "Sin conexión"}</strong></div></article>
          <article><span className={session.journeyId ? "online" : "degraded"} /><div><small>Journey</small><strong>{session.journeyId ? String(session.journeyId).slice(0, 12) : "Sin iniciar"}</strong></div></article>
          <article><span className="online" /><div><small>Frontend</small><strong>RC2</strong></div></article>
        </div>
        <section className="diagnosticsSection"><div className="diagnosticsSectionTitle"><h3>Servicios</h3><button type="button" onClick={() => void runChecks()}>Volver a comprobar</button></div><div className="serviceGrid">{services.map((service) => <article key={service.id}><span className={service.state} /><div><strong>{service.label}</strong><small>{service.detail ?? service.path}</small></div><b>{stateLabel(service.state)}{service.latencyMs !== undefined ? ` · ${service.latencyMs} ms` : ""}</b></article>)}</div></section>
        <section className="diagnosticsSection"><div className="diagnosticsSectionTitle"><h3>Últimas solicitudes</h3><span>{requests.length} registradas</span></div>{requests.length ? <ol className="diagnosticRequests">{requests.slice(0, 12).map((request) => <RequestRow key={request.id} request={request} />)}</ol> : <p className="diagnosticsEmpty">Todavía no se han registrado solicitudes en esta sesión.</p>}</section>
        <footer><button type="button" className="diagnosticsSecondary" onClick={() => setOpen(false)}>Cerrar</button><button type="button" onClick={exportDiagnostics}>Exportar diagnóstico</button></footer>
      </div>
    </section>}
  </>;
}
