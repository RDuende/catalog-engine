# PR-008 — Conversational Agent

## Objetivo

Sustituir las respuestas guionizadas del Runtime y la Fast Conversation Layer en la interfaz principal por un agente conversacional GPT con tool calling.

## Arquitectura

- GPT mantiene toda la conversación visible.
- Catalog Engine expone herramientas deterministas.
- El contexto comercial se valida mediante `CommercialContext` y `ContextPatch`.
- El motor de recomendación sigue tomando las decisiones de catálogo.

## Herramientas iniciales

- `get_commercial_state`
- `update_commercial_context`
- `search_products`

## Compatibilidad

Las rutas anteriores de Runtime y Sales Brain continúan disponibles. El Workspace pasa a usar `/api/v1/rai-agent/chat`.
