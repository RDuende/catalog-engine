export type ResponsesRequest = Record<string, unknown>;

export interface ResponsesClient {
  create(request: ResponsesRequest): Promise<any>;
}

export class OpenAIRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly type?: string,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "OpenAIRequestError";
  }
}

export class OpenAIResponsesClient implements ResponsesClient {
  constructor(private readonly apiKey: string) {}

  async create(request: ResponsesRequest): Promise<any> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    const body = await response.json() as any;
    if (!response.ok) {
      const message = body?.error?.message ?? `OpenAI respondió con HTTP ${response.status}`;
      throw new OpenAIRequestError(
        message,
        response.status,
        body?.error?.code,
        body?.error?.type,
        response.headers.get("x-request-id") ?? undefined,
      );
    }
    return body;
  }
}
