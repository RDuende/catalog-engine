import type { ProposalBrainCandidate, ProposalBrainInput } from "./proposal-brain.types.js";

interface GiftBrainLike {
  readonly profile?: {
    readonly recipientLabel?: string;
    readonly occasion?: string;
    readonly budget?: number;
    readonly interests?: readonly string[];
  };
  readonly decision?: {
    readonly confidence?: number;
    readonly selected?: {
      readonly strategy?: {
        readonly kind?: string;
        readonly targetItemCount?: number;
      };
    };
    readonly composerContext?: Readonly<Record<string, unknown>>;
  };
}

export function proposalInputFromGiftBrain(
  gift: GiftBrainLike,
  candidates: readonly ProposalBrainCandidate[],
): ProposalBrainInput {
  const composer = gift.decision?.composerContext ?? {};
  const strategy =
    gift.decision?.selected?.strategy?.kind ??
    (typeof composer.giftStrategy === "string" ? composer.giftStrategy : undefined);
  const targetItemCount =
    gift.decision?.selected?.strategy?.targetItemCount ??
    (typeof composer.maxItems === "number" ? composer.maxItems : undefined);

  return Object.freeze({
    ...(gift.profile?.recipientLabel ? { recipientLabel: gift.profile.recipientLabel } : {}),
    ...(gift.profile?.occasion ? { occasion: gift.profile.occasion } : {}),
    ...(gift.profile?.budget !== undefined ? { budget: gift.profile.budget } : {}),
    interests: Object.freeze(gift.profile?.interests ?? []),
    ...(strategy ? { strategy } : {}),
    ...(targetItemCount !== undefined ? { targetItemCount } : {}),
    ...(gift.decision?.confidence !== undefined ? { confidence: gift.decision.confidence } : {}),
    candidates,
  });
}
