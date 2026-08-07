import { AdminDashboardApp } from "./AdminDashboardApp";
import { PlatformSettingsApp } from "./PlatformSettingsApp";
import { CatalogProvidersApp } from "./CatalogProvidersApp";
import { AiLaboratoryApp } from "./AiLaboratoryApp";
import { IntelligenceCenterApp } from "./IntelligenceCenterApp";
import { CommercialOperationsApp } from "./CommercialOperationsApp";
import { PlatformStatisticsApp } from "./PlatformStatisticsApp";
import { CatalogImportAdminApp } from "./CatalogImportAdminApp";
import { CatalogIntelligenceApp } from "./CatalogIntelligenceApp";
import { ProductBrainStudioApp } from "./ProductBrainStudioApp";
import { ProposalStudioApp } from "./ProposalStudioApp";
import AdminToolsApp from "./AdminToolsApp";
import "./admin-tools.css";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ExperienceSdkClient } from "../../../src/modules/experience-sdk/index.js";
import type {
  CreateImageGenerationTaskInput,
  ExperienceSdkCredentials,
  JourneyExperience,
  PresentationResult,
  PresentationTemplate,
  PurchaseOrder,
  PaymentIntent,
} from "../../../src/modules/experience-sdk/index.js";

import { motionRuntime } from "./design-system/motion";

import { PlatformHealthApp } from "./PlatformHealthApp";
import { GiftBrainStudioApp } from "./GiftBrainStudioApp";
import { ProposalBrainStudioApp } from "./ProposalBrainStudioApp";
import { BrainOrchestratorStudioApp } from "./BrainOrchestratorStudioApp";
import { ConversationStudioApp } from "./ConversationStudioApp";
import { MemoryBrainStudioApp } from "./MemoryBrainStudioApp";
import { EmotionBrainStudioApp } from "./EmotionBrainStudioApp";
import { IntentBrainStudioApp } from "./IntentBrainStudioApp";
import { BrainIntelligenceStudioApp } from "./BrainIntelligenceStudioApp";
import { InterestBrainStudioApp } from "./InterestBrainStudioApp";
import { FunctionalTestConsoleApp } from "./FunctionalTestConsoleApp";
type ChatItem = { readonly id: string; readonly role: "user" | "rai"; readonly text: string };
type ArtifactGroup = Record<string, readonly Record<string, unknown>[]>;
type StageKey = "conversation" | "story" | "image" | "gift" | "purchase";

type ProposalAction = {
  readonly type: "SELECT" | "SAVE_FAVORITE" | "CUSTOMIZE" | "COMPARE" | "SHOW_DETAILS";
  readonly label: string;
  readonly enabled: boolean;
  readonly payload?: Readonly<Record<string, unknown>>;
};

type ProposalCard = {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly emotionalStory?: string;
  readonly whyItFits: readonly string[];
  readonly price?: number;
  readonly withinBudget: boolean;
  readonly score: number;
  readonly media: { readonly imageUrl?: string; readonly prompt?: string; readonly alt: string };
  readonly production: { readonly estimatedDays?: number; readonly technique?: string; readonly available: boolean };
  readonly actions: readonly ProposalAction[];
  readonly badges: readonly string[];
};

type ProposalSet = {
  readonly conversationId: string;
  readonly proposals: readonly ProposalCard[];
  readonly generatedAt: string;
  readonly version: number;
};

type PersonalizationDraft = {
  readonly id?: string;
  readonly proposalId: string;
  readonly productId: string;
  readonly name: string;
  readonly dedication: string;
  readonly date: string;
  readonly colors: readonly string[];
  readonly photoUrl: string;
  readonly notes: string;
  readonly status?: "DRAFT" | "READY";
  readonly version?: number;
};

const EMPTY_PERSONALIZATION: PersonalizationDraft = {
  proposalId: "",
  productId: "",
  name: "",
  dedication: "",
  date: "",
  colors: [],
  photoUrl: "",
  notes: "",
};

type DesignVariant = {
  readonly id: string;
  readonly style: "ETHEREAL" | "EDITORIAL" | "MEMORY_COLLAGE";
  readonly title: string;
  readonly description: string;
  readonly headline: string;
  readonly supportingText: string;
  readonly palette: readonly string[];
  readonly typography: {
    readonly display: string;
    readonly body: string;
    readonly alignment: "LEFT" | "CENTER";
  };
  readonly layout: {
    readonly composition: string;
    readonly imagePlacement: string;
    readonly textPlacement: string;
  };
  readonly prompt: string;
  readonly selected: boolean;
};

type DesignSet = {
  readonly proposalId: string;
  readonly variants: readonly DesignVariant[];
  readonly selectedVariantId?: string;
  readonly version: number;
};

type RenderScene = {
  readonly proposalId: string;
  readonly designVariantId: string;
  readonly svg: string;
  readonly version: number;
  readonly layers: readonly {
    readonly id: string;
    readonly type: string;
    readonly name: string;
  }[];
};

type RaiState = "resting" | "listening" | "thinking" | "creating" | "celebrating" | "checkout" | "tracking";

const RAI_STATE_COPY: Readonly<Record<RaiState, string>> = {
  resting: "Aquí contigo",
  listening: "Te escucho",
  thinking: "Uniendo tus ideas",
  creating: "Dando forma al recuerdo",
  celebrating: "Celebrando contigo",
  checkout: "Ya queda muy poco",
  tracking: "Acompañando su viaje",
};

function RaiSpirit({ state, compact = false, decorative = false }: { readonly state: RaiState; readonly compact?: boolean; readonly decorative?: boolean }) {
  return <div
    className={`raiSpirit raiSpirit--${state} ${compact ? "raiSpirit--compact" : ""}`}
    aria-hidden={decorative || undefined}
    role={decorative ? undefined : "img"}
    aria-label={decorative ? undefined : `Rai: ${RAI_STATE_COPY[state]}`}
  >
    <span className="raiSpirit__current raiSpirit__current--one" />
    <span className="raiSpirit__current raiSpirit__current--two" />
    <span className="raiSpirit__current raiSpirit__current--three" />
    <span className="raiSpirit__core" />
    <span className="raiSpirit__spark raiSpirit__spark--one" />
    <span className="raiSpirit__spark raiSpirit__spark--two" />
  </div>;
}

const STORAGE_KEY = "recuerdarte.rai-session.v1";
const THEME_KEY = "recuerdarte.theme.v1";
const STORY_PREFS_KEY = "recuerdarte.story-preferences.v1";
const IMAGE_PREFS_KEY = "recuerdarte.image-preferences.v1";
const PRODUCT_PREFS_KEY = "recuerdarte.product-preferences.v1";
const WORKSPACE_KEY = "recuerdarte.workspace.v1";
const STAGES: readonly { key: StageKey; label: string; hint: string }[] = [
  { key: "conversation", label: "Tu historia", hint: "Rai te escucha" },
  { key: "story", label: "La idea", hint: "Nace el relato" },
  { key: "image", label: "La imagen", hint: "Toma forma" },
  { key: "gift", label: "El regalo", hint: "Se vuelve real" },
  { key: "purchase", label: "Para siempre", hint: "Listo para entregar" },
];

