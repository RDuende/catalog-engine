import type {
  BrainStageId,
} from "./brain-orchestrator.types.js";

export interface BrainStageDefinition {
  readonly id: BrainStageId;
  readonly name: string;
  readonly order: number;
  readonly required: boolean;
  readonly description: string;
}

export const BRAIN_STAGES:
  readonly BrainStageDefinition[] =
  Object.freeze([
    {
      id: "MEMORY",
      name: "Memory",
      order: 10,
      required: false,
      description:
        "Recupera y consolida contexto previo.",
    },
    {
      id: "KNOWLEDGE",
      name: "Knowledge Brain",
      order: 20,
      required: false,
      description:
        "Normaliza conocimiento contextual.",
    },
    {
      id: "INTEREST",
      name: "Interest Brain",
      order: 30,
      required: true,
      description:
        "Resuelve intereses canónicos.",
    },
    {
      id: "GIFT",
      name: "Gift Brain",
      order: 40,
      required: true,
      description:
        "Decide intención, emoción y estrategia.",
    },
    {
      id: "PRODUCT",
      name: "Product Brain",
      order: 50,
      required: false,
      description:
        "Prepara productos candidatos.",
    },
    {
      id: "PROPOSAL",
      name: "Proposal Brain",
      order: 60,
      required: false,
      description:
        "Genera y compara propuestas.",
    },
    {
      id: "COMPOSER",
      name: "Composer V2",
      order: 70,
      required: false,
      description:
        "Materializa el lote final.",
    },
    {
      id: "IMAGE",
      name: "Image Runtime",
      order: 80,
      required: false,
      description:
        "Normaliza la representación visual.",
    },
  ]);
