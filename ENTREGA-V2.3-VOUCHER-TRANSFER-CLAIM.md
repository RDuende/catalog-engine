# V2.3 — Voucher Transfer & Claim

Permite que una conversación propiedad de un bono sea reclamada una sola vez por un usuario receptor. Tras la reclamación, el acceso del bono queda revocado porque la propiedad pasa a `USER`.

## Endpoint

`POST /api/v1/mvp/conversations/:sessionId/claim`

Cabeceras: `x-mvp-owner-type: VOUCHER`, `x-mvp-owner-id`, `x-mvp-access-token`.

Cuerpo: `{ "userId": "..." }`.
