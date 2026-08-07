import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { DiagnosticsPanel } from "./DiagnosticsPanel";

type ErrorBoundaryProps = { readonly children: ReactNode };
type ErrorBoundaryState = { readonly error?: Error };

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {};
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo): void { console.error("[RecuerdArte] Error de interfaz", { error, componentStack: info.componentStack }); }
  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return <main id="main-content" tabIndex={-1} className="qualityFallback" role="alert"><span aria-hidden="true">RA</span><h1>El recuerdo sigue a salvo.</h1><p>La interfaz ha encontrado un problema inesperado. Tu sesión local no se ha eliminado.</p><details><summary>Detalle técnico</summary><pre>{this.state.error.message}</pre></details><button type="button" onClick={() => window.location.reload()}>Volver a intentarlo</button></main>;
  }
}

function ConnectivityStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);
  if (online) return null;
  return <div className="connectivityBanner" role="status" aria-live="polite"><strong>Sin conexión.</strong> Tu sesión permanece en este dispositivo y volveremos a intentarlo al recuperar internet.</div>;
}

export function QualityShell({ children }: ErrorBoundaryProps) {
  return <AppErrorBoundary><a className="skipLink" href="#main-content">Saltar al contenido</a><ConnectivityStatus />{children}<DiagnosticsPanel /></AppErrorBoundary>;
}
