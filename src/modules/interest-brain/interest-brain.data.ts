import type { InterestDefinition } from "./interest-brain.types.js";

export const INTEREST_BRAIN_V1: readonly InterestDefinition[] = Object.freeze(
[
  {
    "id": "football",
    "domain": "sports",
    "displayName": {
      "es": "Fútbol",
      "en": "soccer"
    },
    "aliases": [
      "futbol",
      "fútbol",
      "football",
      "soccer"
    ],
    "strongTerms": [
      "balon",
      "balón",
      "pelota",
      "porteria",
      "portería",
      "botas",
      "estadio",
      "liga",
      "gol"
    ],
    "contextTerms": [
      "deporte",
      "equipo",
      "entrenador",
      "champions",
      "mundial"
    ]
  },
  {
    "id": "basketball",
    "domain": "sports",
    "displayName": {
      "es": "Baloncesto",
      "en": "basket"
    },
    "aliases": [
      "baloncesto",
      "basketball",
      "basket"
    ],
    "strongTerms": [
      "canasta",
      "aro",
      "balon de baloncesto",
      "balón de baloncesto",
      "nba"
    ],
    "contextTerms": [
      "deporte",
      "equipo",
      "pabellon",
      "pabellón"
    ]
  },
  {
    "id": "tennis",
    "domain": "sports",
    "displayName": {
      "es": "Tenis",
      "en": "tennis"
    },
    "aliases": [
      "tenis",
      "tennis"
    ],
    "strongTerms": [
      "raqueta",
      "pelota de tenis",
      "pista",
      "grand slam"
    ],
    "contextTerms": [
      "deporte",
      "wimbledon"
    ]
  },
  {
    "id": "padel",
    "domain": "sports",
    "displayName": {
      "es": "Pádel",
      "en": "pádel"
    },
    "aliases": [
      "padel",
      "pádel"
    ],
    "strongTerms": [
      "pala",
      "pelota de padel",
      "pelota de pádel",
      "pista de padel"
    ],
    "contextTerms": [
      "deporte",
      "pareja"
    ]
  },
  {
    "id": "golf",
    "domain": "sports",
    "displayName": {
      "es": "Golf",
      "en": "golf"
    },
    "aliases": [
      "golf"
    ],
    "strongTerms": [
      "palo de golf",
      "pelota de golf",
      "green",
      "hoyo",
      "tee"
    ],
    "contextTerms": [
      "deporte",
      "campo"
    ]
  },
  {
    "id": "cycling",
    "domain": "sports",
    "displayName": {
      "es": "Ciclismo",
      "en": "bici"
    },
    "aliases": [
      "ciclismo",
      "cycling",
      "bicicleta",
      "bici"
    ],
    "strongTerms": [
      "maillot",
      "casco",
      "pedal",
      "rueda",
      "mountain bike",
      "btt",
      "mtb"
    ],
    "contextTerms": [
      "deporte",
      "carretera",
      "montaña"
    ]
  },
  {
    "id": "running",
    "domain": "sports",
    "displayName": {
      "es": "Running",
      "en": "carrera"
    },
    "aliases": [
      "running",
      "correr",
      "carrera"
    ],
    "strongTerms": [
      "zapatillas",
      "maraton",
      "maratón",
      "trail running"
    ],
    "contextTerms": [
      "deporte",
      "atletismo"
    ]
  },
  {
    "id": "swimming",
    "domain": "sports",
    "displayName": {
      "es": "Natación",
      "en": "swimming"
    },
    "aliases": [
      "natacion",
      "natación",
      "swimming"
    ],
    "strongTerms": [
      "piscina",
      "gafas de natacion",
      "gafas de natación",
      "bañador"
    ],
    "contextTerms": [
      "deporte",
      "agua"
    ]
  },
  {
    "id": "hiking",
    "domain": "sports",
    "displayName": {
      "es": "Senderismo",
      "en": "trekking"
    },
    "aliases": [
      "senderismo",
      "hiking",
      "trekking"
    ],
    "strongTerms": [
      "mochila",
      "baston",
      "bastón",
      "ruta",
      "sendero"
    ],
    "contextTerms": [
      "naturaleza",
      "montaña"
    ]
  },
  {
    "id": "climbing",
    "domain": "sports",
    "displayName": {
      "es": "Escalada",
      "en": "climbing"
    },
    "aliases": [
      "escalada",
      "climbing"
    ],
    "strongTerms": [
      "mosqueton",
      "mosquetón",
      "cuerda",
      "arnes",
      "arnés",
      "roca"
    ],
    "contextTerms": [
      "deporte",
      "montaña"
    ]
  },
  {
    "id": "surf",
    "domain": "sports",
    "displayName": {
      "es": "Surf",
      "en": "surfing"
    },
    "aliases": [
      "surf",
      "surfing"
    ],
    "strongTerms": [
      "tabla de surf",
      "ola",
      "neopreno"
    ],
    "contextTerms": [
      "mar",
      "playa",
      "deporte"
    ]
  },
  {
    "id": "fishing",
    "domain": "sports",
    "displayName": {
      "es": "Pesca",
      "en": "fishing"
    },
    "aliases": [
      "pesca",
      "fishing"
    ],
    "strongTerms": [
      "caña",
      "anzuelo",
      "carrete",
      "pez"
    ],
    "contextTerms": [
      "rio",
      "río",
      "mar",
      "naturaleza"
    ]
  },
  {
    "id": "motocross",
    "domain": "sports",
    "displayName": {
      "es": "Motocross",
      "en": "enduro"
    },
    "aliases": [
      "motocross",
      "enduro"
    ],
    "strongTerms": [
      "moto de cross",
      "casco",
      "circuito",
      "dorsal"
    ],
    "contextTerms": [
      "motor",
      "deporte"
    ]
  },
  {
    "id": "formula1",
    "domain": "sports",
    "displayName": {
      "es": "Fórmula 1",
      "en": "f1"
    },
    "aliases": [
      "formula 1",
      "fórmula 1",
      "f1"
    ],
    "strongTerms": [
      "monoplaza",
      "circuito",
      "gran premio",
      "pit lane"
    ],
    "contextTerms": [
      "motor",
      "automovilismo"
    ]
  },
  {
    "id": "cooking",
    "domain": "cooking",
    "displayName": {
      "es": "Cocina",
      "en": "gastronomy"
    },
    "aliases": [
      "cooking",
      "cocina",
      "cocinar",
      "gastronomia",
      "gastronomía",
      "gastronomy"
    ],
    "strongTerms": [
      "chef",
      "kitchen",
      "receta",
      "recetas",
      "sarten",
      "sartén",
      "olla",
      "cuchillo",
      "horno"
    ],
    "contextTerms": [
      "comida",
      "food",
      "culinario",
      "culinary"
    ]
  },
  {
    "id": "baking",
    "domain": "cooking",
    "displayName": {
      "es": "Repostería",
      "en": "pastelería"
    },
    "aliases": [
      "reposteria",
      "repostería",
      "baking",
      "pasteleria",
      "pastelería"
    ],
    "strongTerms": [
      "tarta",
      "pastel",
      "cupcake",
      "galleta",
      "hornear",
      "molde"
    ],
    "contextTerms": [
      "cocina",
      "dulce",
      "postre"
    ]
  },
  {
    "id": "barbecue",
    "domain": "cooking",
    "displayName": {
      "es": "Barbacoa",
      "en": "parrilla"
    },
    "aliases": [
      "barbacoa",
      "bbq",
      "parrilla"
    ],
    "strongTerms": [
      "carne",
      "pinzas",
      "carbon",
      "carbón",
      "asador"
    ],
    "contextTerms": [
      "cocina",
      "exterior"
    ]
  },
  {
    "id": "coffee",
    "domain": "cooking",
    "displayName": {
      "es": "Café",
      "en": "coffee"
    },
    "aliases": [
      "cafe",
      "café",
      "coffee"
    ],
    "strongTerms": [
      "cafetera",
      "barista",
      "espresso",
      "capuccino",
      "cappuccino",
      "taza"
    ],
    "contextTerms": [
      "bebida",
      "cocina"
    ]
  },
  {
    "id": "wine",
    "domain": "cooking",
    "displayName": {
      "es": "Vino",
      "en": "enología"
    },
    "aliases": [
      "vino",
      "wine",
      "enologia",
      "enología"
    ],
    "strongTerms": [
      "copa de vino",
      "sacacorchos",
      "bodega",
      "uva"
    ],
    "contextTerms": [
      "bebida",
      "gastronomia"
    ]
  },
  {
    "id": "cocktails",
    "domain": "cooking",
    "displayName": {
      "es": "Coctelería",
      "en": "mixología"
    },
    "aliases": [
      "cocteleria",
      "coctelería",
      "cocktails",
      "mixologia",
      "mixología"
    ],
    "strongTerms": [
      "coctelera",
      "copa",
      "gin tonic",
      "bartender"
    ],
    "contextTerms": [
      "bebida",
      "cocina"
    ]
  },
  {
    "id": "guitar",
    "domain": "music",
    "displayName": {
      "es": "Guitarra",
      "en": "guitar"
    },
    "aliases": [
      "guitarra",
      "guitar"
    ],
    "strongTerms": [
      "pua",
      "púa",
      "cuerdas",
      "amplificador",
      "acorde"
    ],
    "contextTerms": [
      "musica",
      "música",
      "instrumento"
    ]
  },
  {
    "id": "piano",
    "domain": "music",
    "displayName": {
      "es": "Piano",
      "en": "teclado musical"
    },
    "aliases": [
      "piano",
      "teclado musical"
    ],
    "strongTerms": [
      "teclas",
      "partitura",
      "pianista"
    ],
    "contextTerms": [
      "musica",
      "música",
      "instrumento"
    ]
  },
  {
    "id": "drums",
    "domain": "music",
    "displayName": {
      "es": "Batería",
      "en": "drums"
    },
    "aliases": [
      "bateria",
      "batería",
      "drums"
    ],
    "strongTerms": [
      "baquetas",
      "tambor",
      "platillo",
      "baterista"
    ],
    "contextTerms": [
      "musica",
      "música",
      "instrumento"
    ]
  },
  {
    "id": "violin",
    "domain": "music",
    "displayName": {
      "es": "Violín",
      "en": "violín"
    },
    "aliases": [
      "violin",
      "violín"
    ],
    "strongTerms": [
      "arco",
      "cuerdas",
      "violinista"
    ],
    "contextTerms": [
      "musica",
      "música",
      "instrumento"
    ]
  },
  {
    "id": "saxophone",
    "domain": "music",
    "displayName": {
      "es": "Saxofón",
      "en": "saxophone"
    },
    "aliases": [
      "saxofon",
      "saxofón",
      "saxophone"
    ],
    "strongTerms": [
      "saxo",
      "boquilla",
      "saxofonista"
    ],
    "contextTerms": [
      "musica",
      "música",
      "jazz"
    ]
  },
  {
    "id": "rock",
    "domain": "music",
    "displayName": {
      "es": "Rock",
      "en": "rock and roll"
    },
    "aliases": [
      "rock",
      "rock and roll"
    ],
    "strongTerms": [
      "guitarra electrica",
      "guitarra eléctrica",
      "banda",
      "concierto"
    ],
    "contextTerms": [
      "musica",
      "música"
    ]
  },
  {
    "id": "heavy-metal",
    "domain": "music",
    "displayName": {
      "es": "Heavy metal",
      "en": "metal"
    },
    "aliases": [
      "heavy metal",
      "metal"
    ],
    "strongTerms": [
      "guitarra",
      "bateria",
      "batería",
      "concierto"
    ],
    "contextTerms": [
      "musica",
      "música",
      "rock"
    ]
  },
  {
    "id": "jazz",
    "domain": "music",
    "displayName": {
      "es": "Jazz",
      "en": "jazz"
    },
    "aliases": [
      "jazz"
    ],
    "strongTerms": [
      "saxofon",
      "saxofón",
      "improvisacion",
      "improvisación"
    ],
    "contextTerms": [
      "musica",
      "música"
    ]
  },
  {
    "id": "flamenco",
    "domain": "music",
    "displayName": {
      "es": "Flamenco",
      "en": "flamenco"
    },
    "aliases": [
      "flamenco"
    ],
    "strongTerms": [
      "cajon",
      "cajón",
      "guitarra española",
      "palmas",
      "bailaora"
    ],
    "contextTerms": [
      "musica",
      "música",
      "baile"
    ]
  },
  {
    "id": "dj",
    "domain": "music",
    "displayName": {
      "es": "DJ",
      "en": "disc jockey"
    },
    "aliases": [
      "dj",
      "disc jockey"
    ],
    "strongTerms": [
      "mesa de mezclas",
      "vinilo",
      "auriculares",
      "club"
    ],
    "contextTerms": [
      "musica",
      "música",
      "electronica"
    ]
  },
  {
    "id": "computing",
    "domain": "technology",
    "displayName": {
      "es": "Informática",
      "en": "computers"
    },
    "aliases": [
      "informatica",
      "informática",
      "computing",
      "ordenadores",
      "computers"
    ],
    "strongTerms": [
      "portatil",
      "portátil",
      "teclado",
      "raton",
      "ratón",
      "hardware"
    ],
    "contextTerms": [
      "tecnologia",
      "tecnología"
    ]
  },
  {
    "id": "programming",
    "domain": "technology",
    "displayName": {
      "es": "Programación",
      "en": "coding"
    },
    "aliases": [
      "programacion",
      "programación",
      "programming",
      "coding"
    ],
    "strongTerms": [
      "codigo",
      "código",
      "software",
      "developer",
      "desarrollador"
    ],
    "contextTerms": [
      "tecnologia",
      "tecnología",
      "informatica"
    ]
  },
  {
    "id": "gaming",
    "domain": "technology",
    "displayName": {
      "es": "Videojuegos",
      "en": "gamer"
    },
    "aliases": [
      "videojuegos",
      "gaming",
      "gamer"
    ],
    "strongTerms": [
      "consola",
      "mando",
      "pc gaming",
      "streaming"
    ],
    "contextTerms": [
      "tecnologia",
      "juego"
    ]
  },
  {
    "id": "robotics",
    "domain": "technology",
    "displayName": {
      "es": "Robótica",
      "en": "robotics"
    },
    "aliases": [
      "robotica",
      "robótica",
      "robotics"
    ],
    "strongTerms": [
      "robot",
      "sensor",
      "servo",
      "arduino"
    ],
    "contextTerms": [
      "tecnologia",
      "tecnología",
      "electronica"
    ]
  },
  {
    "id": "electronics",
    "domain": "technology",
    "displayName": {
      "es": "Electrónica",
      "en": "electronics"
    },
    "aliases": [
      "electronica",
      "electrónica",
      "electronics"
    ],
    "strongTerms": [
      "circuito",
      "soldador",
      "resistencia",
      "placa"
    ],
    "contextTerms": [
      "tecnologia",
      "tecnología"
    ]
  },
  {
    "id": "3d-printing",
    "domain": "technology",
    "displayName": {
      "es": "Impresión 3D",
      "en": "3d printing"
    },
    "aliases": [
      "impresion 3d",
      "impresión 3d",
      "3d printing"
    ],
    "strongTerms": [
      "filamento",
      "pla",
      "resina",
      "impresora 3d"
    ],
    "contextTerms": [
      "tecnologia",
      "tecnología",
      "maker"
    ]
  },
  {
    "id": "photography",
    "domain": "technology",
    "displayName": {
      "es": "Fotografía",
      "en": "photography"
    },
    "aliases": [
      "fotografia",
      "fotografía",
      "photography"
    ],
    "strongTerms": [
      "camara",
      "cámara",
      "objetivo",
      "tripode",
      "trípode",
      "fotografo",
      "fotógrafo"
    ],
    "contextTerms": [
      "arte",
      "tecnologia"
    ]
  },
  {
    "id": "drones",
    "domain": "technology",
    "displayName": {
      "es": "Drones",
      "en": "drones"
    },
    "aliases": [
      "dron",
      "drones"
    ],
    "strongTerms": [
      "cuadricoptero",
      "cuadricóptero",
      "control remoto",
      "fpv"
    ],
    "contextTerms": [
      "tecnologia",
      "tecnología",
      "aeromodelismo"
    ]
  },
  {
    "id": "cars",
    "domain": "motor",
    "displayName": {
      "es": "Coches",
      "en": "automóvil"
    },
    "aliases": [
      "coches",
      "coche",
      "cars",
      "automovil",
      "automóvil"
    ],
    "strongTerms": [
      "volante",
      "motor",
      "llanta",
      "carretera"
    ],
    "contextTerms": [
      "motor",
      "vehiculo",
      "vehículo"
    ]
  },
  {
    "id": "classic-cars",
    "domain": "motor",
    "displayName": {
      "es": "Coches clásicos",
      "en": "classic cars"
    },
    "aliases": [
      "coches clasicos",
      "coches clásicos",
      "classic cars"
    ],
    "strongTerms": [
      "vintage",
      "restauracion",
      "restauración",
      "clasico",
      "clásico"
    ],
    "contextTerms": [
      "motor",
      "coleccionismo"
    ]
  },
  {
    "id": "motorcycles",
    "domain": "motor",
    "displayName": {
      "es": "Motos",
      "en": "motorcycles"
    },
    "aliases": [
      "motos",
      "moto",
      "motorcycles"
    ],
    "strongTerms": [
      "casco",
      "manillar",
      "motorista"
    ],
    "contextTerms": [
      "motor",
      "vehiculo",
      "vehículo"
    ]
  },
  {
    "id": "harley",
    "domain": "motor",
    "displayName": {
      "es": "Harley",
      "en": "harley davidson"
    },
    "aliases": [
      "harley",
      "harley davidson"
    ],
    "strongTerms": [
      "moto custom",
      "chopper"
    ],
    "contextTerms": [
      "motor",
      "motocicleta"
    ]
  },
  {
    "id": "vespa",
    "domain": "motor",
    "displayName": {
      "es": "Vespa",
      "en": "scooter clásica"
    },
    "aliases": [
      "vespa",
      "scooter clasica",
      "scooter clásica"
    ],
    "strongTerms": [
      "scooter",
      "italiana"
    ],
    "contextTerms": [
      "motor",
      "motocicleta"
    ]
  },
  {
    "id": "rally",
    "domain": "motor",
    "displayName": {
      "es": "Rally",
      "en": "rallye"
    },
    "aliases": [
      "rally",
      "rallye"
    ],
    "strongTerms": [
      "copiloto",
      "tramo",
      "roadbook"
    ],
    "contextTerms": [
      "motor",
      "automovilismo"
    ]
  },
  {
    "id": "karting",
    "domain": "motor",
    "displayName": {
      "es": "Karting",
      "en": "kart"
    },
    "aliases": [
      "karting",
      "kart"
    ],
    "strongTerms": [
      "circuito",
      "casco",
      "carrera"
    ],
    "contextTerms": [
      "motor",
      "automovilismo"
    ]
  },
  {
    "id": "trucks",
    "domain": "motor",
    "displayName": {
      "es": "Camiones",
      "en": "trucks"
    },
    "aliases": [
      "camiones",
      "camion",
      "camión",
      "trucks"
    ],
    "strongTerms": [
      "cabina",
      "trailer",
      "tráiler",
      "transportista"
    ],
    "contextTerms": [
      "motor",
      "transporte"
    ]
  },
  {
    "id": "gardening",
    "domain": "nature",
    "displayName": {
      "es": "Jardinería",
      "en": "gardening"
    },
    "aliases": [
      "jardineria",
      "jardinería",
      "gardening"
    ],
    "strongTerms": [
      "planta",
      "plantas",
      "maceta",
      "regadera",
      "jardin",
      "jardín"
    ],
    "contextTerms": [
      "naturaleza",
      "huerto"
    ]
  },
  {
    "id": "bonsai",
    "domain": "nature",
    "displayName": {
      "es": "Bonsáis",
      "en": "bonsáis"
    },
    "aliases": [
      "bonsai",
      "bonsái",
      "bonsais",
      "bonsáis"
    ],
    "strongTerms": [
      "arbol miniatura",
      "árbol miniatura",
      "poda"
    ],
    "contextTerms": [
      "jardineria",
      "jardinería"
    ]
  },
  {
    "id": "vegetable-garden",
    "domain": "nature",
    "displayName": {
      "es": "Huerto",
      "en": "vegetable garden"
    },
    "aliases": [
      "huerto",
      "vegetable garden"
    ],
    "strongTerms": [
      "semilla",
      "hortaliza",
      "tomate",
      "cultivo"
    ],
    "contextTerms": [
      "jardineria",
      "naturaleza"
    ]
  },
  {
    "id": "camping",
    "domain": "nature",
    "displayName": {
      "es": "Camping",
      "en": "acampar"
    },
    "aliases": [
      "camping",
      "acampar"
    ],
    "strongTerms": [
      "tienda de campaña",
      "saco de dormir",
      "camping gas"
    ],
    "contextTerms": [
      "naturaleza",
      "viajes"
    ]
  },
  {
    "id": "mushrooms",
    "domain": "nature",
    "displayName": {
      "es": "Setas",
      "en": "mushrooms"
    },
    "aliases": [
      "setas",
      "micologia",
      "micología",
      "mushrooms"
    ],
    "strongTerms": [
      "boletus",
      "niscalo",
      "níscalo",
      "bosque"
    ],
    "contextTerms": [
      "naturaleza",
      "senderismo"
    ]
  },
  {
    "id": "birdwatching",
    "domain": "nature",
    "displayName": {
      "es": "Ornitología",
      "en": "birdwatching"
    },
    "aliases": [
      "ornitologia",
      "ornitología",
      "birdwatching"
    ],
    "strongTerms": [
      "ave",
      "pajaro",
      "pájaro",
      "prismaticos",
      "prismáticos"
    ],
    "contextTerms": [
      "naturaleza"
    ]
  },
  {
    "id": "dogs",
    "domain": "animals",
    "displayName": {
      "es": "Perros",
      "en": "dog"
    },
    "aliases": [
      "perros",
      "perro",
      "dogs",
      "dog"
    ],
    "strongTerms": [
      "huella",
      "correa",
      "cachorro"
    ],
    "contextTerms": [
      "mascota",
      "animal"
    ]
  },
  {
    "id": "cats",
    "domain": "animals",
    "displayName": {
      "es": "Gatos",
      "en": "cat"
    },
    "aliases": [
      "gatos",
      "gato",
      "cats",
      "cat"
    ],
    "strongTerms": [
      "bigotes",
      "gatito",
      "rascador"
    ],
    "contextTerms": [
      "mascota",
      "animal"
    ]
  },
  {
    "id": "horses",
    "domain": "animals",
    "displayName": {
      "es": "Caballos",
      "en": "horses"
    },
    "aliases": [
      "caballos",
      "caballo",
      "horses"
    ],
    "strongTerms": [
      "equitacion",
      "equitación",
      "silla de montar",
      "jinete"
    ],
    "contextTerms": [
      "animal",
      "campo"
    ]
  },
  {
    "id": "birds",
    "domain": "animals",
    "displayName": {
      "es": "Aves",
      "en": "birds"
    },
    "aliases": [
      "aves",
      "pajaros",
      "pájaros",
      "birds"
    ],
    "strongTerms": [
      "pluma",
      "nido",
      "canario",
      "loro"
    ],
    "contextTerms": [
      "animal",
      "naturaleza"
    ]
  },
  {
    "id": "aquariums",
    "domain": "animals",
    "displayName": {
      "es": "Acuarios",
      "en": "aquarium"
    },
    "aliases": [
      "acuarios",
      "acuario",
      "aquarium"
    ],
    "strongTerms": [
      "pez",
      "pecera",
      "coral"
    ],
    "contextTerms": [
      "animal",
      "agua"
    ]
  },
  {
    "id": "reptiles",
    "domain": "animals",
    "displayName": {
      "es": "Reptiles",
      "en": "reptil"
    },
    "aliases": [
      "reptiles",
      "reptil"
    ],
    "strongTerms": [
      "serpiente",
      "lagarto",
      "gecko"
    ],
    "contextTerms": [
      "animal",
      "terrario"
    ]
  },
  {
    "id": "painting",
    "domain": "art",
    "displayName": {
      "es": "Pintura",
      "en": "painting"
    },
    "aliases": [
      "pintura",
      "painting"
    ],
    "strongTerms": [
      "pincel",
      "lienzo",
      "paleta",
      "pintor"
    ],
    "contextTerms": [
      "arte"
    ]
  },
  {
    "id": "watercolor",
    "domain": "art",
    "displayName": {
      "es": "Acuarela",
      "en": "watercolor"
    },
    "aliases": [
      "acuarela",
      "watercolor"
    ],
    "strongTerms": [
      "papel",
      "pincel",
      "pigmento"
    ],
    "contextTerms": [
      "arte",
      "pintura"
    ]
  },
  {
    "id": "drawing",
    "domain": "art",
    "displayName": {
      "es": "Dibujo",
      "en": "drawing"
    },
    "aliases": [
      "dibujo",
      "drawing"
    ],
    "strongTerms": [
      "lapiz",
      "lápiz",
      "carboncillo",
      "boceto"
    ],
    "contextTerms": [
      "arte"
    ]
  },
  {
    "id": "illustration",
    "domain": "art",
    "displayName": {
      "es": "Ilustración",
      "en": "illustration"
    },
    "aliases": [
      "ilustracion",
      "ilustración",
      "illustration"
    ],
    "strongTerms": [
      "ilustrador",
      "digital art",
      "boceto"
    ],
    "contextTerms": [
      "arte",
      "dibujo"
    ]
  },
  {
    "id": "comic",
    "domain": "art",
    "displayName": {
      "es": "Cómic",
      "en": "comics"
    },
    "aliases": [
      "comic",
      "cómic",
      "comics"
    ],
    "strongTerms": [
      "viñeta",
      "superheroe",
      "superhéroe",
      "dibujante"
    ],
    "contextTerms": [
      "arte",
      "lectura"
    ]
  },
  {
    "id": "manga",
    "domain": "art",
    "displayName": {
      "es": "Manga",
      "en": "anime"
    },
    "aliases": [
      "manga",
      "anime"
    ],
    "strongTerms": [
      "otaku",
      "japon",
      "japón",
      "viñeta"
    ],
    "contextTerms": [
      "comic",
      "lectura"
    ]
  },
  {
    "id": "ceramics",
    "domain": "art",
    "displayName": {
      "es": "Cerámica",
      "en": "pottery"
    },
    "aliases": [
      "ceramica",
      "cerámica",
      "pottery"
    ],
    "strongTerms": [
      "barro",
      "arcilla",
      "torno",
      "alfareria",
      "alfarería"
    ],
    "contextTerms": [
      "arte",
      "manualidades"
    ]
  },
  {
    "id": "sculpture",
    "domain": "art",
    "displayName": {
      "es": "Escultura",
      "en": "sculpture"
    },
    "aliases": [
      "escultura",
      "sculpture"
    ],
    "strongTerms": [
      "modelado",
      "talla",
      "escultor"
    ],
    "contextTerms": [
      "arte"
    ]
  },
  {
    "id": "sewing",
    "domain": "crafts",
    "displayName": {
      "es": "Costura",
      "en": "sewing"
    },
    "aliases": [
      "costura",
      "sewing"
    ],
    "strongTerms": [
      "aguja",
      "hilo",
      "maquina de coser",
      "máquina de coser"
    ],
    "contextTerms": [
      "manualidades",
      "textil"
    ]
  },
  {
    "id": "crochet",
    "domain": "crafts",
    "displayName": {
      "es": "Ganchillo",
      "en": "croché"
    },
    "aliases": [
      "ganchillo",
      "crochet",
      "croche",
      "croché"
    ],
    "strongTerms": [
      "lana",
      "aguja de ganchillo"
    ],
    "contextTerms": [
      "manualidades",
      "textil"
    ]
  },
  {
    "id": "knitting",
    "domain": "crafts",
    "displayName": {
      "es": "Punto",
      "en": "tejer"
    },
    "aliases": [
      "punto",
      "knitting",
      "tejer"
    ],
    "strongTerms": [
      "lana",
      "agujas de punto"
    ],
    "contextTerms": [
      "manualidades",
      "textil"
    ]
  },
  {
    "id": "patchwork",
    "domain": "crafts",
    "displayName": {
      "es": "Patchwork",
      "en": "patchwork"
    },
    "aliases": [
      "patchwork"
    ],
    "strongTerms": [
      "retales",
      "tela",
      "acolchado"
    ],
    "contextTerms": [
      "manualidades",
      "costura"
    ]
  },
  {
    "id": "macrame",
    "domain": "crafts",
    "displayName": {
      "es": "Macramé",
      "en": "macramé"
    },
    "aliases": [
      "macrame",
      "macramé"
    ],
    "strongTerms": [
      "nudo",
      "cuerda",
      "hilo"
    ],
    "contextTerms": [
      "manualidades"
    ]
  },
  {
    "id": "scrapbooking",
    "domain": "crafts",
    "displayName": {
      "es": "Scrapbooking",
      "en": "scrap"
    },
    "aliases": [
      "scrapbooking",
      "scrap"
    ],
    "strongTerms": [
      "papel decorado",
      "album",
      "álbum",
      "pegatinas"
    ],
    "contextTerms": [
      "manualidades"
    ]
  },
  {
    "id": "origami",
    "domain": "crafts",
    "displayName": {
      "es": "Origami",
      "en": "papiroflexia"
    },
    "aliases": [
      "origami",
      "papiroflexia"
    ],
    "strongTerms": [
      "papel",
      "pliegue"
    ],
    "contextTerms": [
      "manualidades",
      "arte"
    ]
  },
  {
    "id": "woodworking",
    "domain": "crafts",
    "displayName": {
      "es": "Carpintería",
      "en": "woodworking"
    },
    "aliases": [
      "carpinteria",
      "carpintería",
      "woodworking"
    ],
    "strongTerms": [
      "madera",
      "sierra",
      "formon",
      "formón",
      "carpintero"
    ],
    "contextTerms": [
      "manualidades",
      "oficio"
    ]
  },
  {
    "id": "lego",
    "domain": "collecting",
    "displayName": {
      "es": "LEGO",
      "en": "bloques de construcción"
    },
    "aliases": [
      "lego",
      "bloques de construccion",
      "bloques de construcción"
    ],
    "strongTerms": [
      "minifigura",
      "brick",
      "set"
    ],
    "contextTerms": [
      "coleccionismo",
      "juego"
    ]
  },
  {
    "id": "funko",
    "domain": "collecting",
    "displayName": {
      "es": "Funko",
      "en": "funko pop"
    },
    "aliases": [
      "funko",
      "funko pop"
    ],
    "strongTerms": [
      "figura",
      "vinilo"
    ],
    "contextTerms": [
      "coleccionismo"
    ]
  },
  {
    "id": "playmobil",
    "domain": "collecting",
    "displayName": {
      "es": "Playmobil",
      "en": "playmobil"
    },
    "aliases": [
      "playmobil"
    ],
    "strongTerms": [
      "click",
      "figura"
    ],
    "contextTerms": [
      "coleccionismo",
      "juego"
    ]
  },
  {
    "id": "coins",
    "domain": "collecting",
    "displayName": {
      "es": "Monedas",
      "en": "coins"
    },
    "aliases": [
      "monedas",
      "numismatica",
      "numismática",
      "coins"
    ],
    "strongTerms": [
      "euro",
      "moneda antigua"
    ],
    "contextTerms": [
      "coleccionismo"
    ]
  },
  {
    "id": "stamps",
    "domain": "collecting",
    "displayName": {
      "es": "Sellos",
      "en": "stamps"
    },
    "aliases": [
      "sellos",
      "filatelia",
      "stamps"
    ],
    "strongTerms": [
      "postal",
      "sello antiguo"
    ],
    "contextTerms": [
      "coleccionismo"
    ]
  },
  {
    "id": "minerals",
    "domain": "collecting",
    "displayName": {
      "es": "Minerales",
      "en": "minerals"
    },
    "aliases": [
      "minerales",
      "minerals"
    ],
    "strongTerms": [
      "cuarzo",
      "geoda",
      "piedra"
    ],
    "contextTerms": [
      "coleccionismo",
      "naturaleza"
    ]
  },
  {
    "id": "watches",
    "domain": "collecting",
    "displayName": {
      "es": "Relojes",
      "en": "watch collecting"
    },
    "aliases": [
      "relojes",
      "watch collecting"
    ],
    "strongTerms": [
      "reloj mecanico",
      "reloj mecánico",
      "cronografo",
      "cronógrafo"
    ],
    "contextTerms": [
      "coleccionismo"
    ]
  },
  {
    "id": "model-cars",
    "domain": "collecting",
    "displayName": {
      "es": "Coches a escala",
      "en": "miniaturas de coches"
    },
    "aliases": [
      "coches a escala",
      "diecast",
      "miniaturas de coches"
    ],
    "strongTerms": [
      "maqueta",
      "miniatura",
      "1:43",
      "1:18"
    ],
    "contextTerms": [
      "coleccionismo",
      "motor"
    ]
  },
  {
    "id": "reading",
    "domain": "reading",
    "displayName": {
      "es": "Lectura",
      "en": "libros"
    },
    "aliases": [
      "lectura",
      "leer",
      "reading",
      "books",
      "libros"
    ],
    "strongTerms": [
      "libro",
      "novela",
      "biblioteca"
    ],
    "contextTerms": [
      "cultura"
    ]
  },
  {
    "id": "fantasy",
    "domain": "reading",
    "displayName": {
      "es": "Fantasía",
      "en": "fantasy"
    },
    "aliases": [
      "fantasia",
      "fantasía",
      "fantasy"
    ],
    "strongTerms": [
      "magia",
      "dragon",
      "dragón",
      "elfo"
    ],
    "contextTerms": [
      "lectura",
      "cine"
    ]
  },
  {
    "id": "science-fiction",
    "domain": "reading",
    "displayName": {
      "es": "Ciencia ficción",
      "en": "sci-fi"
    },
    "aliases": [
      "ciencia ficcion",
      "ciencia ficción",
      "science fiction",
      "sci-fi"
    ],
    "strongTerms": [
      "espacio",
      "robot",
      "futuro"
    ],
    "contextTerms": [
      "lectura",
      "cine"
    ]
  },
  {
    "id": "history",
    "domain": "reading",
    "displayName": {
      "es": "Historia",
      "en": "history"
    },
    "aliases": [
      "historia",
      "history"
    ],
    "strongTerms": [
      "antiguedad",
      "antigüedad",
      "medieval",
      "guerra"
    ],
    "contextTerms": [
      "lectura",
      "cultura"
    ]
  },
  {
    "id": "poetry",
    "domain": "reading",
    "displayName": {
      "es": "Poesía",
      "en": "poetry"
    },
    "aliases": [
      "poesia",
      "poesía",
      "poetry"
    ],
    "strongTerms": [
      "poema",
      "verso",
      "poeta"
    ],
    "contextTerms": [
      "lectura",
      "literatura"
    ]
  },
  {
    "id": "cinema",
    "domain": "cinema",
    "displayName": {
      "es": "Cine",
      "en": "películas"
    },
    "aliases": [
      "cine",
      "cinema",
      "movies",
      "peliculas",
      "películas"
    ],
    "strongTerms": [
      "director",
      "actor",
      "pantalla",
      "claqueta"
    ],
    "contextTerms": [
      "cultura"
    ]
  },
  {
    "id": "star-wars",
    "domain": "cinema",
    "displayName": {
      "es": "Star Wars",
      "en": "star wars"
    },
    "aliases": [
      "star wars"
    ],
    "strongTerms": [
      "jedi",
      "sith",
      "lightsaber",
      "sable laser",
      "sable láser"
    ],
    "contextTerms": [
      "cine",
      "ciencia ficcion"
    ]
  },
  {
    "id": "marvel",
    "domain": "cinema",
    "displayName": {
      "es": "Marvel",
      "en": "marvel"
    },
    "aliases": [
      "marvel"
    ],
    "strongTerms": [
      "avengers",
      "vengadores",
      "superheroe",
      "superhéroe"
    ],
    "contextTerms": [
      "cine",
      "comic"
    ]
  },
  {
    "id": "dc-comics",
    "domain": "cinema",
    "displayName": {
      "es": "DC",
      "en": "dc"
    },
    "aliases": [
      "dc comics",
      "dc"
    ],
    "strongTerms": [
      "batman",
      "superman",
      "wonder woman"
    ],
    "contextTerms": [
      "cine",
      "comic"
    ]
  },
  {
    "id": "harry-potter",
    "domain": "cinema",
    "displayName": {
      "es": "Harry Potter",
      "en": "harry potter"
    },
    "aliases": [
      "harry potter"
    ],
    "strongTerms": [
      "hogwarts",
      "mago",
      "varita"
    ],
    "contextTerms": [
      "cine",
      "fantasia"
    ]
  },
  {
    "id": "lord-of-rings",
    "domain": "cinema",
    "displayName": {
      "es": "El Señor de los Anillos",
      "en": "lotr"
    },
    "aliases": [
      "el señor de los anillos",
      "lord of the rings",
      "lotr"
    ],
    "strongTerms": [
      "hobbit",
      "gandalf",
      "mordor"
    ],
    "contextTerms": [
      "cine",
      "fantasia"
    ]
  },
  {
    "id": "disney",
    "domain": "cinema",
    "displayName": {
      "es": "Disney",
      "en": "disney"
    },
    "aliases": [
      "disney"
    ],
    "strongTerms": [
      "mickey",
      "princesa",
      "castillo"
    ],
    "contextTerms": [
      "cine",
      "infantil"
    ]
  },
  {
    "id": "travel",
    "domain": "travel",
    "displayName": {
      "es": "Viajes",
      "en": "travel"
    },
    "aliases": [
      "viajes",
      "viajar",
      "travel"
    ],
    "strongTerms": [
      "maleta",
      "mapa",
      "avion",
      "avión",
      "pasaporte"
    ],
    "contextTerms": [
      "turismo"
    ]
  },
  {
    "id": "camper",
    "domain": "travel",
    "displayName": {
      "es": "Camper",
      "en": "furgoneta camper"
    },
    "aliases": [
      "camper",
      "furgoneta camper"
    ],
    "strongTerms": [
      "furgo",
      "camperizacion",
      "camperización"
    ],
    "contextTerms": [
      "viajes",
      "motor"
    ]
  },
  {
    "id": "motorhome",
    "domain": "travel",
    "displayName": {
      "es": "Autocaravana",
      "en": "caravana"
    },
    "aliases": [
      "autocaravana",
      "motorhome",
      "caravana"
    ],
    "strongTerms": [
      "camping",
      "ruta"
    ],
    "contextTerms": [
      "viajes",
      "motor"
    ]
  },
  {
    "id": "cruises",
    "domain": "travel",
    "displayName": {
      "es": "Cruceros",
      "en": "cruise"
    },
    "aliases": [
      "cruceros",
      "cruise"
    ],
    "strongTerms": [
      "barco",
      "puerto",
      "mar"
    ],
    "contextTerms": [
      "viajes"
    ]
  },
  {
    "id": "beach",
    "domain": "travel",
    "displayName": {
      "es": "Playa",
      "en": "beach"
    },
    "aliases": [
      "playa",
      "beach"
    ],
    "strongTerms": [
      "arena",
      "mar",
      "sombrilla"
    ],
    "contextTerms": [
      "viajes",
      "naturaleza"
    ]
  },
  {
    "id": "doctor",
    "domain": "professions",
    "displayName": {
      "es": "Medicina",
      "en": "medicine"
    },
    "aliases": [
      "medico",
      "médico",
      "doctora",
      "doctor",
      "medicine"
    ],
    "strongTerms": [
      "estetoscopio",
      "hospital",
      "bata"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "nursing",
    "domain": "professions",
    "displayName": {
      "es": "Enfermería",
      "en": "nursing"
    },
    "aliases": [
      "enfermera",
      "enfermero",
      "enfermeria",
      "enfermería",
      "nursing"
    ],
    "strongTerms": [
      "hospital",
      "jeringa",
      "bata"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "teacher",
    "domain": "professions",
    "displayName": {
      "es": "Docencia",
      "en": "teacher"
    },
    "aliases": [
      "profesor",
      "profesora",
      "maestro",
      "maestra",
      "teacher"
    ],
    "strongTerms": [
      "pizarra",
      "libro",
      "colegio"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "firefighter",
    "domain": "professions",
    "displayName": {
      "es": "Bomberos",
      "en": "firefighter"
    },
    "aliases": [
      "bombero",
      "bombera",
      "firefighter"
    ],
    "strongTerms": [
      "casco",
      "manguera",
      "camion de bomberos",
      "camión de bomberos"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "police",
    "domain": "professions",
    "displayName": {
      "es": "Policía",
      "en": "police"
    },
    "aliases": [
      "policia",
      "policía",
      "police"
    ],
    "strongTerms": [
      "placa",
      "patrulla",
      "uniforme"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "mechanic",
    "domain": "professions",
    "displayName": {
      "es": "Mecánica",
      "en": "mechanic"
    },
    "aliases": [
      "mecanico",
      "mecánico",
      "mechanic"
    ],
    "strongTerms": [
      "llave inglesa",
      "taller",
      "motor"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "carpenter",
    "domain": "professions",
    "displayName": {
      "es": "Carpintería profesional",
      "en": "carpenter"
    },
    "aliases": [
      "carpintero",
      "carpenter"
    ],
    "strongTerms": [
      "madera",
      "sierra",
      "martillo"
    ],
    "contextTerms": [
      "profesion",
      "profesión",
      "oficio"
    ]
  },
  {
    "id": "electrician",
    "domain": "professions",
    "displayName": {
      "es": "Electricidad",
      "en": "electrician"
    },
    "aliases": [
      "electricista",
      "electrician"
    ],
    "strongTerms": [
      "cable",
      "alicate",
      "voltaje"
    ],
    "contextTerms": [
      "profesion",
      "profesión",
      "oficio"
    ]
  },
  {
    "id": "graphic-designer",
    "domain": "professions",
    "displayName": {
      "es": "Diseño gráfico",
      "en": "graphic designer"
    },
    "aliases": [
      "diseñador grafico",
      "diseñador gráfico",
      "graphic designer"
    ],
    "strongTerms": [
      "tipografia",
      "tipografía",
      "vector",
      "adobe"
    ],
    "contextTerms": [
      "profesion",
      "profesión",
      "arte"
    ]
  },
  {
    "id": "printer",
    "domain": "professions",
    "displayName": {
      "es": "Artes gráficas",
      "en": "printing"
    },
    "aliases": [
      "impresor",
      "artes graficas",
      "artes gráficas",
      "printing"
    ],
    "strongTerms": [
      "tinta",
      "plotter",
      "vinilo",
      "impresion",
      "impresión"
    ],
    "contextTerms": [
      "profesion",
      "profesión"
    ]
  },
  {
    "id": "board-games",
    "domain": "games",
    "displayName": {
      "es": "Juegos de mesa",
      "en": "board games"
    },
    "aliases": [
      "juegos de mesa",
      "board games"
    ],
    "strongTerms": [
      "tablero",
      "dado",
      "ficha"
    ],
    "contextTerms": [
      "juego",
      "ocio"
    ]
  },
  {
    "id": "chess",
    "domain": "games",
    "displayName": {
      "es": "Ajedrez",
      "en": "chess"
    },
    "aliases": [
      "ajedrez",
      "chess"
    ],
    "strongTerms": [
      "tablero",
      "rey",
      "reina",
      "peon",
      "peón"
    ],
    "contextTerms": [
      "juego",
      "estrategia"
    ]
  },
  {
    "id": "puzzles",
    "domain": "games",
    "displayName": {
      "es": "Puzles",
      "en": "puzzles"
    },
    "aliases": [
      "puzzle",
      "puzle",
      "puzzles"
    ],
    "strongTerms": [
      "pieza",
      "rompecabezas"
    ],
    "contextTerms": [
      "juego",
      "ocio"
    ]
  },
  {
    "id": "role-playing",
    "domain": "games",
    "displayName": {
      "es": "Rol",
      "en": "rpg"
    },
    "aliases": [
      "juegos de rol",
      "role playing",
      "rpg"
    ],
    "strongTerms": [
      "dado",
      "mazmorra",
      "personaje"
    ],
    "contextTerms": [
      "juego",
      "fantasia"
    ]
  }
]
);
