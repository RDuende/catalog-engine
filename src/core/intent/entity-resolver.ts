import type { AttributeType } from "../knowledge/model.js";
import type { ResolvedEntity } from "./model.js";
import { normalizeIntentText } from "./text.js";

const DICTIONARY: Record<AttributeType, Record<string, string[]>> = {
  audience: {
    profesor: ["profesor", "profesora", "profe", "maestro", "maestra", "seño", "docente"],
    padre: ["padre", "papa", "papá"],
    madre: ["madre", "mama", "mamá"],
    abuelo: ["abuelo", "abuela", "abuelos"],
    pareja: ["pareja", "novio", "novia", "marido", "mujer", "esposo", "esposa"],
    niño: ["nino", "niño", "nina", "niña", "infantil"],
    empresa: ["empresa", "empleados", "clientes", "equipo", "corporativo"],
  },
  occasion: {
    "fin de curso": ["fin de curso", "final de curso"],
    cumpleaños: ["cumpleanos", "cumpleaños", "cumple"],
    comunión: ["comunion", "comunión"],
    boda: ["boda", "casamiento"],
    aniversario: ["aniversario", "bodas de plata", "bodas de oro"],
    navidad: ["navidad", "navideno", "navideño", "reyes"],
    jubilación: ["jubilacion", "jubilación", "retiro"],
    nacimiento: ["nacimiento", "bebe", "bebé", "recien nacido", "recién nacido"],
  },
  material: {
    madera: ["madera", "maderita"],
    metacrilato: ["metacrilato", "acrilico", "acrílico"],
    metal: ["metal", "acero", "aluminio"],
    cristal: ["cristal", "vidrio"],
    textil: ["textil", "tela", "algodon", "algodón"],
    cerámica: ["ceramica", "cerámica", "porcelana"],
  },
  technique: {
    laser: ["laser", "láser", "grabado laser", "grabado láser"],
    "impresion uv": ["impresion uv", "impresión uv", "uv"],
    sublimación: ["sublimacion", "sublimación"],
    bordado: ["bordado", "bordar"],
    dtf: ["dtf"],
  },
  emotion: {
    emotivo: ["emotivo", "emocionante", "sentimental", "con sentimiento"],
    divertido: ["divertido", "gracioso", "original", "alegre"],
    elegante: ["elegante", "fino", "sofisticado"],
    romántico: ["romantico", "romántico", "amor"],
  },
  usage: {
    decorativo: ["decorativo", "decoracion", "decoración", "adorno"],
    práctico: ["practico", "práctico", "util", "útil", "uso diario"],
    recuerdo: ["recuerdo", "conmemorativo", "memoria"],
  },
  dimension: {},
};

export class EntityResolver {
  resolve(text: string): ResolvedEntity[] {
    const normalized = normalizeIntentText(text);
    const matches: ResolvedEntity[] = [];

    for (const [type, entries] of Object.entries(DICTIONARY) as [AttributeType, Record<string, string[]>][]) {
      for (const [canonical, aliases] of Object.entries(entries)) {
        const matched = aliases
          .map(normalizeIntentText)
          .sort((a, b) => b.length - a.length)
          .find((alias) => containsPhrase(normalized, alias));
        if (matched) matches.push({ type, canonical, matched, confidence: matched === normalizeIntentText(canonical) ? 1 : 0.92 });
      }
    }

    return deduplicate(matches);
  }
}

function containsPhrase(text: string, phrase: string): boolean {
  return (` ${text} `).includes(` ${phrase} `);
}

function deduplicate(values: ResolvedEntity[]): ResolvedEntity[] {
  const unique = new Map<string, ResolvedEntity>();
  for (const value of values) {
    const key = `${value.type}:${value.canonical}`;
    const current = unique.get(key);
    if (!current || value.confidence > current.confidence) unique.set(key, value);
  }
  return [...unique.values()];
}
