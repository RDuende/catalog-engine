# V2.4 — Voucher Lifecycle

Añade ciclo de vida explícito a los bonos asociados a conversaciones MVP.

## Estados

- ACTIVE
- CLAIMED
- REVOKED
- EXPIRED

## Endpoints

- `GET /api/v1/mvp/conversations/:sessionId/voucher`
- `POST /api/v1/mvp/conversations/:sessionId/voucher/revoke`
- `POST /api/v1/mvp/conversations/:sessionId/claim` valida ahora el ciclo de vida.

## Configuración

- `MVP_VOUCHER_EXPIRATION_DAYS` (365 por defecto)

## Validación

```bash
npm install
npm run typecheck
npm run test:v2-4
```
