import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeBrowserConversationCookie,
  encodeBrowserConversationCookie,
} from "./mvp-conversation.routes.js";

test("la cookie del chat conserva sessionId y credenciales", () => {
  const encoded = encodeBrowserConversationCookie({
    sessionId: "session-123",
    ownerKind: "GUEST",
    ownerId: "guest-456",
    accessToken: "secret-token",
  });

  assert.deepEqual(decodeBrowserConversationCookie(encoded), {
    sessionId: "session-123",
    ownerKind: "GUEST",
    ownerId: "guest-456",
    accessToken: "secret-token",
  });
});

test("rechaza cookies corruptas", () => {
  assert.equal(decodeBrowserConversationCookie("no-es-json"), undefined);
  assert.equal(
    decodeBrowserConversationCookie(Buffer.from(JSON.stringify({ sessionId: "only" })).toString("base64url")),
    undefined,
  );
});
