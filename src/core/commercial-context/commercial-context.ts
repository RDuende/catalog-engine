export type ConversationState =
  | "WELCOME"
  | "DISCOVERY"
  | "COLLECT_REQUIREMENTS"
  | "SEARCH_PRODUCTS"
  | "COMPARE_OPTIONS"
  | "BUILD_PROPOSAL"
  | "CONFIRM"
  | "FINISHED";

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
  | "deadline"
  | "providerKey"
  | "profile"
  | "selectedProductId";

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
  readonly customizable?: boolean;
  readonly deadline?: string;
  readonly providerKey?: string;
  readonly profile?: string;
  readonly selectedProductId?: string;
  readonly conversationState?: ConversationState;
  readonly pendingField?: CommercialContextField;
  readonly confidence?: Readonly<Partial<Record<CommercialContextField, number>>>;
}

export const DEFAULT_COMMERCIAL_CONTEXT = Object.freeze({
  currency: "EUR",
  providerKey: "makito",
}) satisfies CommercialContext;
