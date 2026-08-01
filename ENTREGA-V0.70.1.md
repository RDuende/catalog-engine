# Catalog Engine v0.70.1 — AI Gateway

Primera entrega de la arquitectura híbrida de Rai.

## Incluye

- Contrato `AIProvider` intercambiable.
- Proveedores OpenAI y Mock.
- Responses API con Structured Outputs mediante JSON Schema estricto.
- `store: false` para no conservar la respuesta en la API por defecto.
- Skill `conversation-understanding-v1`.
- Context patches auditables con confianza y evidencia.
- Trazas de proveedor, modelo, duración, tokens y request ID.
- Fallback determinista si OpenAI no está disponible, salvo `AI_STRICT_MODE=true`.
- Endpoints de estado y extracción conversacional.

## Endpoints

- `GET /api/v1/ai/status`
- `POST /api/v1/ai/conversation/extract`

## Validación

```powershell
npm run typecheck
npm run test:ai-gateway
npm run dev
```
