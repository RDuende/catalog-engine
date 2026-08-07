import { useEffect, useMemo, useState } from "react";

type ServiceStatus = "available" | "planned" | "attention";
type ServiceCard = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href?: string;
  readonly eyebrow: string;
  readonly icon: string;
  readonly status: ServiceStatus;
  readonly statusLabel: string;
  readonly metrics?: readonly string[];
};

type StatisticsSnapshot = {
  readonly generatedAt?: string;
  readonly catalog?: Record<string, unknown>;
  readonly productBrain?: Record<string, unknown>;
  readonly media?: Record<string, unknown>;
  readonly imports?: Record<string, unknown>;
};

const SERVICES: readonly ServiceCard[] = [
  {
    id: "catalog-intelligence",
    eyebrow: "CATÁLOGO",
    title: "Catálogo Inteligente",
    description: "Explora productos, imágenes, clasificación Product Brain y diagnósticos del recomendador.",
    href: "/admin/catalog-intelligence",
    icon: "◫",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Productos", "Product Brain", "Diagnóstico"],
  },
  {
    id: "catalog-imports",
    eyebrow: "OPERACIONES",
    title: "Importación de catálogos",
    description: "Importa, normaliza, clasifica y descarga medios en un único pipeline controlado.",
    href: "/admin/catalog-imports",
    icon: "⇩",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Proveedores", "Progreso", "Historial"],
  },
  {
    id: "statistics",
    eyebrow: "ANÁLISIS",
    title: "Estadísticas",
    description: "Consulta cobertura, calidad de datos, almacenamiento, importaciones y rendimiento del sistema.",
    href: "/admin/statistics",
    icon: "▥",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Métricas", "Calidad", "Tendencias"],
  },
  {
    id: "providers",
    eyebrow: "OPERACIONES",
    title: "Proveedores",
    description: "Añade y configura fuentes de catálogo, credenciales, capacidades, políticas de sincronización y estado operativo.",
    href: "/admin/providers",
    icon: "◈",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Conexiones", "Credenciales", "Sincronización"],
  },
  {
    id: "settings",
    eyebrow: "SISTEMA",
    title: "Settings",
    description: "Configura proveedores, IA, importaciones, medios, almacenamiento y futura integración con RDgest.",
    href: "/admin/settings",
    icon: "⚙",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Variables", "Secretos", "RDgest"],
  },
  {
    id: "ai-lab",
    eyebrow: "INTELIGENCIA",
    title: "Laboratorio IA",
    description: "Simula casos, inspecciona el Gift Profile y compara el ranking real del catálogo.",
    href: "/admin/ai-lab",
    icon: "✧",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Simulación", "Ranking", "Pruebas"],
  },
  {
    id: "intelligence-center",
    eyebrow: "INTELIGENCIA",
    title: "Centro de Inteligencia",
    description: "Sigue cada decisión desde el mensaje hasta las semillas de propuesta con trazabilidad completa.",
    href: "/admin/intelligence-center",
    icon: "◎",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Trazas", "Etapas", "Explicabilidad"],
  },
  {
    id: "commercial-operations",
    eyebrow: "NEGOCIO",
    title: "Márgenes, tiempos y envíos",
    description: "Configura rentabilidad, tiempos de realización, transportistas, tarifas y fechas estimadas de entrega.",
    href: "/admin/commercial-operations",
    icon: "€",
    status: "available",
    statusLabel: "Disponible",
    metrics: ["Márgenes", "Producción", "Envíos"],
  },
  {
    id: "recommendations",
    eyebrow: "INTELIGENCIA",
    title: "Recomendaciones",
    description: "Auditoría de propuestas, afinidades, lotes y decisiones explicables de Rai.",
    icon: "✦",
    status: "planned",
    statusLabel: "Próximamente",
    metrics: ["Ranking", "Lotes", "Conversión"],
  },
  {
    id: "visual-studio",
    eyebrow: "CREATIVIDAD",
    title: "Estudio visual",
    description: "Generación de imágenes, mockups, variantes y control de tareas creativas.",
    icon: "◉",
    status: "planned",
    statusLabel: "Próximamente",
    metrics: ["Imágenes", "Mockups", "Versiones"],
  },
  {
    id: "orders",
    eyebrow: "COMERCIAL",
    title: "Pedidos y producción",
    description: "Seguimiento de pedidos, pagos, fabricación, incidencias y entregas.",
    icon: "◇",
    status: "planned",
    statusLabel: "Próximamente",
    metrics: ["Pedidos", "Producción", "Envíos"],
  },
];

