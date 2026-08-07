import type {
  IncomingMessage,
  ServerResponse,
} from "node:http";

import {
  defaultJourneyMemory,
  JourneyMemoryService,
} from "./journey-memory.service.js";

interface JsonRequest
  extends IncomingMessage {
  readonly body?: unknown;
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.statusCode = status;
  response.setHeader(
    "content-type",
    "application/json; charset=utf-8",
  );
  response.end(
    JSON.stringify(body),
  );
}

function bodyObject(
  request: JsonRequest,
): Record<string, unknown> {
  return (
    request.body &&
    typeof request.body === "object" &&
    !Array.isArray(request.body)
      ? request.body as
          Record<string, unknown>
      : {}
  );
}

function stringValue(
  body: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = body[key];
  return typeof value === "string" &&
    value.trim()
    ? value.trim()
    : undefined;
}

export class JourneyMemoryController {
  constructor(
    private readonly service:
      JourneyMemoryService =
      defaultJourneyMemory,
  ) {}

  async ingest(
    request: JsonRequest,
    response: ServerResponse,
  ): Promise<void> {
    const body = bodyObject(request);
    const journeyId =
      stringValue(body, "journeyId");
    const ownerId =
      stringValue(body, "ownerId");
    const messageId =
      stringValue(body, "messageId");
    const text =
      stringValue(body, "text");

    if (
      !journeyId ||
      !ownerId ||
      !messageId ||
      !text
    ) {
      sendJson(response, 400, {
        error:
          "journeyId, ownerId, messageId y text son obligatorios.",
      });
      return;
    }

    const state =
      await this.service.ingestMessage({
        journeyId,
        ownerId,
        messageId,
        text,
      });

    sendJson(response, 200, state);
  }

  async get(
    request: JsonRequest,
    response: ServerResponse,
  ): Promise<void> {
    const body = bodyObject(request);
    const journeyId =
      stringValue(body, "journeyId");
    const ownerId =
      stringValue(body, "ownerId");

    if (!journeyId || !ownerId) {
      sendJson(response, 400, {
        error:
          "journeyId y ownerId son obligatorios.",
      });
      return;
    }

    const state =
      await this.service.getState(
        journeyId,
        ownerId,
      );

    sendJson(response, 200, state);
  }

  async decide(
    request: JsonRequest,
    response: ServerResponse,
  ): Promise<void> {
    const body = bodyObject(request);
    const journeyId =
      stringValue(body, "journeyId");
    const ownerId =
      stringValue(body, "ownerId");
    const targetId =
      stringValue(body, "targetId");
    const type =
      stringValue(body, "type");

    if (
      !journeyId ||
      !ownerId ||
      !targetId ||
      !type
    ) {
      sendJson(response, 400, {
        error:
          "journeyId, ownerId, targetId y type son obligatorios.",
      });
      return;
    }

    if (
      ![
        "ACCEPTED",
        "REJECTED",
        "SELECTED",
        "DISMISSED",
      ].includes(type)
    ) {
      sendJson(response, 400, {
        error:
          "type no es válido.",
      });
      return;
    }

    const state =
      await this.service.recordDecision({
        journeyId,
        ownerId,
        decision: {
          type:
            type as
              | "ACCEPTED"
              | "REJECTED"
              | "SELECTED"
              | "DISMISSED",
          targetId,
          ...(stringValue(body, "note")
            ? {
                note:
                  stringValue(
                    body,
                    "note",
                  ),
              }
            : {}),
        },
      });

    sendJson(response, 200, state);
  }
}
