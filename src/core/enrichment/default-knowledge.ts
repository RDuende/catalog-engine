import type { KnowledgePack } from "./model.js";

export const DEFAULT_KNOWLEDGE_PACK: KnowledgePack = {
  version: "1.0.0",
  concepts: [
    { id: "mug", kind: "product-type", label: "Taza", aliases: ["taza", "mug"], related: ["gift", "home", "office", "gratitude", "sublimation"], properties: { memoryWeight: 0.82, personalizationWeight: 0.95 } },
    { id: "bottle", kind: "product-type", label: "Botella", aliases: ["botella", "bidon", "termo"], related: ["sport", "school", "office", "laser", "uv"], properties: { memoryWeight: 0.52, versatilityWeight: 0.86 } },
    { id: "keyring", kind: "product-type", label: "Llavero", aliases: ["llavero", "keyring"], related: ["gift", "travel", "nostalgia", "laser", "uv"], properties: { memoryWeight: 0.72, personalizationWeight: 0.88 } },
    { id: "canvas", kind: "product-type", label: "Lienzo", aliases: ["lienzo", "canvas", "cuadro"], related: ["gift", "family", "home", "nostalgia", "affection"], properties: { memoryWeight: 0.98, emotionalWeight: 0.96, personalizationWeight: 1 } },
    { id: "album", kind: "product-type", label: "Álbum", aliases: ["album", "álbum", "fotolibro"], related: ["gift", "family", "nostalgia", "celebration"], properties: { memoryWeight: 1, emotionalWeight: 1, personalizationWeight: 1 } },
    { id: "ceramic", kind: "material", label: "Cerámica", aliases: ["ceramica", "cerámica"], related: ["sublimation", "uv"], properties: { sustainabilityWeight: 0.35 } },
    { id: "stainless-steel", kind: "material", label: "Acero inoxidable", aliases: ["acero inoxidable", "inox"], related: ["laser", "uv"], properties: { sustainabilityWeight: 0.62 } },
    { id: "bamboo", kind: "material", label: "Bambú", aliases: ["bambu", "bambú"], related: ["laser", "pad-printing"], properties: { sustainabilityWeight: 0.92 } },
    { id: "wood", kind: "material", label: "Madera", aliases: ["madera"], related: ["laser", "uv"], properties: { sustainabilityWeight: 0.76 } },
    { id: "recycled", kind: "material", label: "Reciclado", aliases: ["reciclado", "reciclada", "rpet"], related: ["eco"], properties: { sustainabilityWeight: 1 } },
    { id: "sublimation", kind: "technique", label: "Sublimación", aliases: ["sublimacion", "sublimación"], related: [], properties: { personalizationWeight: 0.96 } },
    { id: "laser", kind: "technique", label: "Láser", aliases: ["laser", "láser", "grabado laser", "grabado láser"], related: [], properties: { personalizationWeight: 0.82 } },
    { id: "uv", kind: "technique", label: "Impresión UV", aliases: ["uv", "impresion uv", "impresión uv", "dtf uv"], related: [], properties: { personalizationWeight: 0.9 } },
    { id: "pad-printing", kind: "technique", label: "Tampografía", aliases: ["tampografia", "tampografía"], related: [], properties: { personalizationWeight: 0.55 } },
    { id: "gift", kind: "occasion", label: "Regalo", aliases: ["regalo"], related: [], properties: {} },
    { id: "birthday", kind: "occasion", label: "Cumpleaños", aliases: ["cumpleanos", "cumpleaños"], related: ["celebration"], properties: {} },
    { id: "teacher", kind: "audience", label: "Profesorado", aliases: ["profesor", "profesora", "maestro", "maestra"], related: ["school", "gratitude"], properties: {} },
    { id: "family", kind: "audience", label: "Familia", aliases: ["familia", "familiar"], related: ["home", "affection", "nostalgia"], properties: {} },
    { id: "company", kind: "audience", label: "Empresa", aliases: ["empresa", "corporativo"], related: ["office"], properties: {} },
    { id: "nostalgia", kind: "emotion", label: "Nostalgia", aliases: ["nostalgia", "recuerdo"], related: [], properties: {} },
    { id: "affection", kind: "emotion", label: "Afecto", aliases: ["afecto", "amor", "cariño"], related: [], properties: {} },
    { id: "gratitude", kind: "emotion", label: "Gratitud", aliases: ["gratitud", "agradecimiento"], related: [], properties: {} },
    { id: "celebration", kind: "emotion", label: "Celebración", aliases: ["celebracion", "celebración"], related: [], properties: {} },
    { id: "home", kind: "usage", label: "Hogar", aliases: ["hogar", "casa"], related: [], properties: {} },
    { id: "office", kind: "usage", label: "Oficina", aliases: ["oficina", "despacho"], related: [], properties: {} },
    { id: "school", kind: "usage", label: "Colegio", aliases: ["colegio", "escuela"], related: [], properties: {} },
    { id: "sport", kind: "usage", label: "Deporte", aliases: ["deporte", "deportivo"], related: [], properties: {} },
    { id: "travel", kind: "usage", label: "Viaje", aliases: ["viaje", "turismo"], related: [], properties: {} }
  ]
};
