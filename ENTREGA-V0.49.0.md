# Catalog Engine v0.49.0 — Commercial Memory

Incluye persistencia de cada recomendación y feedback comercial.

## Instalación

```powershell
npm install
npm run commercial-memory:install
npm run typecheck
npm run test:commercial-memory
npm run test:recommendation-engine
npm run dev
```

## API

- `POST /api/v1/recommendations` ahora devuelve `runId`.
- `POST /api/v1/commercial-memory/feedback`
- `GET /api/v1/commercial-memory/stats`
- `GET /api/v1/commercial-memory/history?limit=20`

## Feedback

```json
{
  "runId": "uuid",
  "productId": "uuid",
  "eventType": "ACCEPTED",
  "notes": "El cliente lo eligió",
  "actor": "rafa"
}
```
