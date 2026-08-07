import type { StoryCharacterConcept, StoryConcept } from "../story-engine/index.js";
import type { CreativeBrief, VisualStyle } from "../creative-brief/index.js";
import type {
  BuildImageBriefsInput,
  ImageBrief,
  ImageBriefBuilderContract,
  ImageComposition,
  ImagePalette,
  ImageSubject,
} from "./image-brief.types.js";

const BUILDER_ID = "deterministic-image-brief";
const BUILDER_VERSION = "v1";

function styleWords(style: VisualStyle): readonly string[] {
  switch (style) {
    case "COMIC": return ["ilustración de cómic", "líneas limpias", "acción dinámica", "acabado infantil no bebé"];
    case "WATERCOLOR": return ["acuarela delicada", "textura de papel", "bordes suaves"];
    case "PHOTOGRAPHIC": return ["acabado fotográfico", "luz natural", "detalle realista"];
    case "MINIMAL": return ["formas limpias", "pocos elementos", "espacio negativo"];
    case "BRAND_ALIGNED": return ["coherencia de marca", "composición profesional"];
    default: return ["ilustración colorida", "formas claras", "acabado amable"];
  }
}

function subject(character: StoryCharacterConcept, index: number): ImageSubject {
  return Object.freeze({
    id: character.participantId ?? `subject-${index + 1}`,
    role: character.role === "PROTAGONIST" ? "PRIMARY" : character.role === "SYMBOL" ? "SYMBOL" : "SECONDARY",
    name: character.name,
    description: character.description,
    visualTraits: Object.freeze([character.definingTrait]),
    ...(character.participantId ? { participantId: character.participantId } : {}),
  });
}

function composition(story: StoryConcept, count: number): ImageComposition {
  const emblem = story.visualHooks.some((hook) => /emblema|símbolo/i.test(hook));
  return Object.freeze({
    framing: emblem ? "GROUP" : count > 1 ? "SCENE" : "FULL_BODY",
    camera: story.title.includes("poder") ? "LOW_ANGLE" : "EYE_LEVEL",
    focalPoint: story.visualHooks[0] ?? story.title,
    foreground: Object.freeze(story.visualHooks.slice(0, 2)),
    background: Object.freeze([story.premise, story.visualHooks[2] ?? "entorno narrativo coherente"]),
    balance: emblem ? "SYMMETRIC" : "DYNAMIC",
  });
}

function palette(brief: CreativeBrief): ImagePalette {
  const colors = brief.visualStyle === "COMIC"
    ? ["violeta", "turquesa", "amarillo luminoso", "magenta"]
    : ["azul cielo", "coral", "dorado suave", "verde menta"];
  return Object.freeze({
    mood: brief.emotionalGoals.includes("FUN") ? "alegre, enérgico y luminoso" : "cálido y emocionante",
    colors: Object.freeze(colors),
    contrast: brief.visualStyle === "COMIC" ? "HIGH" : "MEDIUM",
  });
}

function promptSeed(brief: CreativeBrief, story: StoryConcept): string {
  const people = brief.audience.map((item) => item.name ?? `${item.age ?? ""} años`.trim()).join(" y ");
  return [
    story.title,
    story.logline,
    `Protagonistas: ${people || "destinatarias"}`,
    `Tema: ${brief.themes.join(", ") || "personalizado"}`,
    `Estilo: ${styleWords(brief.visualStyle).join(", ")}`,
    `Emoción: ${story.emotionalPromise}`,
    "Composición clara, personajes diferenciados y conectados, sin texto integrado.",
  ].join(". ");
}

export class DeterministicImageBriefBuilder implements ImageBriefBuilderContract {
  readonly id = BUILDER_ID;
  readonly version = BUILDER_VERSION;

  build(brief: CreativeBrief, story: StoryConcept, input: BuildImageBriefsInput, index: number): ImageBrief {
    const now = input.now ?? new Date().toISOString();
    const subjects = Object.freeze(story.characters.map(subject));
    const required = Object.freeze([
      ...story.visualHooks,
      ...subjects.filter((item) => item.role === "PRIMARY").map((item) => item.name),
      ...(brief.audience.length > 1 ? ["identidad visual propia para cada protagonista", "vínculo visible entre protagonistas"] : []),
    ]);

    return Object.freeze({
      id: `${story.id}:image-brief:${index + 1}`,
      version: 1,
      status: story.status === "READY" && brief.status === "READY" ? "READY" : "DRAFT",
      journeyId: brief.journeyId,
      journeyVersion: brief.journeyVersion,
      creativeBriefId: brief.id,
      creativeBriefVersion: brief.version,
      storyConceptId: story.id,
      storyConceptVersion: story.version,
      purpose: input.purpose ?? "CONCEPT",
      title: `Dirección visual — ${story.title}`,
      scene: story.premise,
      emotionalIntent: story.emotionalPromise,
      visualStyle: brief.visualStyle,
      aspectRatio: input.aspectRatio ?? "1:1",
      subjects,
      composition: composition(story, brief.audience.length),
      palette: palette(brief),
      requiredElements: required,
      forbiddenElements: Object.freeze([
        "texto ilegible o integrado en la imagen",
        "personajes duplicados",
        "rasgos infantiles de bebé",
        "marcas comerciales o personajes protegidos",
        "violencia o elementos inquietantes",
      ]),
      textPolicy: "NO_TEXT",
      productionNotes: Object.freeze([
        "Mantener zonas limpias para adaptar el arte a camiseta, póster o puzzle.",
        "Conservar separación suficiente entre elementos para recorte y composición.",
      ]),
      promptSeed: promptSeed(brief, story),
      builderId: BUILDER_ID,
      builderVersion: BUILDER_VERSION,
      createdAt: now,
    });
  }
}
