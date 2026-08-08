import { type ReactNode, useMemo, useState } from "react";

type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly description?: string;
};

type NavGroup = {
  readonly label: string;
  readonly items: readonly NavItem[];
};

const NAV: readonly NavGroup[] = [
  {
    label: "Principal",
    items: [
      { label: "Resumen", href: "/admin", description: "Panel general" },
    ],
  },
  {
    label: "Catálogo",
    items: [
      { label: "Productos y marcaje", href: "/admin/products", description: "Productos, imágenes y técnicas" },
      { label: "Catálogo inteligente", href: "/admin/catalog-intelligence", description: "Inspección y clasificación" },
      { label: "Importaciones", href: "/admin/catalog-imports", description: "Entradas de catálogo" },
      { label: "Proveedores", href: "/admin/providers", description: "Fuentes y sincronización" },
      { label: "Geometría de marcaje", href: "/admin/marking-geometry", description: "Áreas de personalización" },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { label: "Centro de inteligencia", href: "/admin/intelligence-center", description: "Visión global" },
      { label: "Product Brain", href: "/admin/product-brain-studio", description: "Clasificación de producto" },
      { label: "Laboratorio IA", href: "/admin/ai-lab", description: "Pruebas y modelos" },
    ],
  },
  {
    label: "Studios",
    items: [
      { label: "Brain Intelligence", href: "/admin/brain-intelligence-studio" },
      { label: "Brain Orchestrator", href: "/admin/brain-orchestrator-studio" },
      { label: "Gift Brain", href: "/admin/gift-brain-studio" },
      { label: "Interest Brain", href: "/admin/interest-brain-studio" },
      { label: "Emotion Brain", href: "/admin/emotion-brain-studio" },
      { label: "Intent Brain", href: "/admin/intent-brain-studio" },
      { label: "Memory Brain", href: "/admin/memory-brain-studio" },
      { label: "Proposal Brain", href: "/admin/proposal-brain-studio" },
      { label: "Conversation Studio", href: "/admin/conversation-studio" },
      { label: "Proposal Studio", href: "/admin/proposal-studio" },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { label: "Operaciones comerciales", href: "/admin/commercial-operations" },
      { label: "Pruebas funcionales", href: "/admin/functional-tests" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Salud de plataforma", href: "/admin/platform-health" },
      { label: "Estadísticas", href: "/admin/statistics" },
      { label: "Configuración", href: "/admin/settings" },
    ],
  },
];

function normalizedPath(): string {
  const value = window.location.pathname.replace(/\/+$/, "");
  return value || "/";
}

function isActive(current: string, href: string): boolean {
  if (href === "/admin") return current === "/admin";
  return current === href || current.startsWith(`${href}/`);
}

function pageTitle(current: string): string {
  for (const group of NAV) {
    const active = group.items.find((item) => isActive(current, item.href));
    if (active) return active.label;
  }
  return "Administración";
}

function pageGroup(current: string): string {
  for (const group of NAV) {
    if (group.items.some((item) => isActive(current, item.href))) return group.label;
  }
  return "Administración";
}

export function AdminShell({ children }: { readonly children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = normalizedPath();
  const title = useMemo(() => pageTitle(current), [current]);
  const group = useMemo(() => pageGroup(current), [current]);

  return (
    <div className={`raAdmin raAdmin--${group.toLowerCase().replace(/[^a-záéíóúüñ0-9]+/g, "-").normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`}>
      <aside className={`raAdminSidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="raAdminBrand">
          <a href="/admin" className="raAdminBrand__mark" aria-label="RecuerdArte Administración"><img src="/admin-assets/ra-admin-logo-small.png" alt="" /></a>
          <div>
            <strong>RecuerdArte</strong>
            <span>Administración</span>
          </div>
          <button className="raAdminSidebar__close" type="button" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">×</button>
        </div>

        <nav className="raAdminNav" aria-label="Administración">
          {NAV.map((groupItem) => {
            const hasActive = groupItem.items.some((item) => isActive(current, item.href));
            return (
              <details key={groupItem.label} className="raAdminNavGroup" open={hasActive || groupItem.label === "Principal" || groupItem.label === "Catálogo"}>
                <summary>{groupItem.label}</summary>
                <div className="raAdminNavGroup__items">
                  {groupItem.items.map((item) => {
                    const active = isActive(current, item.href);
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        className={`raAdminNavItem ${active ? "is-active" : ""}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="raAdminNavItem__indicator" />
                        <span className="raAdminNavItem__text">
                          <strong>{item.label}</strong>
                          {item.description ? <small>{item.description}</small> : null}
                        </span>
                      </a>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </nav>

        <div className="raAdminSidebar__footer">
          <span className="raAdminStatusDot" />
          <span>Sistema administrativo</span>
        </div>
      </aside>

      {mobileOpen ? <button type="button" className="raAdminBackdrop" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" /> : null}

      <div className="raAdminMain">
        <header className="raAdminTopbar">
          <div className="raAdminTopbar__left">
            <button className="raAdminMenuButton" type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">☰</button>
            <div className="raAdminBreadcrumb">
              <a href="/admin">Administración</a>
              {current !== "/admin" ? <><span>/</span><span>{group}</span><span>/</span><strong>{title}</strong></> : <><span>/</span><strong>Resumen</strong></>}
            </div>
          </div>
          <div className="raAdminTopbar__right">
            <a href="/" className="raAdminTopAction">Ver RecuerdArte ↗</a>
            <div className="raAdminAvatar" title="Administrador">A</div>
          </div>
        </header>

        <div className="raAdminPageHeading">
          <div>
            <span>{group}</span>
            <h1>{title}</h1>
          </div>
          <div className="raAdminHeadingTools"><img className="raAdminHeadingLogo" src="/admin-assets/ra-admin-logo-large.png" alt="" /><div className="raAdminEnvironment">ADMIN</div></div>
        </div>

        <section className="raAdminContent">{children}</section>
      </div>
    </div>
  );
}
