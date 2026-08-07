# ADR-013 — Handlers nativos sobre RaiContext

- Estado: Aceptada
- Milestone: M2.3 Handler Convergence
- Fecha: 2026-08-02

## Contexto

M2.1 publicó los contratos canónicos y M2.2 hizo que `RaiContext` viajara entre pasos, pero los handlers principales continuaban leyendo y escribiendo `RuntimeState.context` y `RuntimeRequest.message` como fuentes primarias.

## Decisión

`ConversationUnderstandingSkill`, `RequirementGateTool`, `SalesBrainTool` y `RuntimeResponseSkill` declaran `contextMode = "RAI_CONTEXT"` y consumen como fuente de verdad:

- `state.raiContext.conversation.message`
- `state.raiContext.conversation.facts`
- `state.raiContext.session`

La proyección `state.context` continúa temporalmente para compatibilidad y se sincroniza mediante helpers únicos.

## Consecuencias

- Los handlers dejan de depender conceptualmente del request HTTP/legacy.
- Las actualizaciones de contexto no pueden divergir entre la vista canónica y la legacy.
- Los handlers custom antiguos siguen funcionando porque `contextMode` es opcional.
- M2.4 podrá advertir o bloquear handlers legacy en flujos canónicos.
