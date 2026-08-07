import type { ArtifactService } from "../artifact-service/index.js";
import type { ArtifactSnapshot, ArtifactType } from "../artifact-domain/index.js";
import type { JourneyArtifact, JourneyFact, JourneyProjectSnapshot } from "../journey-domain/index.js";
import {
  assertConversationOwner,
  type MvpConversationPrincipal,
  type MvpConversationRepository,
  type MvpConversationSession,
} from "../mvp-orchestrator/index.js";
import type { PaymentIntentService, PurchaseExperienceService, PurchaseOrder } from "../purchase-experience/index.js";
import type { SmartCatalogContext, SmartCatalogService } from "../smart-catalog/index.js";
import { JourneyExperienceNotFoundError } from "./experience-api.errors.js";
import type { ExperienceArtifactGroups, ExperienceNextAction, JourneyExperience } from "./experience-api.types.js";
import { ExperienceWorkspaceService } from "./experience-workspace.service.js";
import { ExperiencePurchaseIntentService } from "./experience-purchase-intent.service.js";

function latest(items: readonly ArtifactSnapshot[]): ArtifactSnapshot | undefined {
  return [...items].sort((left, right) => right.version - left.version || right.updatedAt.localeCompare(left.updatedAt))[0];
}

function fact(journey: JourneyProjectSnapshot, key: string): JourneyFact | undefined {
  return [...journey.facts]
    .filter((item) => item.key === key)
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
}

