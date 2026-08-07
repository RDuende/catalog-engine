import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryMvpConversationRepository } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";

const principal = {
  kind: "USER",
  id: "test-user",
} as const;

function currentFact(
  facts: readonly {
    readonly key: string;
    readonly value: unknown;
    readonly updatedAt?: string;
  }[],
  key: string,
): unknown {
  return facts
    .filter((fact) => fact.key === key)
    .sort((left, right) =>
      String(right.updatedAt ?? "").localeCompare(
        String(left.updatedAt ?? ""),
      ),
    )[0]?.value;
}

function assertDoesNotAskFor(
  question: string | undefined,
  forbiddenText: string,
): void {
  assert.notEqual(question, forbiddenText);
}

test("mantiene el Journey y los hechos entre mensajes de la misma sesión", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  const first = await service.continue(
    "session-v20",
    {
      message: "Quiero un regalo para mis gemelas de 7 años",
      now: "2026-08-02T09:00:00.000Z",
    },
    principal,
  );

  assert.notEqual(first.result.status, "COMPLETED");

  const second = await service.continue(
    "session-v20",
    {
      message: "Es para su cumpleaños y tengo 60 euros",
      now: "2026-08-02T09:01:00.000Z",
    },
    principal,
  );

  assert.equal(second.result.status, "READY_FOR_PROPOSALS");
  assert.equal(second.session.messages.length, 4);
  assert.equal(second.session.journeyId, first.session.journeyId);
  assert.equal(
    currentFact(second.session.journey.facts, "recipient.age"),
    7,
  );
  assert.equal(
    currentFact(second.session.journey.facts, "occasion.type"),
    "birthday",
  );
  assert.equal(
    currentFact(second.session.journey.facts, "budget.max"),
    60,
  );
});

test("interpreta una respuesta numérica contextual como número de destinatarios", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  await service.continue(
    "session-count",
    {
      message: "Quiero un regalo",
      now: "2026-08-02T09:00:00.000Z",
    },
    principal,
  );

  await service.continue(
    "session-count",
    {
      message: "Para alguien en particular",
      now: "2026-08-02T09:00:30.000Z",
    },
    principal,
  );

  const result = await service.continue(
    "session-count",
    {
      message: "1",
      now: "2026-08-02T09:01:00.000Z",
    },
    principal,
  );

  assert.equal(
    currentFact(result.session.journey.facts, "recipient.count"),
    1,
  );

  assertDoesNotAskFor(
    result.result.nextQuestion,
    "¿Para cuántas personas será el regalo?",
  );
});

test("avanza después de responder que hay dos destinatarios", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  await service.continue(
    "session-two",
    {
      message: "Quiero un regalo",
      now: "2026-08-02T10:00:00.000Z",
    },
    principal,
  );

  await service.continue(
    "session-two",
    {
      message: "Para alguien en particular",
      now: "2026-08-02T10:00:30.000Z",
    },
    principal,
  );

  const result = await service.continue(
    "session-two",
    {
      message: "2",
      now: "2026-08-02T10:01:00.000Z",
    },
    principal,
  );

  assert.equal(
    currentFact(result.session.journey.facts, "recipient.count"),
    2,
  );

  assertDoesNotAskFor(
    result.result.nextQuestion,
    "¿Para cuántas personas será el regalo?",
  );

  assert.notEqual(result.result.status, "COMPLETED");
});

test("mis padres completa cantidad, relación y alcance en una sola respuesta", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  await service.continue(
    "session-parents",
    {
      message: "Quiero un regalo",
      now: "2026-08-02T11:00:00.000Z",
    },
    principal,
  );

  const result = await service.continue(
    "session-parents",
    {
      message: "para mis padres",
      now: "2026-08-02T11:01:00.000Z",
    },
    principal,
  );

  assert.equal(
    currentFact(result.session.journey.facts, "recipient.count"),
    2,
  );
  assert.equal(
    currentFact(
      result.session.journey.facts,
      "recipient.relationship",
    ),
    "parent",
  );
  assert.equal(
    currentFact(result.session.journey.facts, "gift.scope"),
    "personal",
  );

  assertDoesNotAskFor(
    result.result.nextQuestion,
    "¿Qué relación tienes con la persona que recibirá el regalo?",
  );
});

