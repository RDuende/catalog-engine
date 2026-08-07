export interface InterestTaxonomyEntry {
  readonly canonical: string;
  readonly aliases: readonly string[];
  readonly related: readonly string[];
  readonly parent?: string;
}

export const INTEREST_TAXONOMY:
  readonly InterestTaxonomyEntry[] =
  Object.freeze([
    {
      canonical: "football",
      aliases: Object.freeze([
        "futbol",
        "fútbol",
        "balon",
        "balón",
        "soccer",
      ]),
      related: Object.freeze([
        "sports",
        "team-sports",
        "stadium",
      ]),
      parent: "sports",
    },
    {
      canonical: "motocross",
      aliases: Object.freeze([
        "motocross",
        "moto cross",
        "motos de campo",
      ]),
      related: Object.freeze([
        "motorcycles",
        "off-road",
        "adventure",
      ]),
      parent: "motor-sports",
    },
    {
      canonical: "motorcycles",
      aliases: Object.freeze([
        "moto",
        "motos",
        "motocicleta",
        "motocicletas",
      ]),
      related: Object.freeze([
        "motor-sports",
        "road-trips",
      ]),
      parent: "motor-sports",
    },
    {
      canonical: "wood",
      aliases: Object.freeze([
        "madera",
        "carpinteria",
        "carpintería",
      ]),
      related: Object.freeze([
        "crafts",
        "handmade",
        "rustic-style",
      ]),
      parent: "materials",
    },
    {
      canonical: "boats",
      aliases: Object.freeze([
        "barco",
        "barcos",
        "navegacion",
        "navegación",
      ]),
      related: Object.freeze([
        "sea",
        "sailing",
        "travel",
      ]),
      parent: "outdoors",
    },
    {
      canonical: "hiking",
      aliases: Object.freeze([
        "monte",
        "senderismo",
        "caminar por el monte",
        "rutas",
        "trekking",
      ]),
      related: Object.freeze([
        "nature",
        "camping",
        "adventure",
        "landscape-photography",
      ]),
      parent: "outdoors",
    },
    {
      canonical: "nature",
      aliases: Object.freeze([
        "naturaleza",
        "campo",
        "aire libre",
      ]),
      related: Object.freeze([
        "hiking",
        "camping",
        "gardening",
      ]),
      parent: "outdoors",
    },
    {
      canonical: "travel",
      aliases: Object.freeze([
        "viajar",
        "viajes",
        "viaje",
        "turismo",
      ]),
      related: Object.freeze([
        "adventure",
        "photography",
        "culture",
      ]),
      parent: "lifestyle",
    },
    {
      canonical: "cooking",
      aliases: Object.freeze([
        "cocina",
        "cocinar",
        "gastronomia",
        "gastronomía",
      ]),
      related: Object.freeze([
        "food",
        "kitchen",
      ]),
      parent: "lifestyle",
    },
    {
      canonical: "coffee",
      aliases: Object.freeze([
        "cafe",
        "café",
      ]),
      related: Object.freeze([
        "cooking",
        "breakfast",
      ]),
      parent: "food-drink",
    },
    {
      canonical: "wine",
      aliases: Object.freeze([
        "vino",
        "vinos",
        "enologia",
        "enología",
      ]),
      related: Object.freeze([
        "gastronomy",
        "wine-tasting",
      ]),
      parent: "food-drink",
    },
    {
      canonical: "gaming",
      aliases: Object.freeze([
        "gaming",
        "videojuegos",
        "videojuego",
        "consola",
      ]),
      related: Object.freeze([
        "technology",
        "entertainment",
      ]),
      parent: "entertainment",
    },
    {
      canonical: "reading",
      aliases: Object.freeze([
        "leer",
        "lectura",
        "libros",
        "libro",
      ]),
      related: Object.freeze([
        "literature",
        "culture",
      ]),
      parent: "culture",
    },
    {
      canonical: "gardening",
      aliases: Object.freeze([
        "jardineria",
        "jardinería",
        "plantas",
        "huerto",
      ]),
      related: Object.freeze([
        "nature",
        "home",
      ]),
      parent: "hobbies",
    },
    {
      canonical: "photography",
      aliases: Object.freeze([
        "fotografia",
        "fotografía",
        "fotos",
        "camara",
        "cámara",
      ]),
      related: Object.freeze([
        "travel",
        "memories",
      ]),
      parent: "creative",
    },
    {
      canonical: "cats",
      aliases: Object.freeze([
        "gato",
        "gatos",
      ]),
      related: Object.freeze([
        "pets",
        "animals",
      ]),
      parent: "animals",
    },
    {
      canonical: "dogs",
      aliases: Object.freeze([
        "perro",
        "perros",
      ]),
      related: Object.freeze([
        "pets",
        "animals",
      ]),
      parent: "animals",
    },
  ]);
