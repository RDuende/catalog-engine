export type DomainError = Readonly<{ code: string; message: string; details?: unknown }>;

export type Result<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: DomainError }>;

export const success = <T>(value: T): Result<T> => ({ ok: true, value });
export const failure = (code: string, message: string, details?: unknown): Result<never> => ({
  ok: false,
  error: { code, message, details }
});
