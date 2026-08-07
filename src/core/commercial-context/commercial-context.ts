export type ConversationState =
  | "WELCOME"
  | "DISCOVERY"
  | "QUALIFICATION"
  | "RECOMMENDATION"
  | "PROPOSAL"
  | "ORDER"
  | "COLLECT_REQUIREMENTS"
  | "SEARCH_PRODUCTS"
  | "COMPARE_OPTIONS"
  | "BUILD_PROPOSAL"
  | "CONFIRM"
  | "FINISHED";

export type CustomerType = "BUSINESS" | "CONSUMER";
export type GiftDiscoveryMode = "HAS_IDEA" | "WANTS_SUGGESTIONS";

export type CommercialContextField =
  | "need"
  | "businessGoal"
  | "audience"
  | "quantity"
  | "budget"
  | "currency"
  | "sector"
  | "campaign"
  | "sustainability"
  | "customizable"
  | "personalizationRequested"
  | "deadline"
  | "providerKey"
  | "profile"
  | "selectedProductId"
  | "customerType"
  | "giftDiscoveryMode"
  | "recipientRelationship"
  | "recipientAge"
  | "recipientInterests"
  | "recipientDislikes"
  | "recipientPersonality"
  | "occasion"
  | "intendedUse";

export interface CommercialContext {
  readonly need?: string;
  readonly businessGoal?: string;
  readonly audience?: string;
  readonly quantity?: number;
  readonly budget?: number;
  readonly currency?: string;
  readonly sector?: string;
  readonly campaign?: string;
  readonly sustainability?: boolean;
  /** @deprecated Product capability lives in catalog; use personalizationRequested for customer intent. */
  readonly customizable?: boolean;
  readonly personalizationRequested?: boolean;
  readonly deadline?: string;
  readonly providerKey?: string;
  readonly profile?: string;
  readonly selectedProductId?: string;
  readonly customerType?: CustomerType;
  readonly giftDiscoveryMode?: GiftDiscoveryMode;
  readonly recipientRelationship?: string;
  readonly recipientAge?: string;
  readonly recipientInterests?: string;
  readonly recipientDislikes?: string;
  readonly recipientPersonality?: string;
  readonly occasion?: string;
  readonly intendedUse?: string;
  readonly conversationState?: ConversationState;
  readonly pendingField?: CommercialContextField;
  readonly confidence?: Readonly<Partial<Record<CommercialContextField, number>>>;
}

export const DEFAULT_COMMERCIAL_CONTEXT = Object.freeze({
  currency: "EUR",
  providerKey: "makito",
}) satisfies CommercialContext;
