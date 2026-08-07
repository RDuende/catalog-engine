import type {
  MemorySnapshot,
} from "../memory-brain/index.js";
import type {
  JourneyGiftProfilePatch,
} from "./journey-memory.types.js";

export function memorySnapshotToGiftProfilePatch(
  snapshot: MemorySnapshot,
): JourneyGiftProfilePatch {
  const profile = snapshot.profile;

  return Object.freeze({
    ...(profile.recipients.length > 0
      ? {
          recipients:
            profile.recipients,
        }
      : {}),
    ...(profile.recipientCount !==
    undefined
      ? {
          recipientCount:
            profile.recipientCount,
        }
      : {}),
    ...(profile.relationships.length > 0
      ? {
          relationships:
            profile.relationships,
        }
      : {}),
    ...(profile.ages.length > 0
      ? {
          ages: profile.ages,
        }
      : {}),
    ...(profile.interests.length > 0
      ? {
          interests:
            profile.interests,
        }
      : {}),
    ...(profile.budget !== undefined
      ? {
          budget: profile.budget,
        }
      : {}),
    ...(profile.occasions.length > 0
      ? {
          occasions:
            profile.occasions,
        }
      : {}),
    ...(profile
      .preferredMaterials.length > 0
      ? {
          preferredMaterials:
            profile.preferredMaterials,
        }
      : {}),
    ...(profile
      .preferredProducts.length > 0
      ? {
          preferredProducts:
            profile.preferredProducts,
        }
      : {}),
    ...(profile
      .rejectedProducts.length > 0
      ? {
          rejectedProducts:
            profile.rejectedProducts,
        }
      : {}),
    ...(profile.styles.length > 0
      ? {
          styles:
            profile.styles,
        }
      : {}),
  });
}

export function mergeGiftProfileWithMemory<
  T extends Readonly<Record<string, unknown>>,
>(
  profile: T,
  snapshot: MemorySnapshot,
): T & JourneyGiftProfilePatch {
  const patch =
    memorySnapshotToGiftProfilePatch(
      snapshot,
    );

  return Object.freeze({
    ...profile,
    ...patch,
  });
}
