# Aplicar V3.2 — Experience API

1. Copia el contenido de este parche sobre la raíz de V3.1.
2. Conserva tus archivos `.env` y datos de `.data`.
3. Ejecuta:

```bash
npm install
npm run typecheck
npm run test:v3-2
```

## Endpoint

```http
GET /api/v1/experience/:journeyId
```

Usa las mismas cabeceras de propiedad de la Conversation API:

```http
x-mvp-owner-type: USER | GUEST | VOUCHER
x-mvp-owner-id: identificador
x-mvp-access-token: token cuando corresponda
```
