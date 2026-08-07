import type {
  RceProposalAction,
  RceProposalCard,
  RceProposalComparisonRow,
  RceProposalComposerInput,
  RceProposalComposerMetrics,
  RceProposalSet,
} from "./proposal-composer.contracts.js";
import type { RceComposedSolution } from "./solution-composer.contracts.js";

import { resolveComposerProposalImages } from "../catalog-media/image-runtime/index.js";
function metadataString(
  solution: RceComposedSolution,
  key: string,
): string | undefined {
  const value = solution.product.metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

function metadataNumber(
  solution: RceComposedSolution,
  key: string,
): number | undefined {
  const value = solution.product.metadata?.[key];
  return typeof value === "number" ? value : undefined;
}

function imageUrl(solution: RceComposedSolution): string | undefined {
  return metadataString(solution, "image");
}

function productionInfo(solution: RceComposedSolution) {
  const estimatedDays =
    metadataNumber(solution, "productionDays");
  const technique =
    metadataString(solution, "technique") ??
    metadataString(solution, "personalizationTechnique");

  return Object.freeze({
    ...(typeof estimatedDays === "number"
      ? { estimatedDays }
      : {}),
    ...(technique ? { technique } : {}),
    available: solution.product.available !== false,
  });
}

function actions(
  solution: RceComposedSolution,
  selectedProposalId?: string,
): readonly RceProposalAction[] {
  const selected = selectedProposalId === solution.id;

  return Object.freeze([
    Object.freeze({
      type: "SELECT",
      label: selected ? "Seleccionada" : "Elegir propuesta",
      enabled: !selected,
      payload: Object.freeze({
        proposalId: solution.id,
      }),
    }),
    Object.freeze({
      type: "SAVE_FAVORITE",
      label: "Añadir a favoritos",
      enabled: true,
      payload: Object.freeze({
        solutionId: solution.id,
        productId: solution.product.id,
      }),
    }),
    Object.freeze({
      type: "CUSTOMIZE",
      label: "Personalizar",
      enabled: true,
      payload: Object.freeze({
        solutionId: solution.id,
        productId: solution.product.id,
      }),
    }),
    Object.freeze({
      type: "COMPARE",
      label: "Comparar",
      enabled: true,
      payload: Object.freeze({
        proposalId: solution.id,
      }),
    }),
    Object.freeze({
      type: "SHOW_DETAILS",
      label: "Ver detalles",
      enabled: true,
      payload: Object.freeze({
        proposalId: solution.id,
      }),
    }),
  ]);
}

function badges(solution: RceComposedSolution): readonly string[] {
  const result: string[] = [];

  if (solution.withinBudget) {
    result.push("Dentro de presupuesto");
  }

  if (solution.score >= 90) {
    result.push("Muy recomendada");
  } else if (solution.score >= 80) {
    result.push("Recomendada");
  }

  if (solution.product.available !== false) {
    result.push("Disponible");
  }

  if (solution.story) {
    result.push("Con historia");
  }

  if (solution.image) {
    result.push("Con visual preparado");
  }

  return Object.freeze(result);
}

function toProposal(
  solution: RceComposedSolution,
  selectedProposalId?: string,
): RceProposalCard {
  const url = imageUrl(solution);

  return Object.freeze({
    id: `proposal-${solution.id}`,
    title: solution.title,
    subtitle: solution.subtitle,
    description: solution.description,
    ...(solution.story?.premise
      ? { emotionalStory: solution.story.premise }
      : {}),
    whyItFits: Object.freeze([...solution.reasons]),
    ...(typeof solution.totalPrice === "number"
      ? { price: solution.totalPrice }
      : {}),
    withinBudget: solution.withinBudget,
    score: solution.score,
    media: Object.freeze({
      ...(url ? { imageUrl: url } : {}),
      ...(solution.image?.prompt
        ? { prompt: solution.image.prompt }
        : {}),
      ...(solution.image?.aspectRatio
        ? { aspectRatio: solution.image.aspectRatio }
        : {}),
      alt: `${solution.title} — ${solution.product.title}`,
    }),
    production: productionInfo(solution),
    actions: actions(solution, selectedProposalId),
    badges: badges(solution),
    sourceSolutionId: solution.id,
  });
}

function comparison(
  proposals: readonly RceProposalCard[],
): readonly RceProposalComparisonRow[] {
  const valueMap = (
    selector: (proposal: RceProposalCard) =>
      string | number | boolean | undefined,
  ) =>
    Object.freeze(
      Object.fromEntries(
        proposals.map((proposal) => [
          proposal.id,
          selector(proposal),
        ]),
      ),
    );

  return Object.freeze([
    Object.freeze({
      key: "price",
      label: "Precio",
      values: valueMap((proposal) => proposal.price),
    }),
    Object.freeze({
      key: "score",
      label: "Afinidad",
      values: valueMap((proposal) => proposal.score),
    }),
    Object.freeze({
      key: "withinBudget",
      label: "Dentro de presupuesto",
      values: valueMap((proposal) => proposal.withinBudget),
    }),
    Object.freeze({
      key: "available",
      label: "Disponible",
      values: valueMap((proposal) => proposal.production.available),
    }),
    Object.freeze({
      key: "estimatedDays",
      label: "Días estimados",
      values: valueMap((proposal) => proposal.production.estimatedDays),
    }),
    Object.freeze({
      key: "technique",
      label: "Técnica",
      values: valueMap((proposal) => proposal.production.technique),
    }),
  ]);
}

export class RceProposalComposer {
  #metrics: RceProposalComposerMetrics = Object.freeze({
    compositions: 0,
    generatedProposals: 0,
    emptyInputs: 0,
  });

  metrics(): RceProposalComposerMetrics {
    return this.#metrics;
  }

  compose(
    input: RceProposalComposerInput,
  ): RceProposalSet {
    const proposals = Object.freeze(
      input.solutions.map((solution) =>
        toProposal(solution, input.selectedProposalId),
      ),
    );

    this.#metrics = Object.freeze({
      compositions: this.#metrics.compositions + 1,
      generatedProposals:
        this.#metrics.generatedProposals + proposals.length,
      emptyInputs:
        this.#metrics.emptyInputs +
        (proposals.length === 0 ? 1 : 0),
    });

    return Object.freeze({
      conversationId: input.conversationId,
      proposals,
      comparison: comparison(proposals),
      generatedAt: new Date().toISOString(),
      version: 1,
    });
  }
}
