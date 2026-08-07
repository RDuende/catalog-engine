import type {
  KnowledgeEntityDefinition,
} from "./knowledge-entity.types.js";

function entity(
  value: KnowledgeEntityDefinition,
): KnowledgeEntityDefinition {
  return Object.freeze(value);
}

export const KNOWLEDGE_TAXONOMY_V1:
  readonly KnowledgeEntityDefinition[] =
  Object.freeze([
    entity({
      id: "metal",
      kind: "MATERIAL",
      domain: "materials",
      displayName: {
        es: "Metal",
        en: "Metal",
      },
      aliases: Object.freeze([
        "metal",
        "metálico",
        "metalico",
        "metálica",
        "metalica",
        "acero",
        "aluminio",
        "inoxidable",
        "acero inoxidable",
      ]),
    }),
    entity({
      id: "ceramic",
      kind: "MATERIAL",
      domain: "materials",
      displayName: {
        es: "Cerámica",
        en: "Ceramic",
      },
      aliases: Object.freeze([
        "ceramica",
        "cerámica",
        "porcelana",
        "gres",
      ]),
    }),
    entity({
      id: "wood",
      kind: "MATERIAL",
      domain: "materials",
      displayName: {
        es: "Madera",
        en: "Wood",
      },
      aliases: Object.freeze([
        "madera",
        "wood",
        "bambu",
        "bambú",
        "corcho",
      ]),
    }),
    entity({
      id: "battery",
      kind: "FEATURE",
      domain: "features",
      displayName: {
        es: "Batería",
        en: "Battery",
      },
      aliases: Object.freeze([
        "bateria",
        "batería",
        "battery",
      ]),
      requiresAny: Object.freeze([
        "mah",
        "power bank",
        "powerbank",
        "recargable",
        "litio",
        "carga",
        "usb",
      ]),
      excludesAny: Object.freeze([
        "baquetas",
        "percusion",
        "percusión",
        "platillo",
        "platillos",
        "bombo",
        "tambor",
      ]),
    }),
    entity({
      id: "usb",
      kind: "FEATURE",
      domain: "features",
      displayName: {
        es: "USB",
        en: "USB",
      },
      aliases: Object.freeze([
        "usb",
        "usb-c",
        "type-c",
        "tipo c",
      ]),
    }),
    entity({
      id: "bluetooth",
      kind: "FEATURE",
      domain: "features",
      displayName: {
        es: "Bluetooth",
        en: "Bluetooth",
      },
      aliases: Object.freeze([
        "bluetooth",
      ]),
    }),
    entity({
      id: "doctor",
      kind: "PROFESSION",
      domain: "professions",
      displayName: {
        es: "Medicina",
        en: "Doctor",
      },
      aliases: Object.freeze([
        "medico",
        "médico",
        "doctora",
        "doctor",
      ]),
      strongTerms: Object.freeze([
        "estetoscopio",
        "hospital",
      ]),
    }),
    entity({
      id: "teacher",
      kind: "PROFESSION",
      domain: "professions",
      displayName: {
        es: "Docencia",
        en: "Teaching",
      },
      aliases: Object.freeze([
        "profesor",
        "profesora",
        "maestro",
        "maestra",
      ]),
      strongTerms: Object.freeze([
        "colegio",
        "pizarra",
      ]),
    }),
    entity({
      id: "electrician",
      kind: "PROFESSION",
      domain: "professions",
      displayName: {
        es: "Electricidad",
        en: "Electrician",
      },
      aliases: Object.freeze([
        "electricista",
      ]),
      strongTerms: Object.freeze([
        "cableado",
        "voltaje",
      ]),
    }),
    entity({
      id: "laser",
      kind: "TECHNIQUE",
      domain: "techniques",
      displayName: {
        es: "Láser",
        en: "Laser",
      },
      aliases: Object.freeze([
        "laser",
        "láser",
        "grabado laser",
        "grabado láser",
      ]),
    }),
    entity({
      id: "sublimation",
      kind: "TECHNIQUE",
      domain: "techniques",
      displayName: {
        es: "Sublimación",
        en: "Sublimation",
      },
      aliases: Object.freeze([
        "sublimacion",
        "sublimación",
      ]),
    }),
    entity({
      id: "mug",
      kind: "OBJECT",
      domain: "objects",
      displayName: {
        es: "Taza",
        en: "Mug",
      },
      aliases: Object.freeze([
        "taza",
        "mug",
      ]),
    }),
    entity({
      id: "bottle",
      kind: "OBJECT",
      domain: "objects",
      displayName: {
        es: "Botella",
        en: "Bottle",
      },
      aliases: Object.freeze([
        "botella",
        "bottle",
      ]),
    }),
    entity({
      id: "shirt",
      kind: "OBJECT",
      domain: "objects",
      displayName: {
        es: "Camiseta",
        en: "T-shirt",
      },
      aliases: Object.freeze([
        "camiseta",
        "t-shirt",
        "shirt",
      ]),
    }),
    entity({
      id: "drums",
      kind: "INTEREST",
      domain: "music",
      displayName: {
        es: "Batería musical",
        en: "Drums",
      },
      aliases: Object.freeze([
        "bateria musical",
        "batería musical",
        "drums",
        "bateria",
        "batería",
      ]),
      strongTerms: Object.freeze([
        "baquetas",
        "percusion",
        "percusión",
        "platillo",
        "platillos",
        "bombo",
        "tambor",
      ]),
      requiresAny: Object.freeze([
        "baquetas",
        "percusion",
        "percusión",
        "platillo",
        "platillos",
        "bombo",
        "tambor",
        "instrumento",
        "musica",
        "música",
      ]),
      excludesAny: Object.freeze([
        "mah",
        "power bank",
        "powerbank",
        "recargable",
        "litio",
        "usb",
        "carga",
      ]),
    }),
    entity({
      id: "heavy-metal",
      kind: "INTEREST",
      domain: "music",
      displayName: {
        es: "Heavy metal",
        en: "Heavy metal",
      },
      aliases: Object.freeze([
        "heavy metal",
        "metal",
      ]),
      strongTerms: Object.freeze([
        "metallica",
        "iron maiden",
        "slayer",
      ]),
      requiresAny: Object.freeze([
        "rock",
        "banda",
        "guitarra",
        "concierto",
        "festival",
        "metallica",
        "iron maiden",
        "slayer",
      ]),
      excludesAny: Object.freeze([
        "acero",
        "aluminio",
        "inoxidable",
        "material",
        "metálico",
        "metalico",
        "metálica",
        "metalica",
      ]),
    }),
    entity({
      id: "manga",
      kind: "INTEREST",
      domain: "art",
      displayName: {
        es: "Manga",
        en: "Manga",
      },
      aliases: Object.freeze([
        "manga",
        "manga japonesa",
        "manga anime",
      ]),
      strongTerms: Object.freeze([
        "anime",
        "otaku",
        "naruto",
        "dragon ball",
        "one piece",
      ]),
      requiresAny: Object.freeze([
        "anime",
        "otaku",
        "japon",
        "japón",
        "comic",
        "cómic",
        "naruto",
        "dragon ball",
        "one piece",
      ]),
      excludesAny: Object.freeze([
        "manga corta",
        "manga larga",
        "sin mangas",
        "manga ranglan",
      ]),
    }),
    entity({
      id: "knitting",
      kind: "INTEREST",
      domain: "crafts",
      displayName: {
        es: "Punto",
        en: "Knitting",
      },
      aliases: Object.freeze([
        "hacer punto",
        "tejer",
        "knitting",
        "punto",
      ]),
      strongTerms: Object.freeze([
        "agujas de punto",
        "lana para tejer",
      ]),
      requiresAny: Object.freeze([
        "tejer",
        "agujas",
        "lana",
        "patron",
        "patrón",
        "manualidades",
      ]),
      excludesAny: Object.freeze([
        "tejido de punto",
        "punto jersey",
        "punto pique",
        "punto piqué",
      ]),
    }),
    entity({
      id: "ceramics",
      kind: "INTEREST",
      domain: "art",
      displayName: {
        es: "Cerámica artística",
        en: "Ceramics",
      },
      aliases: Object.freeze([
        "ceramica",
        "cerámica",
        "alfareria",
        "alfarería",
        "ceramista",
        "pottery",
      ]),
      strongTerms: Object.freeze([
        "torno alfarero",
        "modelado de arcilla",
      ]),
      requiresAny: Object.freeze([
        "alfareria",
        "alfarería",
        "ceramista",
        "torno",
        "modelado",
        "curso de ceramica",
        "curso de cerámica",
      ]),
      excludesAny: Object.freeze([
        "taza de ceramica",
        "taza de cerámica",
        "material ceramico",
        "material cerámico",
      ]),
    }),
    entity({
      id: "cats",
      kind: "INTEREST",
      domain: "animals",
      displayName: {
        es: "Gatos",
        en: "Cats",
      },
      aliases: Object.freeze([
        "cat",
        "cats",
        "gatos",
        "gato",
        "gatito",
        "felino",
        "cat lover",
      ]),
      strongTerms: Object.freeze([
        "huella de gato",
      ]),
      excludesAny: Object.freeze([
        "cat. general",
        "cat general",
        "cat textil",
        "cat eoy",
        "catalogo",
        "catálogo",
      ]),
    }),
    entity({
      id: "football",
      kind: "THEME",
      domain: "sports",
      displayName: {
        es: "Fútbol",
        en: "Football",
      },
      aliases: Object.freeze([
        "futbol",
        "fútbol",
        "football",
        "soccer",
      ]),
      strongTerms: Object.freeze([
        "balon",
        "balón",
        "porteria",
        "portería",
        "gol",
      ]),
    }),
    entity({
      id: "golf",
      kind: "THEME",
      domain: "sports",
      displayName: {
        es: "Golf",
        en: "Golf",
      },
      aliases: Object.freeze([
        "golf",
      ]),
      strongTerms: Object.freeze([
        "palo de golf",
        "green",
        "tee",
      ]),
    }),
  ]);