test("conserva cantidad y relación después de añadir la ocasión", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  await service.continue(
    "session-full-context",
    {
      message: "Quiero un regalo",
      now: "2026-08-02T12:00:00.000Z",
    },
    principal,
  );

  const second = await service.continue(
    "session-full-context",
    {
      message: "mis padres",
      now: "2026-08-02T12:01:00.000Z",
    },
    principal,
  );

  assert.equal(
    currentFact(second.session.journey.facts, "recipient.count"),
    2,
  );
  assert.equal(
    currentFact(
      second.session.journey.facts,
      "recipient.relationship",
    ),
    "parent",
  );

  const third = await service.continue(
    "session-full-context",
    {
      message: "aniversario",
      now: "2026-08-02T12:02:00.000Z",
    },
    principal,
  );

  assert.equal(
    currentFact(third.session.journey.facts, "recipient.count"),
    2,
  );
  assert.equal(
    currentFact(
      third.session.journey.facts,
      "recipient.relationship",
    ),
    "parent",
  );
  assert.equal(
    currentFact(third.session.journey.facts, "occasion.type"),
    "anniversary",
  );

  assertDoesNotAskFor(
    third.result.nextQuestion,
    "¿Para cuántas personas será el regalo?",
  );
  assertDoesNotAskFor(
    third.result.nextQuestion,
    "¿Qué relación tienes con la persona que recibirá el regalo?",
  );
});

test("ofrece la acción de propuestas sin generarlas automáticamente", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  const result = await service.continue(
    "session-discovery-button",
    {
      message: "un regalo para la boda de mi hermano",
      now: "2026-08-02T13:00:00.000Z",
    },
    principal,
  );

  assert.equal(result.result.status, "READY_FOR_PROPOSALS");
  assert.equal(result.result.solutionSet, undefined);
  assert.equal(result.actions.length, 1);
  assert.equal(result.actions[0]?.type, "SHOW_PROPOSALS");
  assert.equal(result.actions[0]?.enabled, true);
  assert.match(result.actions[0]?.label ?? "", /propuestas/i);
  assert.match(
    result.session.messages.at(-1)?.text ?? "",
    /propuestas/i,
  );
});

test("la acción explícita genera las tres soluciones", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  await service.continue(
    "session-explicit-proposals",
    {
      message: "un regalo para la boda de mi hermano",
      now: "2026-08-02T14:00:00.000Z",
    },
    principal,
  );

  const result = await service.showProposals(
    "session-explicit-proposals",
    {
      now: "2026-08-02T14:01:00.000Z",
    },
    principal,
  );

  assert.equal(result.result.status, "COMPLETED");
  assert.equal(result.result.solutionSet?.solutions.length, 3);
  assert.equal(result.proposalSet.proposals.length, 3);
  assert.equal(result.proposalSet.proposals[0]?.actions.some((action) => action.type === "SAVE_FAVORITE"), true);
  assert.equal(result.session.journey.status, "PROPOSING");
  assert.deepEqual(result.actions, []);
});

test("un mensaje neutro no genera propuestas automáticamente ni pierde el contexto", async () => {
  const service = new MvpConversationService(
    new InMemoryMvpConversationRepository(),
  );

  await service.continue(
    "session-no-magic-phrase",
    {
      message: "un regalo para la boda de mi hermano",
      now: "2026-08-02T15:00:00.000Z",
    },
    principal,
  );

  const result = await service.continue(
    "session-no-magic-phrase",
    {
      message: "a ver",
      now: "2026-08-02T15:01:00.000Z",
    },
    principal,
  );

  assert.notEqual(result.result.status, "COMPLETED");
  assert.equal(result.result.solutionSet, undefined);
  assert.equal(result.actions[0]?.type, "SHOW_PROPOSALS");

  assert.equal(
    currentFact(result.session.journey.facts, "gift.scope"),
    "personal",
  );
  assert.equal(
    currentFact(result.session.journey.facts, "occasion.type"),
    "wedding",
  );
  assert.equal(
    currentFact(
      result.session.journey.facts,
      "recipient.relationship",
    ),
    "sibling",
  );
});
