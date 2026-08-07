import type { ExperienceSdkErrorPayload } from "./experience-sdk.types.js";

export class ExperienceSdkError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly payload?: ExperienceSdkErrorPayload,
  ) {
    super(message);
    this.name = "ExperienceSdkError";
  }
}

export class ExperienceSdkTimeoutError extends Error {
  constructor(readonly timeoutMs: number) {
    super(`La petición superó el tiempo máximo de ${timeoutMs} ms.`);
    this.name = "ExperienceSdkTimeoutError";
  }
}
