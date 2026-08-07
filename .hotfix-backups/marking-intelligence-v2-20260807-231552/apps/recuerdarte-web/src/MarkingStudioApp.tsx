import { useMemo, useRef, useState } from "react";

type Technique = { id:string; code:string; name:string; maxWidthMm?:number; maxHeightMm?:number; recommended?:boolean; source:"PROVIDER"|"ADMIN"|"INFERRED" };
type Area = { id:string; name:string; baseImageUrl?:string; placement:{x:number;y:number;width:number;height:number;rotation?:number}; techniques:Technique[] };
type Profile = { productId:string; providerKey?:string; commercialImageUrl?:string; mockupBaseImageUrl?:string; areas:Area[]; updatedAt?:string };

const TECHNIQUES = ["SUBLIMATION","DTF","DTF_UV","LASER_CO2","LASER_FIBER","LASER","SCREEN_PRINTING","PAD_PRINTING","EMBROIDERY","TRANSFER","DIGITAL_PRINT","UV_PRINT"];
const uid=()=>Math.random().toString(36).slice(2)+Date.now().toString(36);
const emptyArea=():Area=>({id:uid(),name:"Frontal",placement:{x:.25,y:.25,width:.5,height:.35},techniques:[]});

export function MarkingStudioApp(){
 const [productId,setProductId]=useState(""); const [profile,setProfile]=useState<Profile|null>(null); const [message,setMessage]=useState(""); const [drag,setDrag]=useState<{x:number;y:number}|null>(null); const box=useRef<HTMLDivElement>(null);
 const area=profile?.areas[0]; const image=area?.baseImageUrl||profile?.mockupBaseImageUrl||profile?.commercialImageUrl||"";
 const load=async()=>{if(!productId.trim())return;setMessage("Cargando…");const r=await fetch(`/api/v1/marking-intelligence/products/${encodeURIComponent(productId.trim())}`);const d=await r.json();setProfile(d.profile??{productId:productId.trim(),areas:[emptyArea()]});setMessage(d.profile?"Perfil cargado":"Producto sin mapa de marcaje todavía")};
 const save=async()=>{if(!profile)return;setMessage("Guardando…");const {productId:_,updatedAt:__,...body}=profile;const r=await fetch(`/api/v1/marking-intelligence/products/${encodeURIComponent(profile.productId)}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){setMessage(d.error||"Error");return}setProfile(d.profile);setMessage("Guardado")};
 const updateArea=(patch:Partial<Area>)=>setProfile(p=>p?({...p,areas:[{...p.areas[0],...patch} as Area,...p.areas.slice(1)]}):p);
 const onDown=(e:React.PointerEvent)=>{const r=box.current?.getBoundingClientRect();if(!r)return;setDrag({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height});};
 const onUp=(e:React.PointerEvent)=>{if(!drag||!box.current||!area)return;const r=box.current.getBoundingClientRect();const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;updateArea({placement:{x:Math.max(0,Math.min(drag.x,x)),y:Math.max(0,Math.min(drag.y,y)),width:Math.min(1,Math.abs(x-drag.x)),height:Math.min(1,Math.abs(y-drag.y))}});setDrag(null)};
 const rect=useMemo(()=>area?.placement,[area]);
 return <main style={{fontFamily:"Inter,system-ui,sans-serif",background:"#f6f0e9",minHeight:"100vh",padding:24,color:"#292522"}}><div style={{maxWidth:1450,margin:"auto"}}>
  <h1 style={{marginBottom:4}}>Marking Intelligence</h1><p style={{marginTop:0,color:"#756b64"}}>Técnicas, imagen de mockup y área máxima real de marcaje por producto.</p>
  <section style={{display:"flex",gap:10,marginBottom:18}}><input value={productId} onChange={e=>setProductId(e.target.value)} placeholder="ID / referencia del producto" style={{flex:1,padding:12,borderRadius:10,border:"1px solid #cfc1b5"}}/><button onClick={load} style={{padding:"10px 18px"}}>Cargar producto</button>{profile&&<button onClick={save} style={{padding:"10px 18px",fontWeight:700}}>Guardar marcaje</button>}</section>
  {message&&<p>{message}</p>}
  {profile&&<div style={{display:"grid",gridTemplateColumns:"minmax(420px,1.1fr) minmax(380px,.9fr)",gap:20}}>
   <section style={{background:"#fff",padding:18,borderRadius:18}}><h2>Imágenes y zona</h2>
    <label>Imagen principal/comercial<input value={profile.commercialImageUrl||""} onChange={e=>setProfile({...profile,commercialImageUrl:e.target.value})} style={{width:"100%",padding:9,margin:"6px 0 12px"}}/></label>
    <label>Imagen base para mockup<input value={profile.mockupBaseImageUrl||""} onChange={e=>setProfile({...profile,mockupBaseImageUrl:e.target.value,areas:profile.areas.length?profile.areas:[emptyArea()]})} style={{width:"100%",padding:9,margin:"6px 0 12px"}}/></label>
    <div ref={box} onPointerDown={onDown} onPointerUp={onUp} style={{position:"relative",height:560,background:"#eee",borderRadius:12,overflow:"hidden",touchAction:"none",cursor:"crosshair"}}>{image?<img src={image} style={{width:"100%",height:"100%",objectFit:"contain",pointerEvents:"none"}}/>:<div style={{display:"grid",placeItems:"center",height:"100%"}}>Añade una imagen base</div>}{rect&&<div style={{position:"absolute",left:`${rect.x*100}%`,top:`${rect.y*100}%`,width:`${rect.width*100}%`,height:`${rect.height*100}%`,border:"3px solid #e34747",background:"rgba(227,71,71,.15)",pointerEvents:"none"}}/>}</div>
    <p style={{fontSize:13,color:"#756b64"}}>Arrastra sobre la fotografía para definir el área de marcaje. Las coordenadas se guardan normalizadas y no dependen de la resolución.</p>
   </section>
   <section style={{background:"#fff",padding:18,borderRadius:18}}><h2>Área y técnicas</h2>{!area?<button onClick={()=>setProfile({...profile,areas:[emptyArea()]})}>Crear primera zona</button>:<>
    <label>Nombre de la zona<input value={area.name} onChange={e=>updateArea({name:e.target.value})} style={{width:"100%",padding:9,margin:"6px 0 12px"}}/></label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}><div>X {(area.placement.x*100).toFixed(1)}%</div><div>Y {(area.placement.y*100).toFixed(1)}%</div><div>Ancho {(area.placement.width*100).toFixed(1)}%</div><div>Alto {(area.placement.height*100).toFixed(1)}%</div></div>
    <button onClick={()=>updateArea({techniques:[...area.techniques,{id:uid(),code:"DTF_UV",name:"DTF UV",source:"ADMIN"}]})}>+ Añadir técnica</button>
    <div style={{display:"grid",gap:10,marginTop:12}}>{area.techniques.map((t,i)=><div key={t.id} style={{border:"1px solid #ded3c8",borderRadius:12,padding:12}}><select value={t.code} onChange={e=>{const a=[...area.techniques];a[i]={...t,code:e.target.value,name:e.target.value.replaceAll("_"," ")};updateArea({techniques:a})}} style={{width:"100%",padding:8}}>{TECHNIQUES.map(code=><option key={code}>{code}</option>)}</select><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}><label>Ancho máx. mm<input type="number" value={t.maxWidthMm??""} onChange={e=>{const a=[...area.techniques];a[i]={...t,maxWidthMm:e.target.value?Number(e.target.value):undefined};updateArea({techniques:a})}} style={{width:"100%"}}/></label><label>Alto máx. mm<input type="number" value={t.maxHeightMm??""} onChange={e=>{const a=[...area.techniques];a[i]={...t,maxHeightMm:e.target.value?Number(e.target.value):undefined};updateArea({techniques:a})}} style={{width:"100%"}}/></label></div><label style={{display:"block",marginTop:8}}><input type="checkbox" checked={Boolean(t.recommended)} onChange={e=>{const a=area.techniques.map((x,n)=>({...x,recommended:n===i?e.target.checked:false}));updateArea({techniques:a})}}/> Técnica recomendada</label></div>)}</div>
   </>}</section>
  </div>}
 </div></main>
}
