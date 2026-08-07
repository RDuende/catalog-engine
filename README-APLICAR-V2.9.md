# Aplicar V2.9 — Smart Catalog

1. Copia el contenido del parche sobre la raíz de V2.8.
2. Conserva tus variables de entorno.
3. Ejecuta:

```bash
npm install
npm run typecheck
npm run test:v2-9
```

Endpoints:
- `GET /api/v1/smart-catalog/products`
- `POST /api/v1/smart-catalog/recommendations`