function id(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function textFromResponse(value: Record<string, unknown>): string {
  const result = asRecord(value.result);
  const session = asRecord(value.session);
  const sessionMessages = Array.isArray(session.messages)
    ? session.messages.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
  const latestRaiMessage = [...sessionMessages]
    .reverse()
    .find((item) => String(item.role).toUpperCase() === "RAI" && typeof item.text === "string")?.text;
  const candidates = [
    value.reply,
    value.nextQuestion,
    value.message,
    result.reply,
    result.nextQuestion,
    result.message,
    latestRaiMessage,
  ];
  return candidates.find((item): item is string => typeof item === "string" && item.trim().length > 0) ??
    "Necesito un poco más de información para seguir dando forma a este recuerdo.";
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function sessionIdFromResponse(value: Record<string, unknown>): string | undefined {
  if (typeof value.sessionId === "string" && value.sessionId.trim()) return value.sessionId;
  const session = asRecord(value.session);
  return typeof session.id === "string" && session.id.trim() ? session.id : undefined;
}

function hasShowProposalsAction(value: Record<string, unknown>): boolean {
  return Array.isArray(value.actions) && value.actions.some((item) => {
    const action = asRecord(item);
    return action.type === "SHOW_PROPOSALS" && action.enabled !== false;
  });
}

function proposalSetFromResponse(value: Record<string, unknown>): ProposalSet | undefined {
  const direct = asRecord(value.proposalSet);
  const result = asRecord(value.result);
  const nested = asRecord(result.proposalSet);
  const candidate = Array.isArray(direct.proposals) ? direct : nested;
  if (!Array.isArray(candidate.proposals)) return undefined;
  return candidate as unknown as ProposalSet;
}

function artifactUrl(item: Record<string, unknown>): string | undefined {
  const direct = [item.downloadUrl, item.url, item.uri].find((value): value is string => typeof value === "string");
  if (direct) return direct;
  return typeof item.id === "string" ? `/api/v1/artifacts/${encodeURIComponent(item.id)}/content` : undefined;
}


function nestedRecords(item: Record<string, unknown>, key: string): readonly Record<string, unknown>[] {
  const candidates = [
    item,
    asRecord(item.data),
    asRecord(item.metadata),
    asRecord(asRecord(item.data).storySet),
    asRecord(asRecord(item.metadata).storySet),
    asRecord(asRecord(item.data).imageBriefSet),
    asRecord(asRecord(item.metadata).imageBriefSet),
    asRecord(asRecord(item.data).solutionSet),
    asRecord(asRecord(item.metadata).solutionSet),
  ];
  for (const candidate of candidates) {
    const value = candidate[key];
    if (Array.isArray(value)) {
      return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object");
    }
  }
  return [];
}

function storyText(item: Record<string, unknown>, keys: readonly string[], fallback: string): string {
  for (const key of keys) {
    const direct = item[key];
    if (typeof direct === "string" && direct.trim()) return direct;
    const payload = asRecord(item.payload);
    const fromPayload = payload[key];
    if (typeof fromPayload === "string" && fromPayload.trim()) return fromPayload;
    const metadata = asRecord(item.metadata);
    const fromMetadata = metadata[key];
    if (typeof fromMetadata === "string" && fromMetadata.trim()) return fromMetadata;
  }
  return fallback;
}

function storyList(item: Record<string, unknown>, keys: readonly string[]): readonly string[] {
  for (const key of keys) {
    const candidates = [item[key], asRecord(item.payload)[key], asRecord(item.metadata)[key]];
    const value = candidates.find(Array.isArray);
    if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string");
  }
  return [];
}

function storyId(item: Record<string, unknown>, index: number): string {
  return storyText(item, ["id", "storyConceptId", "conceptId"], `story-${index + 1}`);
}

function loadStoryPreferences(): { selectedId?: string; favorites: readonly string[] } {
  try {
    const raw = localStorage.getItem(STORY_PREFS_KEY);
    return raw ? JSON.parse(raw) as { selectedId?: string; favorites: readonly string[] } : { favorites: [] };
  } catch {
    return { favorites: [] };
  }
}


function loadImagePreferences(): { selectedId?: string; favorites: readonly string[] } {
  try {
    const raw = localStorage.getItem(IMAGE_PREFS_KEY);
    return raw ? JSON.parse(raw) as { selectedId?: string; favorites: readonly string[] } : { favorites: [] };
  } catch {
    return { favorites: [] };
  }
}

function artifactId(item: Record<string, unknown>, index: number): string {
  return typeof item.id === "string" ? item.id : `image-${index + 1}`;
}

function imageBriefFromArtifact(item: Record<string, unknown>): CreateImageGenerationTaskInput["brief"] | undefined {
  const candidates = [item, asRecord(item.payload), asRecord(item.metadata), asRecord(asRecord(item.payload).brief)];
  const value = candidates.find((candidate) => typeof candidate.id === "string" && typeof candidate.journeyId === "string");
  return value as unknown as CreateImageGenerationTaskInput["brief"] | undefined;
}



function normalizedIdentity(value: unknown): string {
  return typeof value === "string" ? value.trim().toLocaleLowerCase("es-ES").replace(/\s+/g, " ") : "";
}

function uniqueRecords(items: readonly Record<string, unknown>[], fallbackPrefix: string): readonly Record<string, unknown>[] {
  const seen = new Set<string>();
  return items.filter((item, index) => {
    const title = normalizedIdentity(item.title ?? asRecord(item.payload).title ?? asRecord(item.metadata).title);
    const description = normalizedIdentity(item.premise ?? item.description ?? asRecord(item.payload).premise ?? asRecord(item.metadata).premise);
    // Para historias/propuestas, el contenido es una identidad más estable que un ID
    // nuevo generado en cada ejecución del motor.
    const semanticKey = title ? `${fallbackPrefix}:content:${title}:${description}` : "";
    const idKey = typeof item.id === "string" && item.id.trim() ? `${fallbackPrefix}:id:${item.id}` : "";
    const key = semanticKey || idKey || `${fallbackPrefix}-${index}-${JSON.stringify(item)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function latestArtifactSet(items: readonly Record<string, unknown>[]): readonly Record<string, unknown>[] {
  if (items.length <= 1) return items;
  const sorted = [...items].sort((left, right) => {
    const leftVersion = typeof left.version === "number" ? left.version : 0;
    const rightVersion = typeof right.version === "number" ? right.version : 0;
    if (leftVersion !== rightVersion) return rightVersion - leftVersion;
    return String(right.updatedAt ?? right.createdAt ?? "").localeCompare(String(left.updatedAt ?? left.createdAt ?? ""));
  });
  return sorted.slice(0, 1);
}

type SavedWorkspace = {
  readonly chat?: readonly ChatItem[];
  readonly storyExperienceOpen?: boolean;
  readonly imageExperienceOpen?: boolean;
  readonly productExperienceOpen?: boolean;
  readonly proposalSet?: ProposalSet;
  readonly selectedProposalId?: string;
  readonly favoriteProposalIds?: readonly string[];
  readonly imageTaskId?: string;
  readonly imageProgress?: number;
  readonly imageProgressMessage?: string;
  readonly generatingImage?: boolean;
};

function loadWorkspace(): SavedWorkspace {
  try {
    const raw = localStorage.getItem(WORKSPACE_KEY);
    return raw ? JSON.parse(raw) as SavedWorkspace : {};
  } catch {
    return {};
  }
}

function loadProductPreferences(): { selectedProductId?: string; quantities: Readonly<Record<string, number>> } {
  try {
    const raw = localStorage.getItem(PRODUCT_PREFS_KEY);
    return raw ? JSON.parse(raw) as { selectedProductId?: string; quantities: Readonly<Record<string, number>> } : { quantities: {} };
  } catch {
    return { quantities: {} };
  }
}

function productTemplateId(productTemplateIds: readonly string[], templates: readonly PresentationTemplate[]): string | undefined {
  return productTemplateIds.find((templateId) => templates.some((template) => template.id === templateId));
}

function loadSavedSession(): { sessionId?: string; journeyId?: string; credentials?: ExperienceSdkCredentials } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as { sessionId?: string; journeyId?: string; credentials?: ExperienceSdkCredentials } : {};
  } catch {
    return {};
  }
}

export function App() {
  if (window.location.pathname.startsWith("/admin/platform-health")) return <PlatformHealthApp />;
  if (window.location.pathname.startsWith("/admin/gift-brain")) return <GiftBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/proposal-brain")) return <ProposalBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/brain-orchestrator")) return <BrainOrchestratorStudioApp />;
  if (window.location.pathname.startsWith("/admin/conversation-studio")) return <ConversationStudioApp />;
  if (window.location.pathname.startsWith("/admin/memory-brain")) return <MemoryBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/emotion-brain")) return <EmotionBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/intent-brain")) return <IntentBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/intelligence-runtime")) return <BrainIntelligenceStudioApp />;
  if (window.location.pathname.startsWith("/admin/interest-brain-v2")) return <InterestBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/functional-tests")) return <FunctionalTestConsoleApp />;
  if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") return <AdminDashboardApp />;
  if (window.location.pathname.startsWith("/admin/providers")) return <CatalogProvidersApp />;
  if (window.location.pathname.startsWith("/admin/ai-lab")) return <AiLaboratoryApp />;
  if (window.location.pathname.startsWith("/admin/intelligence-center")) return <IntelligenceCenterApp />;
  if (window.location.pathname.startsWith("/admin/commercial-operations")) return <CommercialOperationsApp />;
  if (window.location.pathname.startsWith("/admin/settings")) return <PlatformSettingsApp />;
  if (window.location.pathname.startsWith("/admin/statistics")) return <PlatformStatisticsApp />;
  if (window.location.pathname.startsWith("/admin/catalog-imports")) return <CatalogImportAdminApp />;
  if (window.location.pathname.startsWith("/admin/catalog-intelligence")) return <CatalogIntelligenceApp />;
  if (window.location.pathname.startsWith("/admin/product-brain-studio")) return <ProductBrainStudioApp />;
  if (window.location.pathname.startsWith("/admin/proposal-studio")) return <ProposalStudioApp />;
  if (window.location.pathname.startsWith("/admin/tools")) return <AdminToolsApp />;
  const saved = useMemo(loadSavedSession, []);
  const savedWorkspace = useMemo(loadWorkspace, []);
  const client = useMemo(
    () =>
      new ExperienceSdkClient({
        baseUrl: "/api/v1",
        credentials: saved.credentials,
        timeoutMs: 120_000,
      }),
    [saved.credentials],
  );
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(saved.sessionId);
  const [journeyId, setJourneyId] = useState<string | undefined>(saved.journeyId);
  const [experience, setExperience] = useState<JourneyExperience>();
  const [chat, setChat] = useState<ChatItem[]>(savedWorkspace.chat?.length
    ? [...savedWorkspace.chat]
    : [{ id: id(), role: "rai", text: "Hola, soy Rai. Cuéntame para quién quieres crear un recuerdo especial." }]);
  const [busy, setBusy] = useState(false);
  const [showProposalsAvailable, setShowProposalsAvailable] = useState(Boolean(saved.sessionId));
  const [restoring, setRestoring] = useState(Boolean(saved.journeyId));
  const [error, setError] = useState<string>();
  const [theme, setTheme] = useState<"light" | "dark">(() => localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
  const [hasBegun, setHasBegun] = useState(Boolean(saved.sessionId || saved.journeyId));
  const storyPreferences = useMemo(loadStoryPreferences, []);
  const [storyExperienceOpen, setStoryExperienceOpen] = useState(Boolean(savedWorkspace.storyExperienceOpen));
  const [selectedStoryId, setSelectedStoryId] = useState<string | undefined>(storyPreferences.selectedId);
  const [favoriteStoryIds, setFavoriteStoryIds] = useState<readonly string[]>(storyPreferences.favorites);
  const imagePreferences = useMemo(loadImagePreferences, []);
  const [imageExperienceOpen, setImageExperienceOpen] = useState(Boolean(savedWorkspace.imageExperienceOpen));
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>(imagePreferences.selectedId);
  const [favoriteImageIds, setFavoriteImageIds] = useState<readonly string[]>(imagePreferences.favorites);
  const [imageTaskId, setImageTaskId] = useState<string | undefined>(savedWorkspace.imageTaskId);
  const [imageProgress, setImageProgress] = useState(savedWorkspace.imageProgress ?? 0);
  const [imageProgressMessage, setImageProgressMessage] = useState<string | undefined>(savedWorkspace.imageProgressMessage);
  const [generatingImage, setGeneratingImage] = useState(Boolean(savedWorkspace.generatingImage && savedWorkspace.imageTaskId));
  const productPreferences = useMemo(loadProductPreferences, []);
  const [productExperienceOpen, setProductExperienceOpen] = useState(Boolean(savedWorkspace.productExperienceOpen));
  const [proposalSet, setProposalSet] = useState<ProposalSet | undefined>(savedWorkspace.proposalSet);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [personalizationDraft, setPersonalizationDraft] = useState<PersonalizationDraft>(EMPTY_PERSONALIZATION);
  const [personalizationSaving, setPersonalizationSaving] = useState(false);
  const [personalizationSaved, setPersonalizationSaved] = useState(false);
  const [designSet, setDesignSet] = useState<DesignSet | undefined>();
  const [designGenerating, setDesignGenerating] = useState(false);
  const [designSelecting, setDesignSelecting] = useState<string | undefined>();
  const [renderScene, setRenderScene] = useState<RenderScene | undefined>();
  const [rendering, setRendering] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | undefined>(savedWorkspace.selectedProposalId);
  const [favoriteProposalIds, setFavoriteProposalIds] = useState<readonly string[]>(savedWorkspace.favoriteProposalIds ?? []);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [detailsProposalId, setDetailsProposalId] = useState<string | undefined>();
  const [presentationTemplates, setPresentationTemplates] = useState<readonly PresentationTemplate[]>([]);
  const [presentationsByProduct, setPresentationsByProduct] = useState<Readonly<Record<string, PresentationResult>>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(productPreferences.selectedProductId);
  const [productQuantities, setProductQuantities] = useState<Readonly<Record<string, number>>>(productPreferences.quantities);
  const [creatingPresentations, setCreatingPresentations] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<PurchaseOrder>();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent>();
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  const artifacts = asRecord(experience?.artifacts) as ArtifactGroup;
  const images = useMemo(() => uniqueRecords(artifacts.images ?? [], "image"), [artifacts.images]);
  const imageBriefArtifacts = artifacts.imageBriefs ?? artifacts.imageBrief ?? [];
  const imageBriefs = useMemo(() => uniqueRecords(imageBriefArtifacts.flatMap((item) => {
    const briefs = nestedRecords(item, "briefs");
    return briefs.length > 0 ? briefs : [item];
  }), "image-brief"), [imageBriefArtifacts]);
  const mockups = artifacts.presentations ?? artifacts.mockups ?? [];
  const storyArtifacts = artifacts.stories ?? artifacts.storyConcepts ?? [];
  const stories = useMemo(() => uniqueRecords(latestArtifactSet(storyArtifacts).flatMap((item) => {
    const concepts = nestedRecords(item, "concepts");
    return concepts.length > 0 ? concepts : [item];
  }), "story"), [storyArtifacts]);
  const recommendations = experience?.recommendedProducts ?? [];
  const orders = experience?.orders ?? [];
  const nextAction = asRecord(experience?.nextAction);
  const latestImage = images.find((item, index) => artifactId(item, index) === selectedImageId) ?? images.at(-1);

  const activeStage = useMemo<StageKey>(() => {
    if (orders.some((order) => ["CONFIRMED", "PAID"].includes(String(order.status)))) return "purchase";
    if ((proposalSet?.proposals.length ?? 0) > 0 || mockups.length > 0 || recommendations.length > 0) return "gift";
    if (images.length > 0) return "image";
    if (stories.length > 0) return "story";
    return "conversation";
  }, [images.length, mockups.length, orders, proposalSet?.proposals.length, recommendations.length, stories.length]);

  const raiState = useMemo<RaiState>(() => {
    if (trackingOpen) return "tracking";
    if (paymentComplete) return "celebrating";
    if (processingPayment || checkoutOpen) return "checkout";
    if (generatingImage || creatingPresentations || creatingOrder) return "creating";
    if (busy || restoring) return "thinking";
    if (message.trim().length > 0) return "listening";
    if (selectedImageId || selectedStoryId) return "celebrating";
    return "resting";
  }, [busy, checkoutOpen, creatingOrder, creatingPresentations, generatingImage, message, paymentComplete, processingPayment, restoring, selectedImageId, selectedStoryId, trackingOpen]);

  const raiStatus = RAI_STATE_COPY[raiState];

  async function refreshExperience(currentJourneyId: string): Promise<void> {
    try {
      setExperience(await client.getExperience(currentJourneyId));
    } catch {
      // La experiencia aún puede no existir mientras faltan datos obligatorios.
    }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!saved.journeyId) return;
    void refreshExperience(saved.journeyId).finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    const credentials = client.getCredentials();
    if (sessionId || journeyId || credentials) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, journeyId, credentials }));
    }
  }, [client, journeyId, sessionId]);

  useEffect(() => {
    localStorage.setItem(STORY_PREFS_KEY, JSON.stringify({ selectedId: selectedStoryId, favorites: favoriteStoryIds }));
  }, [favoriteStoryIds, selectedStoryId]);

  useEffect(() => {
    localStorage.setItem(IMAGE_PREFS_KEY, JSON.stringify({ selectedId: selectedImageId, favorites: favoriteImageIds }));
  }, [favoriteImageIds, selectedImageId]);

  useEffect(() => {
    localStorage.setItem(PRODUCT_PREFS_KEY, JSON.stringify({ selectedProductId, quantities: productQuantities }));
  }, [productQuantities, selectedProductId]);

  useEffect(() => {
    localStorage.setItem(WORKSPACE_KEY, JSON.stringify({
      chat,
      storyExperienceOpen,
      imageExperienceOpen,
      productExperienceOpen,
      proposalSet,
      selectedProposalId,
      favoriteProposalIds,
      imageTaskId,
      imageProgress,
      imageProgressMessage,
      generatingImage,
    } satisfies SavedWorkspace));
  }, [chat, favoriteProposalIds, generatingImage, imageExperienceOpen, imageProgress, imageProgressMessage, imageTaskId, productExperienceOpen, proposalSet, selectedProposalId, storyExperienceOpen]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [busy, chat]);

  async function submit(event?: FormEvent): Promise<void> {
    event?.preventDefault();
    const clean = message.trim();
    if (!clean || busy) return;

    setHasBegun(true);
    setChat((items) => [...items, { id: id(), role: "user", text: clean }]);
    setMessage("");
    setBusy(true);
    setError(undefined);

    try {
      const response = sessionId
        ? await client.continueConversation(sessionId, clean)
        : await client.createConversation(clean);
      const resolvedSessionId = sessionIdFromResponse(response as Record<string, unknown>);
      if (!resolvedSessionId) throw new Error("La API no devolvió el identificador de la conversación.");
      setSessionId(resolvedSessionId);
      setShowProposalsAvailable(hasShowProposalsAction(response as Record<string, unknown>));
      const nextJourneyId = response.journey?.id ?? response.session?.journey?.id ?? journeyId;
      if (nextJourneyId) {
        setJourneyId(nextJourneyId);
        await refreshExperience(nextJourneyId);
      }
      setChat((items) => [...items, { id: id(), role: "rai", text: textFromResponse(response) }]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Rai no ha podido continuar. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  async function showProposals(): Promise<void> {
    if (!sessionId || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      const response = await client.showProposals(sessionId);
      const nextProposalSet = proposalSetFromResponse(response as Record<string, unknown>);
      if (nextProposalSet) {
        setProposalSet(nextProposalSet);
        setSelectedProposalId(undefined);
        setComparisonOpen(false);
      }
      const resolvedSessionId = sessionIdFromResponse(response as Record<string, unknown>);
      if (resolvedSessionId) setSessionId(resolvedSessionId);
      setShowProposalsAvailable(hasShowProposalsAction(response as Record<string, unknown>));
      const nextJourneyId = response.journey?.id ?? response.session?.journey?.id ?? journeyId;
      if (nextJourneyId) {
        setJourneyId(nextJourneyId);
        await refreshExperience(nextJourneyId);
      }
      setChat((items) => [...items, { id: id(), role: "rai", text: textFromResponse(response as Record<string, unknown>) }]);
      setStoryExperienceOpen(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Rai no ha podido preparar las propuestas.");
    } finally {
      setBusy(false);
    }
  }

  function exportLogs(): void {
    const credentials = client.getCredentials();
    const safeCredentials = credentials ? {
      ownerKind: credentials.ownerKind,
      ownerId: credentials.ownerId,
      accessToken: credentials.accessToken ? "[REDACTED]" : undefined,
    } : undefined;
    const payload = {
      exportedAt: new Date().toISOString(),
      application: "RecuerdArte Web",
      location: window.location.href,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      sessionId,
      journeyId,
      credentials: safeCredentials,
      activeStage,
      busy,
      restoring,
      generatingImage,
      imageTaskId,
      imageProgress,
      imageProgressMessage,
      productExperienceOpen,
      selectedProductId,
      productQuantities,
      presentationsByProduct,
      activeOrder,
      creatingPresentations,
      creatingOrder,
      checkoutOpen,
      paymentIntent,
      processingPayment,
      paymentComplete,
      trackingOpen,
      lastError: error,
      chat,
      experience,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `recuerdarte-logs-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  function startAgain(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORY_PREFS_KEY);
    localStorage.removeItem(IMAGE_PREFS_KEY);
    localStorage.removeItem(PRODUCT_PREFS_KEY);
    localStorage.removeItem(WORKSPACE_KEY);
    client.setCredentials(undefined);
    setSessionId(undefined);
    setJourneyId(undefined);
    setExperience(undefined);
    setShowProposalsAvailable(false);
    setHasBegun(false);
    setChat([{ id: id(), role: "rai", text: "Empecemos de nuevo. ¿Para quién quieres crear este recuerdo?" }]);
    setError(undefined);
    setSelectedStoryId(undefined);
    setFavoriteStoryIds([]);
    setStoryExperienceOpen(false);
    setSelectedImageId(undefined);
    setFavoriteImageIds([]);
    setImageExperienceOpen(false);
    setImageTaskId(undefined);
    setImageProgress(0);
    setImageProgressMessage(undefined);
    setProductExperienceOpen(false);
    setProposalSet(undefined);
    setSelectedProposalId(undefined);
    setFavoriteProposalIds([]);
    setComparisonOpen(false);
    setDetailsProposalId(undefined);
    setPresentationTemplates([]);
    setPresentationsByProduct({});
    setSelectedProductId(undefined);
    setProductQuantities({});
    setCreatingPresentations(false);
    setCreatingOrder(false);
    setActiveOrder(undefined);
    setCheckoutOpen(false);
    setPaymentIntent(undefined);
    setProcessingPayment(false);
    setPaymentComplete(false);
  }

  function selectProposal(proposalId: string): void {
    setSelectedProposalId(proposalId);
  }

  function toggleProposalFavorite(proposalId: string): void {
    setFavoriteProposalIds((current) => current.includes(proposalId)
      ? current.filter((item) => item !== proposalId)
      : [...current, proposalId]);
  }

  async function personalizeProposal(proposal: ProposalCard): Promise<void> {
    setSelectedProposalId(proposal.id);
    const productId = proposal.actions.find((action) => action.type === "CUSTOMIZE")?.payload?.productId;
    const resolvedProductId = typeof productId === "string" ? productId : proposal.id;
    setSelectedProductId(resolvedProductId);
    setPersonalizationSaved(false);
    setDesignSet(undefined);
    setRenderScene(undefined);

    try {
      const renderResponse = await fetch(`/api/v1/mvp/chat/renders/${encodeURIComponent(proposal.id)}`, {
        credentials: "include",
      });
      if (renderResponse.ok) {
        const renderPayload = await renderResponse.json() as { scene?: RenderScene };
        if (renderPayload.scene) setRenderScene(renderPayload.scene);
      }
    } catch {
      // La vista previa se generará cuando exista un diseño seleccionado.
    }

    try {
      const designResponse = await fetch(`/api/v1/mvp/chat/designs/${encodeURIComponent(proposal.id)}`, {
        credentials: "include",
      });
      if (designResponse.ok) {
        const designPayload = await designResponse.json() as { designSet?: DesignSet };
        if (designPayload.designSet) setDesignSet(designPayload.designSet);
      }
    } catch {
      // Los diseños se generarán cuando el usuario lo solicite.
    }

    let restored: PersonalizationDraft | undefined;
    try {
      const response = await fetch(`/api/v1/mvp/chat/personalizations/${encodeURIComponent(proposal.id)}`, {
        credentials: "include",
      });
      if (response.ok) {
        const payload = await response.json() as { draft?: Partial<PersonalizationDraft> };
        if (payload.draft) {
          restored = {
            ...EMPTY_PERSONALIZATION,
            ...payload.draft,
            proposalId: proposal.id,
            productId: resolvedProductId,
            colors: Array.isArray(payload.draft.colors) ? payload.draft.colors : [],
          };
        }
      }
    } catch {
      // El editor puede abrirse aunque todavía no exista persistencia remota.
    }

    setPersonalizationDraft(restored ?? {
      ...EMPTY_PERSONALIZATION,
      proposalId: proposal.id,
      productId: resolvedProductId,
    });
    setPersonalizationOpen(true);
  }

  async function savePersonalization(): Promise<void> {
    if (!personalizationDraft.proposalId || !personalizationDraft.productId) return;
    setPersonalizationSaving(true);
    setPersonalizationSaved(false);
    setError(undefined);

    try {
      const response = await fetch("/api/v1/mvp/chat/personalizations", {
        method: "PUT",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(personalizationDraft),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "No se pudo guardar la personalización.");
      }

      const payload = await response.json() as { draft?: PersonalizationDraft };
      if (payload.draft) setPersonalizationDraft(payload.draft);
      setPersonalizationSaved(true);
      setChat((items) => [
        ...items,
        { id: id(), role: "rai", text: "He guardado esta personalización. Podemos seguir afinándola sin perder la conversación." },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar la personalización.");
    } finally {
      setPersonalizationSaving(false);
    }
  }

  async function generateDesigns(): Promise<void> {
    if (!personalizationDraft.proposalId || !personalizationDraft.productId) return;
    setDesignGenerating(true);
    setError(undefined);

    try {
      const proposal = proposalSet?.proposals.find((item) => item.id === personalizationDraft.proposalId);
      const response = await fetch("/api/v1/mvp/chat/designs", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...personalizationDraft,
          proposalTitle: proposal?.title,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "No se pudieron preparar los diseños.");
      }

      const payload = await response.json() as { designSet?: DesignSet };
      setDesignSet(payload.designSet);
      setChat((items) => [
        ...items,
        { id: id(), role: "rai", text: "He preparado tres caminos visuales distintos. Elige el que mejor represente el recuerdo y seguiremos trabajando sobre él." },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron preparar los diseños.");
    } finally {
      setDesignGenerating(false);
    }
  }

  async function selectDesign(variantId: string): Promise<void> {
    if (!personalizationDraft.proposalId) return;
    setDesignSelecting(variantId);
    setError(undefined);
    try {
      const response = await fetch(
        `/api/v1/mvp/chat/designs/${encodeURIComponent(personalizationDraft.proposalId)}/selection`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ variantId }),
        },
      );
      if (!response.ok) throw new Error("No se pudo seleccionar el diseño.");
      const payload = await response.json() as { designSet?: DesignSet };
      setDesignSet(payload.designSet);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo seleccionar el diseño.");
    } finally {
      setDesignSelecting(undefined);
    }
  }

  async function renderSelectedDesign(): Promise<void> {
    const selected = designSet?.variants.find(
      (variant) => variant.id === designSet.selectedVariantId || variant.selected,
    );
    if (!selected || !personalizationDraft.proposalId) return;

    setRendering(true);
    setError(undefined);
    try {
      const response = await fetch("/api/v1/mvp/chat/renders", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proposalId: personalizationDraft.proposalId,
          designVariantId: selected.id,
          style: selected.style,
          headline: selected.headline,
          supportingText: selected.supportingText,
          palette: selected.palette,
          photoUrl: personalizationDraft.photoUrl || undefined,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(payload.message ?? "No se pudo generar la vista previa.");
      }

      const payload = await response.json() as { scene?: RenderScene };
      setRenderScene(payload.scene);
      setChat((items) => [
        ...items,
        { id: id(), role: "rai", text: "La vista previa ya está preparada. El diseño sigue estructurado por capas para poder editarlo y adaptarlo después al producto." },
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo generar la vista previa.");
    } finally {
      setRendering(false);
    }
  }

  function updatePersonalization<K extends keyof PersonalizationDraft>(
    key: K,
    value: PersonalizationDraft[K],
  ): void {
    setPersonalizationSaved(false);
    setPersonalizationDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleFavorite(currentStoryId: string): void {
    setFavoriteStoryIds((current) => current.includes(currentStoryId)
      ? current.filter((item) => item !== currentStoryId)
      : [...current, currentStoryId]);
  }

  function selectStory(currentStoryId: string): void {
    setSelectedStoryId(currentStoryId);
  }

  function toggleImageFavorite(currentImageId: string): void {
    setFavoriteImageIds((current) => current.includes(currentImageId)
      ? current.filter((item) => item !== currentImageId)
      : [...current, currentImageId]);
  }

  function selectImage(currentImageId: string): void {
    setSelectedImageId(currentImageId);
  }

  function resolveImageBrief(): CreateImageGenerationTaskInput["brief"] | undefined {
    const selectedIndex = stories.findIndex((story, index) => storyId(story, index) === selectedStoryId);
    const candidate = imageBriefs[selectedIndex >= 0 ? selectedIndex : 0];
    return candidate ? imageBriefFromArtifact(candidate) : undefined;
  }

  async function pollImageTask(taskId: string, currentJourneyId: string): Promise<void> {
    for (let attempt = 0; attempt < 600; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, motionRuntime.taskPollInterval));
      const task = await client.getTask<Record<string, unknown>>(taskId);
      const progress = asRecord(task.progress);
      if (typeof progress.percent === "number") setImageProgress(progress.percent);
      if (typeof progress.message === "string") setImageProgressMessage(progress.message);
      const state = String(task.state ?? "").toUpperCase();
      if (state === "COMPLETED") {
        setImageProgress(100);
        setImageProgressMessage("Tu imagen ya forma parte del recuerdo");
        await refreshExperience(currentJourneyId);
        setGeneratingImage(false);
        setImageTaskId(undefined);
        return;
      }
      if (["FAILED", "CANCELLED"].includes(state)) {
        throw new Error(String(task.error ?? "La generación no pudo completarse."));
      }
    }
    throw new Error("La imagen sigue procesándose. La tarea queda guardada y se retomará al volver.");
  }

  useEffect(() => {
    if (!imageTaskId || !journeyId || !generatingImage) return;
    let cancelled = false;
    void pollImageTask(imageTaskId, journeyId).catch((reason) => {
      if (cancelled) return;
      setGeneratingImage(false);
      setError(reason instanceof Error ? reason.message : "Rai no ha podido crear la imagen.");
    });
    return () => { cancelled = true; };
  }, []);

  async function generateImage(): Promise<void> {
    if (!journeyId || generatingImage) return;
    const brief = resolveImageBrief();
    if (!brief) {
      setError("Rai todavía no tiene una dirección visual preparada. Continúa un poco más la conversación.");
      return;
    }
    setGeneratingImage(true);
    setImageProgress(4);
    setImageProgressMessage("Preparando la dirección visual");
    setError(undefined);
    setImageExperienceOpen(true);
    try {
      const accepted = await client.generateImage({ brief, quality: "medium", format: "png" });
      setImageTaskId(accepted.taskId);
      await pollImageTask(accepted.taskId, journeyId);
    } catch (reason) {
      setGeneratingImage(false);
      setError(reason instanceof Error ? reason.message : "Rai no ha podido crear la imagen.");
    }
  }

  function selectedQuantity(productId: string): number {
    return Math.max(1, productQuantities[productId] ?? 1);
  }

  function changeQuantity(productId: string, delta: number): void {
    setProductQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, Math.min(20, (current[productId] ?? 1) + delta)),
    }));
  }

  async function openProductExperience(): Promise<void> {
    if (!latestImage || creatingPresentations) {
      setProductExperienceOpen(true);
      return;
    }
    setProductExperienceOpen(true);
    setCreatingPresentations(true);
    setError(undefined);
    try {
      const templates = presentationTemplates.length > 0 ? presentationTemplates : await client.listPresentationTemplates();
      if (presentationTemplates.length === 0) setPresentationTemplates(templates);
      const sourceArtifactId = artifactId(latestImage, images.indexOf(latestImage));
      const missing = recommendations.slice(0, 6).filter((recommendation) => !presentationsByProduct[recommendation.product.id]);
      const created = await Promise.all(missing.map(async (recommendation) => {
        const templateId = productTemplateId(recommendation.product.presentationTemplateIds, templates);
        if (!templateId) return undefined;
        const presentation = await client.createPresentation({
          sourceArtifactId,
          templateId,
          title: `${recommendation.product.name} · Tu recuerdo`,
        });
        return [recommendation.product.id, presentation] as const;
      }));
      const additions = Object.fromEntries(created.filter((entry): entry is readonly [string, PresentationResult] => Boolean(entry)));
      setPresentationsByProduct((current) => ({ ...current, ...additions }));
      if (!selectedProductId && recommendations[0]) setSelectedProductId(recommendations[0].product.id);
      if (journeyId) await refreshExperience(journeyId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Rai no ha podido preparar los mockups.");
    } finally {
      setCreatingPresentations(false);
    }
  }

  async function createSelectedOrder(): Promise<void> {
    if (!journeyId || !selectedProductId || creatingOrder) return;
    const recommendation = recommendations.find((item) => item.product.id === selectedProductId);
    if (!recommendation) return;
    setCreatingOrder(true);
    setError(undefined);
    try {
      const presentation = presentationsByProduct[selectedProductId];
      const order = await client.createOrder({
        journeyId,
        lines: [{
          productId: selectedProductId,
          quantity: selectedQuantity(selectedProductId),
          ...(presentation ? { presentationArtifactId: presentation.presentationArtifactId } : {}),
        }],
      });
      setActiveOrder(order);
      setCheckoutOpen(true);
      setPaymentIntent(undefined);
      setPaymentComplete(false);
      await refreshExperience(journeyId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido crear el pedido.");
    } finally {
      setCreatingOrder(false);
    }
  }

  async function completePurchase(): Promise<void> {
    if (!activeOrder || processingPayment) return;
    setProcessingPayment(true);
    setError(undefined);
    try {
      const confirmedOrder = activeOrder.status === "DRAFT"
        ? await client.confirmOrder(activeOrder.id)
        : activeOrder;
      setActiveOrder(confirmedOrder);
      const intent = paymentIntent ?? await client.createPaymentIntent(confirmedOrder.id, {
        idempotencyKey: `recuerdarte-${confirmedOrder.id}`,
      });
      setPaymentIntent(intent);
      const completedIntent = intent.status === "SUCCEEDED"
        ? intent
        : await client.confirmPaymentIntent(intent.id);
      setPaymentIntent(completedIntent);
      const latestOrder = await client.getOrder(confirmedOrder.id);
      setActiveOrder(latestOrder);
      setPaymentComplete(completedIntent.status === "SUCCEEDED" || latestOrder.status === "PAID");
      if (journeyId) await refreshExperience(journeyId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se ha podido completar el pago.");
    } finally {
      setProcessingPayment(false);
    }
  }

  function checkoutProductName(): string {
    return activeOrder?.lines[0]?.name ?? recommendations.find((item) => item.product.id === selectedProductId)?.product.name ?? "Tu recuerdo";
  }

  function checkoutProductionDays(): number {
    return recommendations.find((item) => item.product.id === selectedProductId)?.product.productionDays ?? 5;
  }

  function estimatedDeliveryLabel(): string {
    const date = new Date();
    date.setDate(date.getDate() + checkoutProductionDays() + 2);
    return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(date);
  }

  if (!hasBegun) {
    return <main id="main-content" tabIndex={-1} className="landingShell">
      <div className="landingMist mistOne" /><div className="landingMist mistTwo" />
      <header className="landingHeader">
        <button className="brand landingBrand" type="button" onClick={startAgain} aria-label="RecuerdArte">
          <span className="ribbonLogo" aria-hidden="true"><i /><b /></span>
          <span><strong>RecuerdArte</strong><small>con Rai</small></span>
        </button>
        <div className="topActions">
          <button className="ghostButton" type="button" onClick={exportLogs}>Exportar logs</button>
          <button className="themeButton" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Cambiar tema">
            {theme === "light" ? "Noche" : "Luz"}
          </button>
        </div>
      </header>

      <section className="landingHero">
        <div className="raiHero"><RaiSpirit state={raiState} decorative /></div>
        <p className="landingEyebrow">EL VIENTO QUE CONECTA PERSONAS, MOMENTOS Y RECUERDOS</p>
        <h1>Cuéntame para quién quieres crear <em>un recuerdo inolvidable.</em></h1>
        <p className="landingCopy">No necesitas tener la idea perfecta. Empieza por una persona, un momento o una emoción. Rai te ayudará a darle forma.</p>
        <p className={`raiStateCaption raiStateCaption--${raiState}`}><span />{raiStatus}</p>

        <form onSubmit={(event) => void submit(event)} className="landingComposer">
          <textarea

            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Por ejemplo: Quiero sorprender a mis gemelas por su cumpleaños…"
            rows={2}
            aria-label="Cuéntale a Rai tu idea"
          />
          <button disabled={busy || !message.trim()} aria-label="Comenzar con Rai"><span>Comenzar</span><i>→</i></button>
        </form>
        <p className="landingHint">Escribe como te salga. Rai se encargará de ordenar las ideas.</p>
        {error && <p className="landingError">{error}</p>}
      </section>
      <footer className="landingFooter"><span>RecuerdArte</span><span>Un proyecto de RDuende</span></footer>
    </main>;
  }

  return <main id="main-content" tabIndex={-1} className="appShell">
    <div className="ambient ambientOne" />
    <div className="ambient ambientTwo" />

    <header className="topbar">
      <button className="brand" type="button" onClick={startAgain} aria-label="Comenzar un nuevo recuerdo">
        <span className="ribbonLogo" aria-hidden="true"><i /><b /></span>
        <span><strong>RecuerdArte</strong><small>con Rai</small></span>
      </button>
      <div className="topActions">
        <button className="ghostButton" type="button" onClick={exportLogs}>Exportar logs</button>
        <button className="themeButton compact" type="button" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="Cambiar tema">{theme === "light" ? "Noche" : "Luz"}</button>
        <span className={`projectPulse ${journeyId ? "active" : ""}`}><i />{journeyId ? "Recuerdo en marcha" : "Un nuevo comienzo"}</span>
        {journeyId && <button className="ghostButton" type="button" onClick={startAgain}>Nuevo</button>}
      </div>
    </header>

    <section className="experienceLayout">
      <aside className="journeyRail" aria-label="Progreso del recuerdo">
        <p className="railLabel">EL RECORRIDO DE RAI</p>
        <div className="raiPresence"><RaiSpirit state={raiState} decorative /></div>
        <ol className="timeline">
          {STAGES.map((stage, index) => {
            const currentIndex = STAGES.findIndex((item) => item.key === activeStage);
            const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "pending";
            return <li key={stage.key} className={state}>
              <span className="stageDot">{state === "done" ? "✓" : index + 1}</span>
              <span><strong>{stage.label}</strong><small>{stage.hint}</small></span>
            </li>;
          })}
        </ol>
        <p className="railQuote">“Cada recuerdo empieza con algo que merece ser contado.”</p>
      </aside>

      <section className="conversationStage">
        <div className="conversationIntro">
          <span className="softEyebrow">UN ESPACIO PARA RECORDAR</span>
          <h1>{journeyId ? "Tu recuerdo ya está tomando forma." : "Cuéntame lo que no quieres olvidar."}</h1>
          <p>{journeyId
            ? "Rai está uniendo cada detalle para convertirlo en algo que puedas regalar y conservar."
            : "No hace falta que tengas una idea perfecta. Empieza por una persona, un momento o una emoción."}</p>
        </div>

        <div className="conversationCard">
          <div className="raiHeader">
            <RaiSpirit state={raiState} compact decorative />
            <div><strong>Rai</strong><small>{raiStatus}</small></div>
            <span className="messageCount">{chat.length} momentos</span>
          </div>

          <div className="messages" ref={messagesRef} aria-live="polite">
            {restoring && <div className="restoreState"><span className="spinner" /> Recuperando tu recuerdo…</div>}
            {chat.map((item) => <article key={item.id} className={`message ${item.role}`}>
              {item.role === "rai" && <span className="messageRai" aria-hidden="true" />}
              <div>{item.text}</div>
            </article>)}
            {busy && <article className="message rai">
              <span className="messageRai" aria-hidden="true" />
              <div className="emotionalLoader"><span /><span /><span /><em>{raiStatus}</em></div>
            </article>}
          </div>

          <form onSubmit={(event) => void submit(event)} className="composer">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Escribe como te salga… Rai te ayudará a darle forma."
              rows={2}
              aria-label="Mensaje para Rai"
            />
            <button disabled={busy || !message.trim()} aria-label="Enviar mensaje"><span>Enviar</span><i>→</i></button>
          </form>
          <div className="composerActions">
            <div className="composerHint"><span>↵ para enviar</span><span>Mayús + ↵ para nueva línea</span></div>
            {showProposalsAvailable && sessionId && <button className="showProposalsButton" type="button" disabled={busy} onClick={() => void showProposals()}>
              <span>{busy ? "Preparando propuestas…" : "Mostrar propuestas"}</span><i>✦</i>
            </button>}
          </div>
          {error && <p className="errorBanner">{error}</p>}
        </div>
      </section>

      <aside className="memoryCanvas">
        <div className="canvasHeader"><span>Tu recuerdo</span><small>{activeStage === "conversation" ? "esperando detalles" : "en construcción"}</small></div>

        {!experience && !proposalSet ? <div className="emptyCanvas">
          <div className="emptyOrb"><span /><i /><b /></div>
          <h2>Aquí aparecerá la magia.</h2>
          <p>Mientras hablas con Rai, este espacio irá llenándose de historias, imágenes y formas de convertirlas en un regalo.</p>
        </div> : <div className="experienceCanvas">
          {personalizationOpen && <div className="personalizationBackdrop" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPersonalizationOpen(false);
          }}>
            <aside className="personalizationEditor" role="dialog" aria-modal="true" aria-label="Editor de personalización">
              <header className="personalizationEditor__header">
                <div><small>PERSONALIZA TU RECUERDO</small><h2>Dale los detalles que lo hacen único.</h2></div>
                <button type="button" className="personalizationClose" onClick={() => setPersonalizationOpen(false)} aria-label="Cerrar">×</button>
              </header>
              <div className="personalizationPreview">
                <span className="personalizationPreview__glow" />
                <strong>{personalizationDraft.name || "Tu nombre aquí"}</strong>
                <p>{personalizationDraft.dedication || "Tu dedicatoria aparecerá en esta previsualización."}</p>
                {personalizationDraft.date && <small>{personalizationDraft.date}</small>}
              </div>
              <div className="personalizationForm">
                <label><span>Nombre o nombres</span><input value={personalizationDraft.name} onChange={(event) => updatePersonalization("name", event.target.value)} placeholder="María y José" /></label>
                <label><span>Dedicatoria</span><textarea value={personalizationDraft.dedication} onChange={(event) => updatePersonalization("dedication", event.target.value)} placeholder="Escribe unas palabras que solo vosotros entendáis..." /></label>
                <div className="personalizationForm__row">
                  <label><span>Fecha especial</span><input type="date" value={personalizationDraft.date} onChange={(event) => updatePersonalization("date", event.target.value)} /></label>
                  <label><span>Colores</span><input value={personalizationDraft.colors.join(", ")} onChange={(event) => updatePersonalization("colors", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} placeholder="Azul, dorado" /></label>
                </div>
                <label><span>Fotografía</span><input value={personalizationDraft.photoUrl} onChange={(event) => updatePersonalization("photoUrl", event.target.value)} placeholder="URL temporal de la fotografía" /></label>
                <label><span>Notas para Rai</span><textarea value={personalizationDraft.notes} onChange={(event) => updatePersonalization("notes", event.target.value)} placeholder="Algo que debamos respetar en el diseño..." /></label>
              </div>
              <section className="designStudio">
                <div className="designStudio__heading">
                  <div><small>RAI DESIGN STUDIO</small><h3>Tres formas de contar el mismo recuerdo.</h3></div>
                  <button type="button" className="proposalPrimary" onClick={() => void generateDesigns()} disabled={designGenerating}>
                    {designGenerating ? "Rai está componiendo..." : designSet ? "Regenerar diseños" : "Generar 3 diseños"}
                  </button>
                </div>
                {designGenerating && <div className="designStudioProgress">
                  <span className="designStudioProgress__mark">RA</span>
                  <div><strong>Preparando composiciones</strong><small>Jerarquía, color, texto e imagen</small></div>
                </div>}
                {designSet && <div className="designGrid">
                  {designSet.variants.map((variant) => {
                    const selected = designSet.selectedVariantId === variant.id || variant.selected;
                    return <article key={variant.id} className={`designCard designCard--${variant.style.toLowerCase()}${selected ? " is-selected" : ""}`}>
                      <div className="designCard__preview" style={{ ["--design-a" as string]: variant.palette[0] ?? "#ead6e2", ["--design-b" as string]: variant.palette[1] ?? "#d8e7e1" }}>
                        <small>{variant.title}</small>
                        <strong>{variant.headline}</strong>
                        <p>{variant.supportingText}</p>
                      </div>
                      <div className="designCard__body">
                        <h4>{variant.title}</h4>
                        <p>{variant.description}</p>
                        <small>{variant.typography.display} · {variant.layout.composition}</small>
                        <button type="button" onClick={() => void selectDesign(variant.id)} disabled={selected || designSelecting === variant.id}>
                          {selected ? "✓ Diseño elegido" : designSelecting === variant.id ? "Eligiendo..." : "Elegir diseño"}
                        </button>
                      </div>
                    </article>;
                  })}
                </div>}
                {designSet?.selectedVariantId && <section className="renderPipeline">
                  <div className="renderPipeline__heading">
                    <div><small>RENDER PIPELINE</small><h3>Vista previa estructurada y editable.</h3></div>
                    <button type="button" className="proposalPrimary" onClick={() => void renderSelectedDesign()} disabled={rendering}>
                      {rendering ? "Renderizando..." : renderScene ? "Actualizar vista previa" : "Generar vista previa"}
                    </button>
                  </div>
                  {rendering && <div className="renderProgress">
                    {["Analizando fotografía","Preparando composición","Ajustando tipografía","Aplicando colores","Generando vista previa"].map((step, index) =>
                      <span key={step} className={index < 3 ? "is-done" : index === 3 ? "is-active" : ""}>{index < 3 ? "✓" : index === 3 ? "◌" : "·"} {step}</span>
                    )}
                  </div>}
                  {renderScene && <div className="renderWorkspace">
                    <div className="renderPreview" dangerouslySetInnerHTML={{ __html: renderScene.svg }} />
                    <aside className="renderLayers">
                      <strong>Capas</strong>
                      {renderScene.layers.map((layer) => <span key={layer.id}><b>{layer.type}</b>{layer.name}</span>)}
                      <small>Versión {renderScene.version}</small>
                    </aside>
                  </div>}
                </section>}
              </section>
              <footer className="personalizationEditor__footer">
                <span>{personalizationSaved ? "✓ Borrador guardado" : "Los cambios aún no se han guardado"}</span>
                <div>
                  <button type="button" onClick={() => setPersonalizationOpen(false)}>Seguir mirando</button>
                  <button type="button" className="proposalPrimary" onClick={() => void savePersonalization()} disabled={personalizationSaving}>
                    {personalizationSaving ? "Guardando..." : "Guardar personalización"}
                  </button>
                </div>
              </footer>
            </aside>
          </div>}
          {proposalSet && proposalSet.proposals.length > 0 && <section className="proposalExperience" aria-label="Propuestas de regalo">
            <header className="proposalExperience__header">
              <div><small>PROPUESTAS DE RAI</small><h2>Tres formas de convertir la historia en regalo.</h2></div>
              <button type="button" className="ghostButton" onClick={() => setComparisonOpen((current) => !current)}>
                {comparisonOpen ? "Cerrar comparación" : "Comparar propuestas"}
              </button>
            </header>
            <div className="proposalGrid">
              {proposalSet.proposals.map((proposal, index) => {
                const favorite = favoriteProposalIds.includes(proposal.id);
                const selected = selectedProposalId === proposal.id;
                const detailsOpen = detailsProposalId === proposal.id;
                return <article key={proposal.id} className={`proposalCard ${selected ? "selected" : ""}`}>
                  <div className="proposalCard__media">
                    {proposal.media.imageUrl
                      ? <img src={proposal.media.imageUrl} alt={proposal.media.alt} />
                      : <div className="proposalCard__placeholder"><span>{index + 1}</span><small>Visual preparado por Rai</small></div>}
                    <button type="button" className={`proposalFavorite ${favorite ? "active" : ""}`} onClick={() => toggleProposalFavorite(proposal.id)} aria-label={favorite ? "Quitar de favoritos" : "Añadir a favoritos"}>♥</button>
                    <div className="proposalBadges">{proposal.badges.slice(0, 3).map((badge) => <span key={badge}>{badge}</span>)}</div>
                  </div>
                  <div className="proposalCard__body">
                    <small>PROPUESTA {index + 1}</small>
                    <h3>{proposal.title}</h3>
                    <p className="proposalSubtitle">{proposal.subtitle}</p>
                    <p>{proposal.description}</p>
                    <div className="proposalStats">
                      <strong>{typeof proposal.price === "number" ? `${proposal.price.toFixed(2)} €` : "Precio por confirmar"}</strong>
                      <span>{Math.round(proposal.score)}% de afinidad</span>
                    </div>
                    {detailsOpen && <div className="proposalDetails">
                      {proposal.emotionalStory && <p><b>La historia:</b> {proposal.emotionalStory}</p>}
                      <ul>{proposal.whyItFits.slice(0, 4).map((reason) => <li key={reason}>{reason}</li>)}</ul>
                      <p><b>Producción:</b> {proposal.production.estimatedDays ? `${proposal.production.estimatedDays} días` : "por confirmar"}{proposal.production.technique ? ` · ${proposal.production.technique}` : ""}</p>
                    </div>}
                    <div className="proposalActions">
                      <button type="button" className="proposalPrimary" onClick={() => personalizeProposal(proposal)}>Personalizar</button>
                      <button type="button" onClick={() => selectProposal(proposal.id)} disabled={selected}>{selected ? "Elegida" : "Elegir"}</button>
                      <button type="button" onClick={() => setDetailsProposalId(detailsOpen ? undefined : proposal.id)}>{detailsOpen ? "Ocultar" : "Ver detalles"}</button>
                    </div>
                  </div>
                </article>;
              })}
            </div>
            {comparisonOpen && <div className="proposalComparison">
              <div className="proposalComparison__row proposalComparison__head"><span>Comparación</span>{proposalSet.proposals.map((proposal) => <strong key={proposal.id}>{proposal.title}</strong>)}</div>
              <div className="proposalComparison__row"><span>Precio</span>{proposalSet.proposals.map((proposal) => <b key={proposal.id}>{typeof proposal.price === "number" ? `${proposal.price.toFixed(2)} €` : "—"}</b>)}</div>
              <div className="proposalComparison__row"><span>Afinidad</span>{proposalSet.proposals.map((proposal) => <b key={proposal.id}>{Math.round(proposal.score)}%</b>)}</div>
              <div className="proposalComparison__row"><span>Presupuesto</span>{proposalSet.proposals.map((proposal) => <b key={proposal.id}>{proposal.withinBudget ? "Sí" : "No"}</b>)}</div>
            </div>}
          </section>}
          {latestImage ? <figure className="heroMemory">
            {artifactUrl(latestImage) ? <img src={artifactUrl(latestImage)} alt="Imagen creada para el recuerdo" /> : <div className="imagePlaceholder">Imagen creada</div>}
            <figcaption><span>La imagen de tu historia</span><small>Versión {String(latestImage.version ?? images.length)}</small></figcaption>
          </figure> : <div className="formingMemory">
            <span className="formingGlow" />
            <p>{stories.length > 0 ? "La historia ya existe. La imagen será el siguiente soplo." : "Cada detalle que compartes deja una huella aquí."}</p>
          </div>}

          {stories.length > 0 && <section className="storyInvitation">
            <div>
              <small>LAS HISTORIAS QUE HAN NACIDO</small>
              <strong>{selectedStoryId ? "Ya has elegido el hilo de tu recuerdo" : `${stories.length} caminos para emocionar`}</strong>
              <p>{selectedStoryId ? "Puedes volver a compararlas cuando quieras antes de crear la imagen." : "Léelas sin prisa. La adecuada suele ser la que te hace imaginar a esa persona dentro."}</p>
            </div>
            <button type="button" onClick={() => setStoryExperienceOpen(true)}>{selectedStoryId ? "Revisar historias" : "Descubrir historias"}<span>→</span></button>
          </section>}

          {selectedStoryId && <section className="imageInvitation">
            <div>
              <small>LA IMAGEN · EL TERCER SOPLO</small>
              <strong>{images.length > 0 ? "Tu historia ya tiene rostro" : "Ha llegado el momento de verla"}</strong>
              <p>{images.length > 0 ? "Compara las versiones, guarda tus favoritas o pídele a Rai una nueva interpretación." : "Rai transformará la historia elegida en una imagen creada solo para este recuerdo."}</p>
            </div>
            <div className="imageInvitationActions">
              {images.length > 0 && <button className="secondary" type="button" onClick={() => setImageExperienceOpen(true)}>Ver galería</button>}
              <button type="button" disabled={generatingImage} onClick={() => void generateImage()}>{generatingImage ? "Creando…" : images.length > 0 ? "Crear otra versión" : "Crear la imagen"}<span>→</span></button>
            </div>
          </section>}

          {selectedImageId && <section className="productInvitation">
            <div>
              <small>EL REGALO · EL CUARTO SOPLO</small>
              <strong>{activeOrder ? "Tu regalo ya está preparado" : mockups.length > 0 ? "Ya puedes verlo convertido en regalo" : "Ahora la imagen se vuelve algo que puedes tocar"}</strong>
              <p>{activeOrder ? "Revisa el pedido y continúa cuando quieras hacia el pago." : "Rai aplicará tu imagen a los productos que mejor encajan con la historia, el presupuesto y la persona."}</p>
            </div>
            <button type="button" onClick={() => activeOrder ? setCheckoutOpen(true) : void openProductExperience()}>{activeOrder ? "Revisar y pagar" : "Ver regalos"}<span>→</span></button>
          </section>}

          <div className="memoryStats">
            <div><strong>{stories.length}</strong><span>historias</span></div>
            <div><strong>{images.length}</strong><span>imágenes</span></div>
            <div><strong>{mockups.length}</strong><span>regalos</span></div>
          </div>

          {recommendations.length > 0 && <div className="recommendationStack">
            <p>Rai cree que podrían encajar</p>
            {recommendations.slice(0, 3).map((item, index) => {
              const product = item.product;
              return <article key={product.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><strong>{product.name}</strong><small>{item.reasons[0] ?? "Elegido por afinidad con tu historia"}</small></div>
                <b>{product.price} €</b>
              </article>;
            })}
          </div>}

          {Object.keys(nextAction).length > 0 && <div className="nextWhisper">
            <small>EL SIGUIENTE SOPLO</small>
            <strong>{String(nextAction.label ?? nextAction.type ?? "Seguir creando")}</strong>
            <p>{String(nextAction.reason ?? "Rai te acompañará en el siguiente paso.")}</p>
          </div>}
        </div>}
      </aside>
    </section>

    {storyExperienceOpen && <section className="storyExperience" role="dialog" aria-modal="true" aria-label="Historias propuestas por Rai">
      <div className="storyExperienceMist" />
      <header className="storyExperienceHeader">
        <div>
          <span>LA IDEA · EL SEGUNDO SOPLO</span>
          <h2>¿Qué historia se parece más a vuestro recuerdo?</h2>
          <p>No busques la más perfecta. Elige la que te haga sentir algo al imaginarla convertida en imagen y regalo.</p>
        </div>
        <button type="button" className="storyClose" onClick={() => setStoryExperienceOpen(false)} aria-label="Cerrar historias">×</button>
      </header>

      <div className="storyDeck">
        {stories.map((story, index) => {
          const currentId = storyId(story, index);
          const title = storyText(story, ["title", "name"], `Historia ${index + 1}`);
          const premise = storyText(story, ["premise", "summary", "description", "logline"], "Una historia creada a partir de todo lo que le has contado a Rai.");
          const emotionalPromise = storyText(story, ["emotionalPromise", "emotionalGoal", "tone"], "Un recuerdo para volver a sentir este momento.");
          const beats = storyList(story, ["beats", "highlights", "keyMoments"]);
          const favorite = favoriteStoryIds.includes(currentId);
          const selected = selectedStoryId === currentId;
          return <article className={`storyCard ${selected ? "selected" : ""}`} key={currentId}>
            <div className="storyCardNumber">{String(index + 1).padStart(2, "0")}</div>
            <button className={`storyFavorite ${favorite ? "active" : ""}`} type="button" onClick={() => toggleFavorite(currentId)} aria-label={favorite ? "Quitar de favoritas" : "Marcar como favorita"}>{favorite ? "♥" : "♡"}</button>
            <div className="storyCardBody">
              <span className="storyKicker">UNA DIRECCIÓN PARA TU RECUERDO</span>
              <h3>{title}</h3>
              <p className="storyPremise">{premise}</p>
              {beats.length > 0 && <ol className="storyBeats">{beats.slice(0, 3).map((beat, beatIndex) => <li key={`${currentId}-${beatIndex}`}><span>{beatIndex + 1}</span>{beat}</li>)}</ol>}
              <blockquote>“{emotionalPromise}”</blockquote>
            </div>
            <footer>
              <span>{selected ? "Esta es tu historia" : favorite ? "Guardada para comparar" : "Escucha lo que te hace sentir"}</span>
              <button type="button" onClick={() => selectStory(currentId)}>{selected ? "Elegida ✓" : "Elegir esta historia"}</button>
            </footer>
          </article>;
        })}
      </div>

      <div className="storyExperienceFooter">
        <p>{selectedStoryId ? "Rai ya sabe qué hilo seguir para crear la imagen." : "Puedes guardar varias favoritas y decidir después."}</p>
        <button type="button" disabled={!selectedStoryId} onClick={() => { setStoryExperienceOpen(false); setImageExperienceOpen(true); }}><span>{selectedStoryId ? "Continuar hacia la imagen" : "Elige una historia para continuar"}</span><i>→</i></button>
      </div>
    </section>}

    {imageExperienceOpen && <section className="imageExperience" role="dialog" aria-modal="true" aria-label="Imágenes creadas por Rai">
      <div className="imageExperienceMist" />
      <header className="imageExperienceHeader">
        <div>
          <span>LA IMAGEN · EL TERCER SOPLO</span>
          <h2>La historia empieza a poder mirarse.</h2>
          <p>Guarda las versiones que te emocionen, compáralas y elige la que quieres convertir en regalo.</p>
        </div>
        <button type="button" className="storyClose" onClick={() => setImageExperienceOpen(false)} aria-label="Cerrar galería">×</button>
      </header>

      {generatingImage && <div className="imageGenerationStage">
        <div className="generationRai"><span /><i /><b /></div>
        <small>{imageTaskId ? `CREACIÓN ${imageTaskId.slice(0, 8).toUpperCase()}` : "RAI ESTÁ IMAGINANDO"}</small>
        <h3>{imageProgressMessage ?? "Dejando que la historia tome forma"}</h3>
        <div className="generationTrack"><span style={{ width: `${Math.max(4, imageProgress)}%` }} /></div>
        <p>{Math.round(imageProgress)}% · Puedes cerrar esta vista; el recuerdo seguirá construyéndose.</p>
      </div>}

      {!generatingImage && images.length === 0 && <div className="emptyImageExperience">
        <div className="emptyImageOrb"><span /><i /><b /></div>
        <h3>Tu primera imagen aún está en el viento.</h3>
        <p>Rai usará la historia elegida y su dirección visual para crear una interpretación única.</p>
        <button type="button" onClick={() => void generateImage()}>Crear la primera imagen <span>→</span></button>
      </div>}

      {images.length > 0 && <div className="imageGallery">
        {images.map((image, index) => {
          const currentId = artifactId(image, index);
          const url = artifactUrl(image);
          const favorite = favoriteImageIds.includes(currentId);
          const selected = selectedImageId === currentId;
          return <article className={`imageCard ${selected ? "selected" : ""}`} key={currentId}>
            <div className="imageCardVisual">
              {url ? <img src={url} alt={`Versión ${index + 1} del recuerdo`} /> : <div className="imagePlaceholder">Imagen {index + 1}</div>}
              <span className="imageVersion">VERSIÓN {String(image.version ?? index + 1)}</span>
              <button className={`imageFavorite ${favorite ? "active" : ""}`} type="button" onClick={() => toggleImageFavorite(currentId)} aria-label={favorite ? "Quitar de favoritas" : "Marcar como favorita"}>{favorite ? "♥" : "♡"}</button>
            </div>
            <footer>
              <div><strong>{selected ? "La imagen elegida" : favorite ? "Guardada para comparar" : "Una interpretación de Rai"}</strong><small>{String(asRecord(image.metadata).model ?? asRecord(image.metadata).provider ?? "Creación original")}</small></div>
              <button type="button" onClick={() => selectImage(currentId)}>{selected ? "Elegida ✓" : "Elegir esta imagen"}</button>
            </footer>
          </article>;
        })}
      </div>}

      <div className="imageExperienceFooter">
        <button className="regenerateButton" type="button" disabled={generatingImage || !selectedStoryId} onClick={() => void generateImage()}>{generatingImage ? "Rai está creando…" : "Crear otra interpretación"}</button>
        <div>
          <p>{selectedImageId ? "Esta imagen será la base de los mockups y productos." : "Elige una imagen para continuar hacia el regalo."}</p>
          <button type="button" disabled={!selectedImageId} onClick={() => { setImageExperienceOpen(false); void openProductExperience(); }}>Continuar hacia el regalo <span>→</span></button>
        </div>
      </div>
    </section>}

    {productExperienceOpen && <section className="productExperience" role="dialog" aria-modal="true" aria-label="Productos recomendados por Rai">
      <div className="productExperienceMist" />
      <header className="productExperienceHeader">
        <div>
          <span>EL REGALO · EL CUARTO SOPLO</span>
          <h2>Tu recuerdo empieza a poder tocarse.</h2>
          <p>Compara cómo se siente en cada producto. El precio y la disponibilidad se recalculan siempre desde el catálogo.</p>
        </div>
        <button type="button" className="storyClose" onClick={() => setProductExperienceOpen(false)} aria-label="Cerrar productos">×</button>
      </header>

      {creatingPresentations && <div className="productPreparing">
        <div className="generationRai"><span /><i /><b /></div>
        <small>RAI ESTÁ PREPARANDO LOS REGALOS</small>
        <h3>Aplicando tu imagen a cada producto</h3>
        <p>Los mockups se guardarán dentro del Journey para que puedas volver a ellos.</p>
      </div>}

      {!creatingPresentations && recommendations.length === 0 && <div className="productPreparing">
        <h3>Aún faltan recomendaciones de producto.</h3>
        <p>Continúa la conversación para que Rai conozca mejor el presupuesto, la ocasión y a la persona.</p>
      </div>}

      {!creatingPresentations && recommendations.length > 0 && <div className="productGrid">
        {recommendations.slice(0, 6).map((recommendation, index) => {
          const product = recommendation.product;
          const presentation = presentationsByProduct[product.id];
          const selected = selectedProductId === product.id;
          const quantity = selectedQuantity(product.id);
          const total = product.price * quantity;
          return <article key={product.id} className={`productCard ${selected ? "selected" : ""}`}>
            <div className="productVisual">
              {presentation ? <img src={presentation.downloadUrl} alt={`Mockup de ${product.name}`} /> : latestImage && artifactUrl(latestImage) ? <img src={artifactUrl(latestImage)} alt={product.name} /> : <div className="productPlaceholder">{product.name}</div>}
              <span className="productRank">{String(index + 1).padStart(2, "0")}</span>
              {recommendation.withinBudget && <span className="productBadge">Dentro del presupuesto</span>}
            </div>
            <div className="productBody">
              <div className="productTitleRow"><div><small>{product.category}</small><h3>{product.name}</h3></div><strong>{product.price.toFixed(2)} €</strong></div>
              <p>{recommendation.reasons[0] ?? "Elegido por afinidad con tu recuerdo."}</p>
              <div className="productMeta"><span>{product.productionDays} días de producción</span><span>{product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}</span><span>{Math.round(recommendation.score)} puntos</span></div>
              {recommendation.warnings.length > 0 && <div className="productWarning">{recommendation.warnings[0]}</div>}
              <footer>
                <div className="quantityControl" aria-label={`Cantidad de ${product.name}`}><button type="button" onClick={() => changeQuantity(product.id, -1)} disabled={quantity <= 1}>−</button><span>{quantity}</span><button type="button" onClick={() => changeQuantity(product.id, 1)} disabled={quantity >= Math.max(1, product.stock)}>+</button></div>
                <button className="chooseProduct" type="button" disabled={!recommendation.available} onClick={() => setSelectedProductId(product.id)}>{selected ? "Elegido ✓" : "Elegir este regalo"}</button>
              </footer>
              <div className="productTotal"><span>Total</span><strong>{total.toFixed(2)} €</strong></div>
            </div>
          </article>;
        })}
      </div>}

      <div className="productExperienceFooter">
        <button className="secondaryProductAction" type="button" onClick={() => { setProductExperienceOpen(false); setImageExperienceOpen(true); }}>Cambiar imagen</button>
        <div>
          {activeOrder ? <><p>Pedido {activeOrder.id.slice(0, 8)} · {activeOrder.status}</p><strong>{activeOrder.totals.total.toFixed(2)} {activeOrder.totals.currency}</strong></> : <p>{selectedProductId ? "El precio final se recalculará desde el catálogo antes de crear el pedido." : "Elige un producto para preparar el pedido."}</p>}
          <button type="button" disabled={!selectedProductId || creatingOrder} onClick={() => activeOrder ? setCheckoutOpen(true) : void createSelectedOrder()}>{activeOrder ? "Continuar al pago" : creatingOrder ? "Preparando pedido…" : "Preparar este regalo"}<span>→</span></button>
        </div>
      </div>
    </section>}


    {checkoutOpen && activeOrder && <section className="checkoutExperience" role="dialog" aria-modal="true" aria-label="Compra de tu recuerdo">
      <div className="checkoutMist" />
      <header className="checkoutHeader">
        <button type="button" className="checkoutBack" onClick={() => setCheckoutOpen(false)}>← Volver</button>
        <div className="checkoutBrand"><span className="ribbonLogo" aria-hidden="true"><i /><b /></span><span><strong>RecuerdArte</strong><small>el último soplo</small></span></div>
        <button type="button" className="ghostButton" onClick={exportLogs}>Exportar logs</button>
      </header>

      {!paymentComplete ? <div className="checkoutLayout">
        <section className="checkoutStory">
          <span>PARA SIEMPRE · EL QUINTO SOPLO</span>
          <h2>Ya casi está listo.</h2>
          <p>En unos días, este recuerdo dejará de vivir solo en una pantalla y empezará a formar parte de vuestra historia.</p>
          <div className="checkoutRai"><span /><i /><b /></div>
          <blockquote>“Ahora nosotros nos encargamos de convertirlo en algo que puedas tocar.”</blockquote>
        </section>

        <section className="checkoutSummary">
          <div className="checkoutSummaryHeader"><span>Tu recuerdo</span><small>Pedido {activeOrder.id.slice(0, 8)}</small></div>
          <div className="checkoutProductRow">
            <div className="checkoutThumb">{latestImage && artifactUrl(latestImage) ? <img src={artifactUrl(latestImage)} alt="Imagen elegida" /> : <span>RA</span>}</div>
            <div><small>REGALO PERSONALIZADO</small><strong>{checkoutProductName()}</strong><p>{activeOrder.lines.reduce((sum, line) => sum + line.quantity, 0)} {activeOrder.lines.reduce((sum, line) => sum + line.quantity, 0) === 1 ? "unidad" : "unidades"}</p></div>
          </div>
          <div className="checkoutDelivery"><span>Entrega estimada</span><strong>{estimatedDeliveryLabel()}</strong><small>Incluye producción y preparación</small></div>
          <div className="checkoutTotals">
            <div><span>Productos</span><b>{activeOrder.totals.subtotal.toFixed(2)} {activeOrder.totals.currency}</b></div>
            <div><span>Envío</span><b>{activeOrder.totals.shipping === 0 ? "Incluido" : `${activeOrder.totals.shipping.toFixed(2)} ${activeOrder.totals.currency}`}</b></div>
            <div className="checkoutGrandTotal"><span>Total</span><strong>{activeOrder.totals.total.toFixed(2)} {activeOrder.totals.currency}</strong></div>
          </div>
          <div className="checkoutSecurity"><span>Pago de demostración seguro</span><small>El proveedor actual es mock. No se solicitarán ni almacenarán datos bancarios.</small></div>
          <button className="checkoutPay" type="button" disabled={processingPayment} onClick={() => void completePurchase()}>
            {processingPayment ? "Confirmando tu recuerdo…" : `Confirmar y pagar ${activeOrder.totals.total.toFixed(2)} ${activeOrder.totals.currency}`}<span>→</span>
          </button>
          {paymentIntent && <p className="paymentState">Pago {paymentIntent.id.slice(0, 8)} · {paymentIntent.status}</p>}
        </section>
      </div> : <div className="purchaseComplete">
        <div className="completeRai"><span /><i /><b /></div>
        <small>TU RECUERDO YA HA COMENZADO SU VIAJE</small>
        <h2>Ahora nosotros nos encargamos.</h2>
        <p>Convertiremos esta historia en algo que puedas tocar, regalar y volver a mirar dentro de muchos años.</p>
        <div className="productionTimeline">
          {[
            ["Idea", "done"], ["Historia", "done"], ["Imagen", "done"], ["Producto", "done"],
            ["Fabricación", "active"], ["Control de calidad", "pending"], ["Preparando envío", "pending"], ["En camino", "pending"],
          ].map(([label, status], index) => <div className={`productionStep ${status}`} key={label}><span>{status === "done" ? "✓" : index + 1}</span><div><strong>{label}</strong><small>{status === "active" ? "El siguiente paso" : status === "done" ? "Completado" : "Próximamente"}</small></div></div>)}
        </div>
        <div className="completeOrder"><span>Pedido</span><strong>{activeOrder.id}</strong><b>{activeOrder.totals.total.toFixed(2)} {activeOrder.totals.currency}</b></div>
        <div className="completeActions"><button type="button" onClick={() => setTrackingOpen(true)}>Ver seguimiento <span>→</span></button><button type="button" className="secondaryTrackButton" onClick={() => setCheckoutOpen(false)}>Volver a mi recuerdo</button></div>
      </div>}
    </section>}


    {trackingOpen && activeOrder && <section className="trackingExperience" role="dialog" aria-modal="true" aria-label="Seguimiento de producción">
      <div className="trackingGlow" />
      <header className="trackingHeader">
        <button type="button" className="checkoutBack" onClick={() => setTrackingOpen(false)}>← Volver</button>
        <div className="checkoutBrand"><span className="ribbonLogo" aria-hidden="true"><i /><b /></span><span><strong>RecuerdArte</strong><small>seguimiento del recuerdo</small></span></div>
        <button type="button" className="ghostButton" onClick={exportLogs}>Exportar logs</button>
      </header>
      <div className="trackingLayout">
        <section className="trackingHero">
          <small>PEDIDO {activeOrder.id.slice(0, 8).toUpperCase()}</small>
          <h2>Tu recuerdo está en camino.</h2>
          <p>Seguiremos cada paso de la producción para que sepas cuándo deja de ser una idea y empieza a convertirse en algo que podrás tocar.</p>
          <div className="trackingStatusCard"><span>Estado actual</span><strong>Preparando fabricación</strong><p>El diseño y los archivos de producción están siendo revisados.</p></div>
        </section>
        <section className="trackingPanel">
          <div className="trackingProduct">
            <div className="trackingThumb">{latestImage && artifactUrl(latestImage) ? <img src={artifactUrl(latestImage)} alt="Imagen del pedido" /> : <span>RA</span>}</div>
            <div><small>RECUERDO PERSONALIZADO</small><strong>{checkoutProductName()}</strong><p>{activeOrder.lines.reduce((sum, line) => sum + line.quantity, 0)} unidades · {activeOrder.totals.total.toFixed(2)} {activeOrder.totals.currency}</p></div>
          </div>
          <div className="trackingSteps">
            {[
              ["Idea", "La conversación con Rai dio forma al recuerdo", "done"],
              ["Historia", "La propuesta creativa quedó elegida", "done"],
              ["Imagen", "La imagen final quedó preparada", "done"],
              ["Producto", "El regalo y las cantidades quedaron confirmados", "done"],
              ["Fabricación", "Estamos preparando la producción", "active"],
              ["Control de calidad", "Revisaremos color, acabado y personalización", "pending"],
              ["Preparando envío", "Embalaje y documentación", "pending"],
              ["En camino", "Recibirás el seguimiento del transporte", "pending"],
              ["Entregado", "El recuerdo llega a su destino", "pending"],
            ].map(([label, description, status], index) => <div className={`trackingStep ${status}`} key={label}>
              <span>{status === "done" ? "✓" : String(index + 1).padStart(2, "0")}</span>
              <div><strong>{label}</strong><p>{description}</p></div>
              <small>{status === "done" ? "Completado" : status === "active" ? "En curso" : "Pendiente"}</small>
            </div>)}
          </div>
          <div className="trackingMeta"><div><span>Entrega estimada</span><strong>{estimatedDeliveryLabel()}</strong></div><div><span>Referencia</span><strong>{activeOrder.id.slice(0, 12)}</strong></div></div>
        </section>
      </div>
    </section>}

    <footer className="experienceFooter"><span>RecuerdArte</span><p>Una creación que nace de una conversación.</p><span>Proyecto de RDuende</span></footer>
  </main>;
}