function numberFact(journey: JourneyProjectSnapshot, key: string): number | undefined {
  const value = fact(journey, key)?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function stringListFact(journey: JourneyProjectSnapshot, key: string): readonly string[] | undefined {
  const value = fact(journey, key)?.value;
  if (typeof value === "string" && value.trim()) return Object.freeze([value.trim()]);
  if (Array.isArray(value)) {
    const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
    return values.length > 0 ? Object.freeze(values) : undefined;
  }
  return undefined;
}


function journeyArtifactType(item: JourneyArtifact): ArtifactType {
  if (item.type === "IMAGE" && "imageBriefSet" in item.data) return "IMAGE_BRIEF";
  if (item.type === "DESIGN") return "IMAGE_BRIEF";
  if (item.type === "PRODUCT_SELECTION") return "PROPOSAL";
  if (["CREATIVE_BRIEF", "STORY", "IMAGE", "MOCKUP", "PROPOSAL", "DOCUMENT"].includes(item.type)) {
    return item.type as ArtifactType;
  }
  return "OTHER";
}

function journeyArtifactSnapshot(journey: JourneyProjectSnapshot, item: JourneyArtifact): ArtifactSnapshot {
  return Object.freeze({
    id: item.id,
    journeyId: journey.id,
    type: journeyArtifactType(item),
    version: item.version,
    status: item.status,
    ...(item.title ? { title: item.title } : {}),
    ...(item.uri ? { uri: item.uri } : {}),
    metadata: Object.freeze({ ...item.data, source: "JOURNEY" }),
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  });
}

function mergeArtifacts(journey: JourneyProjectSnapshot, stored: readonly ArtifactSnapshot[]): readonly ArtifactSnapshot[] {
  const merged = new Map<string, ArtifactSnapshot>();
  for (const item of journey.artifacts) merged.set(item.id, journeyArtifactSnapshot(journey, item));
  for (const item of stored) merged.set(item.id, item);
  return Object.freeze([...merged.values()]);
}

function latestSetByType(artifacts: readonly ArtifactSnapshot[], type: ArtifactType): readonly ArtifactSnapshot[] {
  const selected = latest(artifacts.filter((item) => item.type === type));
  return Object.freeze(selected ? [selected] : []);
}

function artifactGroups(artifacts: readonly ArtifactSnapshot[]): ExperienceArtifactGroups {
  const byType = (type: ArtifactType) => Object.freeze(artifacts.filter((item) => item.type === type));
  const known = new Set<ArtifactType>(["CREATIVE_BRIEF", "STORY", "IMAGE_BRIEF", "IMAGE", "MOCKUP", "PROPOSAL", "DOCUMENT", "PDF"]);
  return Object.freeze({
    // Los conjuntos creativos se regeneran como una unidad. La experiencia solo debe
    // exponer la versión más reciente, no acumular cada pulsación de "Hacer propuestas".
    creativeBriefs: latestSetByType(artifacts, "CREATIVE_BRIEF"),
    stories: latestSetByType(artifacts, "STORY"),
    imageBriefs: latestSetByType(artifacts, "IMAGE_BRIEF"),
    proposals: latestSetByType(artifacts, "PROPOSAL"),
    // Las imágenes y presentaciones sí son versiones que el usuario puede comparar.
    images: byType("IMAGE"),
    presentations: byType("MOCKUP"),
    documents: Object.freeze(artifacts.filter((item) => item.type === "DOCUMENT" || item.type === "PDF")),
    other: Object.freeze(artifacts.filter((item) => !known.has(item.type))),
  });
}

function catalogContext(journey: JourneyProjectSnapshot): SmartCatalogContext {
  const recipientAge = journey.participants.find((participant) => participant.role === "RECIPIENT" && participant.age !== undefined)?.age
    ?? numberFact(journey, "recipient.age");
  const emotionalGoals = stringListFact(journey, "creative.emotional_goals");
  const visualStyleValue = fact(journey, "creative.visual_style")?.value;
  const requiredQuantity = numberFact(journey, "recipient.count");
  return {
    ...(numberFact(journey, "budget.max") !== undefined ? { budget: numberFact(journey, "budget.max") } : {}),
    ...(recipientAge !== undefined ? { recipientAge } : {}),
    ...(stringListFact(journey, "recipient.interests") ? { interests: stringListFact(journey, "recipient.interests") } : {}),
    ...(emotionalGoals ? { emotionalGoals } : {}),
    ...(typeof visualStyleValue === "string" && visualStyleValue.trim() ? { visualStyle: visualStyleValue.trim() } : {}),
    ...(requiredQuantity !== undefined ? { requiredQuantity } : {}),
  };
}

function currentOrder(orders: readonly PurchaseOrder[]): PurchaseOrder | undefined {
  const priority: Record<PurchaseOrder["status"], number> = { PAID: 4, CONFIRMED: 3, DRAFT: 2, CANCELLED: 1 };
  return [...orders].sort((left, right) => priority[right.status] - priority[left.status] || right.updatedAt.localeCompare(left.updatedAt))[0];
}

function nextAction(input: {
  readonly journey: JourneyProjectSnapshot;
  readonly groups: ExperienceArtifactGroups;
  readonly order?: PurchaseOrder;
}): ExperienceNextAction {
  const { journey, groups, order } = input;
  if (journey.status === "COMPLETED" || journey.status === "ARCHIVED") {
    return Object.freeze({ type: "COMPLETE", label: "Ver proyecto", reason: "El recorrido ya está finalizado." });
  }
  if (order?.status === "PAID") {
    return Object.freeze({ type: "TRACK_ORDER", label: "Seguir pedido", href: `/api/v1/purchase/orders/${order.id}`, reason: "El pedido está pagado y listo para seguimiento." });
  }
  if (order?.status === "CONFIRMED") {
    return Object.freeze({ type: "COMPLETE_PAYMENT", label: "Completar pago", href: `/api/v1/purchase/orders/${order.id}/payment-intents`, reason: "El pedido está confirmado y pendiente de pago." });
  }
  if (order?.status === "DRAFT") {
    return Object.freeze({ type: "REVIEW_ORDER", label: "Revisar pedido", href: `/api/v1/purchase/orders/${order.id}`, reason: "Hay un pedido en borrador esperando revisión." });
  }
  if (groups.images.length > 0 && groups.presentations.length === 0) {
    return Object.freeze({ type: "CREATE_PRESENTATIONS", label: "Ver en productos", href: "/api/v1/presentations", reason: "Ya existe una imagen, pero todavía no hay mockups de producto." });
  }
  if (groups.imageBriefs.length > 0 && groups.images.length === 0) {
    return Object.freeze({ type: "GENERATE_IMAGE", label: "Crear imagen", href: "/api/v1/images/generations", reason: "La dirección visual está preparada y falta generar la imagen." });
  }
  if (groups.presentations.length > 0) {
    return Object.freeze({ type: "EXPLORE_PRODUCTS", label: "Elegir producto", href: "/api/v1/smart-catalog/recommendations", reason: "Los mockups están preparados para elegir el producto final." });
  }
  return Object.freeze({ type: "CONTINUE_CONVERSATION", label: "Continuar con Rai", href: `/api/v1/mvp/conversations/${journey.sessionId ?? ""}`, reason: "El Journey todavía necesita avanzar en su fase creativa." });
}

export class ExperienceApiService {
  readonly workspaceService: ExperienceWorkspaceService;
  readonly purchaseIntentService: ExperiencePurchaseIntentService;

  constructor(
    private readonly conversations: MvpConversationRepository,
    private readonly artifacts: ArtifactService,
    private readonly catalog: SmartCatalogService,
    private readonly purchases: PurchaseExperienceService,
    private readonly payments: PaymentIntentService,
    workspaceService?: ExperienceWorkspaceService,
    purchaseIntentService?: ExperiencePurchaseIntentService,
  ) {
    this.workspaceService =
      workspaceService ??
      new ExperienceWorkspaceService(
        conversations,
        artifacts,
      );
    this.purchaseIntentService =
      purchaseIntentService ??
      new ExperiencePurchaseIntentService(
        conversations,
        artifacts,
        this.workspaceService,
        purchases,
      );
  }

  async getByJourney(journeyId: string, principal: MvpConversationPrincipal | undefined): Promise<JourneyExperience> {
    const session = this.conversations.findByJourney(journeyId);
    if (!session) throw new JourneyExperienceNotFoundError(journeyId);
    assertConversationOwner(session, principal);

    const storedArtifacts = await this.artifacts.listByJourney(journeyId);
    const artifacts = mergeArtifacts(session.journey, storedArtifacts);
    const groups = artifactGroups(artifacts);
    const orders = this.purchases.listByJourney(journeyId);
    const activeOrder = currentOrder(orders);
    const paymentIntents = activeOrder ? this.payments.listByOrder(activeOrder.id) : Object.freeze([]);
    const recommendations = await this.catalog.recommend(catalogContext(session.journey), 6);
    const selectedImage = latest(groups.images);
    const selectedPresentation = latest(groups.presentations);
    const workspace = await this.workspaceService.get(journeyId, principal);
    const purchaseIntents = await this.purchaseIntentService.list(journeyId, principal);

    return Object.freeze({
      journeyId,
      session,
      journey: session.journey,
      artifacts: groups,
      workspace,
      purchaseIntents,
      ...(selectedImage ? { selectedImage } : {}),
      ...(selectedPresentation ? { selectedPresentation } : {}),
      recommendedProducts: recommendations,
      orders,
      ...(activeOrder ? { activeOrder } : {}),
      paymentIntents,
      nextAction: nextAction({ journey: session.journey, groups, ...(activeOrder ? { order: activeOrder } : {}) }),
      generatedAt: new Date().toISOString(),
    });
  }
}
