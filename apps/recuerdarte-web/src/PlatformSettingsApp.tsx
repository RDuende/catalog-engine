import { useEffect, useMemo, useState } from "react";

type SettingValue = string | number | boolean;
type Definition = { key:string; category:string; label:string; description:string; kind:"text"|"number"|"boolean"|"password"|"select"; defaultValue:SettingValue; sensitive?:boolean; restartRequired?:boolean; options?:readonly string[]; min?:number; max?:number };
type SettingsResponse = { source:"LOCAL"|"RDGEST"; version:number; updatedAt:string; values:Record<string,SettingValue>; definitions:readonly Definition[]; restartRequired?:readonly string[] };

const MASK = "••••••••";

export function PlatformSettingsApp() {
  const [data, setData] = useState<SettingsResponse>();
  const [draft, setDraft] = useState<Record<string,SettingValue>>({});
  const [category, setCategory] = useState("General");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  const load = async () => {
    const response = await fetch("/api/v1/platform-settings");
    if (!response.ok) throw new Error("No se pudieron cargar los ajustes.");
    const value = await response.json() as SettingsResponse;
    setData(value); setDraft(value.values);
  };
  useEffect(() => { load().catch((e:Error)=>setError(e.message)); }, []);

  const categories = useMemo(() => Array.from(new Set(data?.definitions.map((item)=>item.category) ?? [])), [data]);
  const definitions = useMemo(() => (data?.definitions ?? []).filter((item) => item.category === category && (`${item.label} ${item.description} ${item.key}`).toLowerCase().includes(search.toLowerCase())), [data, category, search]);
  const changed = useMemo(() => data ? Object.keys(draft).filter((key)=>draft[key] !== data.values[key] && !(draft[key] === MASK && data.values[key] === MASK)) : [], [data,draft]);

  const save = async () => {
    if (!data || changed.length===0) return;
    setSaving(true); setError(undefined); setMessage(undefined);
    try {
      const patch = Object.fromEntries(changed.map((key)=>[key,draft[key]]));
      const response = await fetch("/api/v1/platform-settings", { method:"PATCH", headers:{"content-type":"application/json"}, body:JSON.stringify(patch) });
      const result = await response.json() as SettingsResponse & { message?:string };
      if (!response.ok) throw new Error(result.message ?? "No se pudo guardar.");
      setData(result); setDraft(result.values);
      setMessage(result.restartRequired?.length ? `Guardado. Reinicia el backend para aplicar ${result.restartRequired.length} cambio(s).` : "Configuración guardada.");
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo guardar."); }
    finally { setSaving(false); }
  };

  const resetCategory = async () => {
    if (!data || !confirm(`¿Restablecer los ajustes de ${category}?`)) return;
    const keys = data.definitions.filter((item)=>item.category===category).map((item)=>item.key);
    const response = await fetch("/api/v1/platform-settings/reset", { method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({keys}) });
    if (!response.ok) { setError("No se pudieron restablecer los ajustes."); return; }
    const result = await response.json() as SettingsResponse;
    setData(result); setDraft(result.values); setMessage(`Se ha restablecido ${category}.`);
  };

  return <main className="settingsShell">
    <header className="settingsHeader">
      <div><a href="/admin">← Administración</a><small>CONFIGURACIÓN DE PLATAFORMA</small><h1>Settings</h1><p>Variables operativas de RecuerdArte. Preparado para que RDgest sea la autoridad central en el futuro.</p></div>
      <aside><span>Proveedor</span><strong>{data?.source ?? "—"}</strong><small>Versión {data?.version ?? "—"}</small></aside>
    </header>
    <section className="settingsToolbar">
      <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Buscar ajustes…" />
      <div><button className="settingsSecondary" onClick={resetCategory}>Restablecer sección</button><button className="settingsPrimary" disabled={saving||changed.length===0} onClick={save}>{saving?"Guardando…":`Guardar cambios${changed.length?` (${changed.length})`:""}`}</button></div>
    </section>
    {message && <div className="settingsNotice settingsNotice--ok">{message}</div>}
    {error && <div className="settingsNotice settingsNotice--error">{error}</div>}
    <div className="settingsLayout">
      <nav className="settingsNav">{categories.map((item)=><button key={item} className={item===category?"is-active":""} onClick={()=>setCategory(item)}><span>{item}</span><small>{data?.definitions.filter((d)=>d.category===item).length}</small></button>)}</nav>
      <section className="settingsPanel">
        <div className="settingsPanelTitle"><div><small>SECCIÓN</small><h2>{category}</h2></div><span>{definitions.length} variables</span></div>
        <div className="settingsFields">{definitions.map((definition)=>{
          const value = draft[definition.key] ?? definition.defaultValue;
          return <label className="settingsField" key={definition.key}>
            <div><strong>{definition.label}</strong>{definition.restartRequired&&<em>Requiere reinicio</em>}<p>{definition.description}</p><code>{definition.key}</code></div>
            <div className="settingsControl">
              {definition.kind==="boolean" ? <button type="button" className={`settingsSwitch ${value?"is-on":""}`} onClick={()=>setDraft((old)=>({...old,[definition.key]:!Boolean(value)}))}><i/><span>{value?"Activado":"Desactivado"}</span></button>
              : definition.kind==="select" ? <select value={String(value)} onChange={(e)=>setDraft((old)=>({...old,[definition.key]:e.target.value}))}>{definition.options?.map((option)=><option key={option}>{option}</option>)}</select>
              : <input type={definition.kind==="password"?"password":definition.kind} value={String(value===MASK?"":value)} placeholder={definition.sensitive&&value===MASK?"Configurado · escribe para cambiar":""} min={definition.min} max={definition.max} step={definition.kind==="number"?"any":undefined} onChange={(e)=>setDraft((old)=>({...old,[definition.key]:definition.kind==="number"?Number(e.target.value):e.target.value}))}/>} 
            </div>
          </label>;
        })}</div>
      </section>
    </div>
  </main>;
}
