import type { MvpVoucherLifecycle } from "./mvp-conversation.types.js";

export class MvpVoucherLifecycleError extends Error {
  constructor(
    readonly code: "MVP_VOUCHER_NOT_ACTIVE" | "MVP_VOUCHER_EXPIRED" | "MVP_VOUCHER_ALREADY_CLAIMED" | "MVP_VOUCHER_REVOKED",
    message: string,
  ) {
    super(message);
    this.name = "MvpVoucherLifecycleError";
  }
}

export function createVoucherLifecycle(now?: string): MvpVoucherLifecycle {
  const issuedAt = now ?? new Date().toISOString();
  const days = positiveInteger(process.env.MVP_VOUCHER_EXPIRATION_DAYS, 365);
  const expiresAt = new Date(new Date(issuedAt).getTime() + days * 86_400_000).toISOString();
  return Object.freeze({ status: "ACTIVE", issuedAt, expiresAt });
}

export function currentVoucherLifecycle(voucher: MvpVoucherLifecycle, now?: string): MvpVoucherLifecycle {
  if (voucher.status !== "ACTIVE" || !voucher.expiresAt) return voucher;
  const at = new Date(now ?? new Date().toISOString()).getTime();
  if (at < new Date(voucher.expiresAt).getTime()) return voucher;
  return Object.freeze({ ...voucher, status: "EXPIRED" as const });
}

export function assertVoucherClaimable(voucher: MvpVoucherLifecycle, now?: string): MvpVoucherLifecycle {
  const current = currentVoucherLifecycle(voucher, now);
  if (current.status === "ACTIVE") return current;
  if (current.status === "EXPIRED") throw new MvpVoucherLifecycleError("MVP_VOUCHER_EXPIRED", "El bono ha caducado.");
  if (current.status === "CLAIMED") throw new MvpVoucherLifecycleError("MVP_VOUCHER_ALREADY_CLAIMED", "El bono ya fue reclamado.");
  if (current.status === "REVOKED") throw new MvpVoucherLifecycleError("MVP_VOUCHER_REVOKED", "El bono fue revocado.");
  throw new MvpVoucherLifecycleError("MVP_VOUCHER_NOT_ACTIVE", "El bono no está activo.");
}

export function claimVoucherLifecycle(voucher: MvpVoucherLifecycle, userId: string, now?: string): MvpVoucherLifecycle {
  const current = assertVoucherClaimable(voucher, now);
  const claimedAt = now ?? new Date().toISOString();
  return Object.freeze({ ...current, status: "CLAIMED", claimedAt, claimedByUserId: userId });
}

export function revokeVoucherLifecycle(voucher: MvpVoucherLifecycle, reason?: string, now?: string): MvpVoucherLifecycle {
  const current = currentVoucherLifecycle(voucher, now);
  if (current.status !== "ACTIVE") return assertVoucherClaimable(current, now);
  return Object.freeze({
    ...current,
    status: "REVOKED",
    revokedAt: now ?? new Date().toISOString(),
    ...(reason?.trim() ? { revokeReason: reason.trim() } : {}),
  });
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
