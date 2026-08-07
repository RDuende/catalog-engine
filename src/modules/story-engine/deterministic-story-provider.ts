import type { CreativeAudienceProfile, CreativeBrief } from "../creative-brief/index.js";
import type {
  GenerateStoryConceptsInput,
  StoryCharacterConcept,
  StoryConcept,
  StoryConceptProvider,
} from "./story-engine.types.js";

const GENERATOR_ID = "deterministic-story-concepts";
const GENERATOR_VERSION = "v1";

function recipientLabel(audience: readonly CreativeAudienceProfile[]): string {
  if (audience.length === 0) return "las personas protagonistas";
  if (audience.length === 1) return audience[0]?.name ?? "la protagonista";
  const named = audience.map((item) => item.name).filter(Boolean);
  return named.length === audience.length ? named.join(" y ") : "las protagonistas";
}

function primaryTheme(brief: CreativeBrief): string {
  return brief.themes[0] ?? "un mundo creado especialmente para ellas";
}

function characters(brief: CreativeBrief, mode: "COMPLEMENTARY" | "SHARED" | "CREATORS"): readonly StoryCharacterConcept[] {
  const profiles = brief.audience.map((participant, index): StoryCharacterConcept => Object.freeze({
    role: "PROTAGONIST",
    participantId: participant.participantId,
    name: participant.name ?? `Protagonista ${index + 1}`,
    description:
      mode === "COMPLEMENTARY"
        ? `Tiene una habilidad única que se completa con la de la otra protagonista.`
        : mode === "CREATORS"
          ? "Puede imaginar y transformar el mundo con sus propias decisiones."
          : "Forma parte de un equipo inseparable con una misión compartida.",
    definingTrait:
      participant.interests[0] ?? (mode === "COMPLEMENTARY" ? "talento complementario" : "valentía"),
  }));

  return Object.freeze([
    ...profiles,
    Object.freeze({
      role: "SYMBOL" as const,
      name: "El vínculo",
      description: "Un símbolo que solo se completa cuando las protagonistas colaboran.",
      definingTrait: "unión",
    }),
  ]);
}

function concept(
  brief: CreativeBrief,
  index: number,
  data: Omit<StoryConcept, "id" | "version" | "status" | "briefId" | "briefVersion" | "narrativeStyle" | "visualStyle" | "themes" | "emotionalGoals" | "generatorId" | "generatorVersion" | "createdAt">,
  now: string,
): StoryConcept {
  return Object.freeze({
    id: `${brief.id}:story:${index + 1}`,
    version: 1,
    status: brief.status === "READY" ? "READY" : "DRAFT",
    briefId: brief.id,
    briefVersion: brief.version,
    ...data,
    narrativeStyle: brief.narrativeStyle,
    visualStyle: brief.visualStyle,
    themes: Object.freeze([...brief.themes]),
    emotionalGoals: Object.freeze([...brief.emotionalGoals]),
    generatorId: GENERATOR_ID,
    generatorVersion: GENERATOR_VERSION,
    createdAt: now,
  });
}

export class DeterministicStoryConceptProvider implements StoryConceptProvider {
  readonly id = GENERATOR_ID;
  readonly version = GENERATOR_VERSION;

  generate(input: GenerateStoryConceptsInput): readonly StoryConcept[] {
    const { brief } = input;
    const count = Math.max(1, Math.min(input.count ?? 3, 3));
    const now = input.now ?? new Date().toISOString();
    const people = recipientLabel(brief.audience);
    const theme = primaryTheme(brief);
    const plural = brief.audience.length > 1;

    const candidates: readonly StoryConcept[] = Object.freeze([
      concept(brief, 0, {
        title: plural ? "El poder que solo existe juntas" : "El poder que siempre estuvo dentro",
        logline: `${people} descubren que su mayor poder aparece cuando confían y actúan en equipo.`,
        premise: `En un universo inspirado en ${theme}, cada protagonista recibe una habilidad diferente. Una amenaza separa las piezas de un emblema y solo podrán recuperarlas combinando sus talentos.`,
        emotionalPromise: "Celebrar que ser diferentes hace más fuerte el vínculo que las une.",
        centralConflict: "Cada protagonista intenta resolver la misión sola y descubre que ninguna habilidad está completa por separado.",
        resolution: "Al unir sus poderes, completan el emblema, salvan su mundo y comprenden que siempre forman el mejor equipo.",
        characters: characters(brief, "COMPLEMENTARY"),
        visualHooks: Object.freeze(["emblema dividido que se une", "poderes de colores complementarios", "pose final de equipo"]),
        differentiators: Object.freeze(["Cada destinataria conserva identidad propia", "La imagen se completa al estar juntas", "Fácil de materializar en dos productos conectados"]),
      }, now),
      concept(brief, 1, {
        title: plural ? "La misión de las guardianas" : "La misión de la guardiana",
        logline: `${people} reciben una misión secreta durante la celebración y deben proteger el recuerdo más valioso de su mundo.`,
        premise: `El día de ${brief.occasion ?? "una celebración especial"}, una señal oculta abre la puerta a un reino de ${theme}. Allí, las protagonistas se convierten en guardianas de los recuerdos felices.`,
        emotionalPromise: "Convertir la ocasión en el comienzo de una aventura que podrán recordar y continuar.",
        centralConflict: "Una sombra intenta borrar los momentos compartidos y deja el reino sin color.",
        resolution: "Las guardianas recuperan los recuerdos, devuelven el color al reino y guardan uno nuevo: el de su propia aventura.",
        characters: characters(brief, "SHARED"),
        visualHooks: Object.freeze(["portal de cumpleaños", "mapa de recuerdos", "reino que recupera el color"]),
        differentiators: Object.freeze(["Integra la ocasión dentro de la historia", "Permite ampliar el universo en futuras celebraciones", "Funciona como cuento, póster o puzle"]),
      }, now),
      concept(brief, 2, {
        title: plural ? "Creadoras de su propio universo" : "Creadora de su propio universo",
        logline: `${people} no reciben una aventura terminada: tienen el poder de elegir cómo nace y evoluciona su mundo.`,
        premise: `Un libro en blanco responde a las decisiones de las protagonistas. Cada elección crea personajes, lugares y poderes inspirados en ${theme}, hasta formar un universo completamente suyo.`,
        emotionalPromise: "Hacer que el proceso de crear juntas sea tan memorable como el regalo final.",
        centralConflict: "El universo empieza a desordenarse porque cada idea tira en una dirección distinta.",
        resolution: "Las protagonistas aprenden a combinar sus ideas y crean un mundo donde todas tienen un lugar.",
        characters: characters(brief, "CREATORS"),
        visualHooks: Object.freeze(["libro o portal en blanco", "escenarios que cambian con cada elección", "firma final de las creadoras"]),
        differentiators: Object.freeze(["Experiencia participativa", "Ideal para bono de personalización", "Genera múltiples artefactos desde una misma historia"]),
      }, now),
    ]);

    return Object.freeze(candidates.slice(0, count));
  }
}
