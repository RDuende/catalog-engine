# Rai Discovery — explicit proposals + conversational adapter

## What changes

- Normal messages call the orchestrator in `DISCOVER` mode.
- Discovery never generates proposals automatically.
- Every conversation response exposes an explicit UI action:

```json
{
  "actions": [
    { "type": "SHOW_PROPOSALS", "label": "Mostrar propuestas", "enabled": true }
  ]
}
```

- The frontend must call this endpoint when the user presses the button:

```http
POST /mvp/conversations/:sessionId/proposals
Content-Type: application/json
```

- Phrases such as `a ver`, `vale` or `enséñamelas` are no longer magic commands.
- Proposal generation remains in the deterministic RecuerdArte engine.

## OpenAI conversational phase

The service uses `OpenAIRaiDiscoveryConverser` automatically when `OPENAI_API_KEY`
is configured. Without it, `LocalRaiDiscoveryConverser` provides a deterministic
fallback so local tests remain offline.

Environment variables:

```env
OPENAI_API_KEY=...
RAI_DISCOVERY_MODEL=gpt-5.6
# Optional
OPENAI_BASE_URL=https://api.openai.com/v1
```

The OpenAI adapter receives:

- recent conversation history;
- the current structured Journey facts;
- missing required facts;
- the engine's suggested question;
- confirmation that the user may press `Mostrar propuestas`.

It returns only Rai's conversational reply. It cannot calculate prices or create
products; those responsibilities stay in the RecuerdArte engine.

## Frontend example

```ts
const action = response.actions.find((item) => item.type === "SHOW_PROPOSALS");
showProposalsButton.hidden = !action?.enabled;
showProposalsButton.textContent = action?.label ?? "Mostrar propuestas";

showProposalsButton.onclick = async () => {
  const response = await fetch(`/mvp/conversations/${sessionId}/proposals`, {
    method: "POST",
    headers: ownerHeaders,
    body: JSON.stringify({}),
  });
  renderProposals(await response.json());
};
```

## Tests added

- Complete discovery returns `READY_FOR_PROPOSALS`, not proposals.
- The explicit proposals action generates three solutions.
- Sending `a ver` does not generate or reopen proposals.
- Existing ownership and persistence tests now expect the discovery-ready state.