function number(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function format(value: unknown): string {
  return new Intl.NumberFormat("es-ES").format(number(value));
}

function DashboardMark() {
  return <span className="adminDashboardMark" aria-hidden="true"><i /><b /></span>;
}

function ServiceTile({ service }: { readonly service: ServiceCard }) {
  const content = <>
    <div className="adminServiceTop">
      <span className="adminServiceIcon" aria-hidden="true">{service.icon}</span>
      <span className={`adminServiceStatus adminServiceStatus--${service.status}`}>{service.statusLabel}</span>
    </div>
    <small>{service.eyebrow}</small>
    <h2>{service.title}</h2>
    <p>{service.description}</p>
    <div className="adminServiceTags">{service.metrics?.map((item) => <span key={item}>{item}</span>)}</div>
    <div className="adminServiceAction">{service.href ? <>Abrir servicio <b>→</b></> : <>En preparación <b>·</b></>}</div>
  </>;

  return service.href
    ? <a className="adminServiceCard" href={service.href}>{content}</a>
    : <article className="adminServiceCard adminServiceCard--disabled">{content}</article>;
}

export function AdminDashboardApp() {
  const [snapshot, setSnapshot] = useState<StatisticsSnapshot>();
  const [connected, setConnected] = useState<boolean | undefined>();

  useEffect(() => {
    let active = true;
    fetch("/api/v1/platform-statistics")
      .then(async (response) => {
        if (!response.ok) throw new Error("statistics unavailable");
        return response.json() as Promise<StatisticsSnapshot>;
      })
      .then((value) => { if (active) { setSnapshot(value); setConnected(true); } })
      .catch(() => { if (active) setConnected(false); });
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => ({
    products: format(snapshot?.catalog?.products),
    brains: format(snapshot?.productBrain?.ready),
    localMedia: format(snapshot?.media?.local),
    runningImports: format(snapshot?.imports?.running),
  }), [snapshot]);

  return <main className="adminDashboardShell">
    <div className="adminDashboardGlow adminDashboardGlow--one" />
    <div className="adminDashboardGlow adminDashboardGlow--two" />

    <header className="adminDashboardHeader">
      <a className="adminDashboardBrand" href="/admin">
        <DashboardMark />
        <span><strong>RecuerdArte</strong><small>Administración de plataforma</small></span>
      </a>
      <nav>
        <a href="/">Abrir Rai</a>
        <span className={`adminConnection ${connected === false ? "is-offline" : ""}`}><i />{connected === undefined ? "Comprobando sistema" : connected ? "Sistema operativo" : "API no disponible"}</span>
      </nav>
    </header>

    <section className="adminDashboardHero">
      <div>
        <small>CENTRO DE CONTROL</small>
        <h1>Todo RecuerdArte,<br /><em>en un solo lugar.</em></h1>
        <p>Gestiona el catálogo, las importaciones, la inteligencia del producto y las métricas de la plataforma. Los nuevos servicios aparecerán aquí conforme se incorporen.</p>
      </div>
      <aside>
        <span>Estado actual</span>
        <strong>{connected === false ? "Necesita atención" : "Preparado para crear"}</strong>
        <small>{snapshot?.generatedAt ? `Datos actualizados ${new Date(snapshot.generatedAt).toLocaleString("es-ES")}` : "Conectando con los servicios internos"}</small>
      </aside>
    </section>

    <section className="adminDashboardMetrics" aria-label="Resumen de plataforma">
      <article><span>Productos</span><strong>{snapshot ? summary.products : "—"}</strong><small>Catálogo canónico</small></article>
      <article><span>Brains listos</span><strong>{snapshot ? summary.brains : "—"}</strong><small>Clasificación utilizable</small></article>
      <article><span>Imágenes locales</span><strong>{snapshot ? summary.localMedia : "—"}</strong><small>Medios independientes</small></article>
      <article><span>Importaciones activas</span><strong>{snapshot ? summary.runningImports : "—"}</strong><small>Procesos en curso</small></article>
    </section>

    <section className="adminDashboardSection">
      <div className="adminDashboardSectionTitle">
        <div><small>SERVICIOS</small><h2>Herramientas de administración</h2></div>
        <span>{SERVICES.filter((service) => service.status === "available").length} servicios disponibles</span>
      </div>
      <div className="adminServicesGrid">{SERVICES.map((service) => <ServiceTile key={service.id} service={service} />)}</div>
    </section>

    <section className="adminDashboardFooterPanel">
      <div><small>ARQUITECTURA MODULAR</small><h2>Preparado para crecer con la plataforma.</h2><p>Cada servicio vive en su propia ruta y se incorpora al panel mediante una única definición, sin rehacer la navegación.</p></div>
      <a href="/admin/catalog-imports">Ir a importaciones <span>→</span></a>
    </section>

    <footer className="adminDashboardFooter"><span>RecuerdArte</span><p>Centro de administración · Proyecto de RDuende</p></footer>
  </main>;
}
