import { useEffect, useMemo, useState } from "react";

type Snapshot = { title: string; description?: string; imageUrl?: string; priceEstimate?: number; currency?: string };
type Item = { id: string; type: string; snapshot: Snapshot; createdAt: string };
type Collection = { id: string; title: string; recipientLabel?: string; occasion?: string; updatedAt: string; items: Item[] };

const GUEST_KEY = "recuerdarte.guest-id.v1";
const SEED_KEY = "recuerdarte.seed-message.v1";

function guestId(): string {
  let value = localStorage.getItem(GUEST_KEY);
  if (!value) { value = crypto.randomUUID(); localStorage.setItem(GUEST_KEY, value); }
  return value;
}

function headers(): HeadersInit {
  return { "content-type": "application/json", "x-recuerdarte-guest-id": guestId() };
}

export function SavedIdeasApp() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const total = useMemo(() => collections.reduce((sum, collection) => sum + collection.items.length, 0), [collections]);

  async function load() {
    setLoading(true); setError(undefined);
    try {
      const response = await fetch("/api/v1/saved-ideas", { headers: headers() });
      if (!response.ok) throw new Error("No se pudieron cargar las ideas guardadas.");
      const data = await response.json() as { collections: Collection[] };
      setCollections(data.collections ?? []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Error inesperado."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function remove(collectionId: string, itemId: string) {
    await fetch(`/api/v1/saved-ideas/${collectionId}/items/${itemId}`, { method: "DELETE", headers: headers() });
    await load();
  }

  async function start(collectionId: string) {
    const response = await fetch(`/api/v1/saved-ideas/${collectionId}/start-journey`, { method: "POST", headers: headers(), body: "{}" });
    if (!response.ok) return;
    const data = await response.json() as { seedMessage: string };
    localStorage.setItem(SEED_KEY, data.seedMessage);
    ["recuerdarte.rai-session.v1", "recuerdarte.workspace.v1", "recuerdarte.story-preferences.v1", "recuerdarte.image-preferences.v1", "recuerdarte.product-preferences.v1"].forEach((key) => localStorage.removeItem(key));
    window.location.href = "/";
  }

  return <main className="savedIdeasPage">
    <header className="savedIdeasHero">
      <a href="/" className="savedIdeasBack">← Volver a Rai</a>
      <div><span>MIS IDEAS GUARDADAS</span><h1>Los regalos que te hicieron sentir algo.</h1><p>Recupera propuestas, historias, imágenes y productos. Puedes retomarlos o empezar un regalo nuevo a partir de cualquiera de ellos.</p></div>
      <strong>{total}<small>ideas</small></strong>
    </header>
    {loading && <div className="savedIdeasEmpty">Cargando tus ideas…</div>}
    {error && <div className="savedIdeasError">{error}</div>}
    {!loading && !collections.length && <section className="savedIdeasEmpty"><h2>Aún no has guardado ninguna idea.</h2><p>Cuando veas una historia, imagen o producto que te guste, pulsa el corazón.</p><a href="/">Crear un regalo</a></section>}
    <section className="savedIdeasCollections">
      {collections.map((collection) => <article className="savedIdeasCollection" key={collection.id}>
        <header><div><small>{collection.recipientLabel ?? collection.occasion ?? "CONSULTA GUARDADA"}</small><h2>{collection.title}</h2><p>{collection.items.length} ideas · actualizado {new Date(collection.updatedAt).toLocaleDateString("es-ES")}</p></div><button onClick={() => void start(collection.id)}>Empezar un regalo nuevo</button></header>
        <div className="savedIdeasGrid">{collection.items.map((item) => <div className="savedIdeaCard" key={item.id}>
          <div className="savedIdeaVisual">{item.snapshot.imageUrl ? <img src={item.snapshot.imageUrl} alt={item.snapshot.title} /> : <span>{item.type.slice(0, 1)}</span>}<b>{item.type}</b></div>
          <div><h3>{item.snapshot.title}</h3>{item.snapshot.description && <p>{item.snapshot.description}</p>}{item.snapshot.priceEstimate !== undefined && <strong>{item.snapshot.priceEstimate.toFixed(2)} {item.snapshot.currency ?? "EUR"}</strong>}</div>
          <button className="savedIdeaRemove" onClick={() => void remove(collection.id, item.id)} aria-label="Eliminar idea">×</button>
        </div>)}</div>
      </article>)}
    </section>
  </main>;
}
