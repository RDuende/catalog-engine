# Catalog Engine v0.42.0 — Canonical Catalog Foundation

## Incluye
- Modelo canónico independiente de proveedor.
- Persistencia PostgreSQL para productos, variantes, medios y revisiones.
- Hash SHA-256 estable para detectar cambios reales.
- Upsert idempotente: CREATED / UPDATED / UNCHANGED.
- Historial de revisiones por producto.
- API de importación, consulta y estadísticas.
- Normalizador estructural compatible con los productos de Provider Engine.

## Instalación
```powershell
npm install
npm run canonical:install
npm run typecheck
npm run test:canonical-catalog
npm run dev
```

## Endpoints
- GET `/api/v1/canonical/status`
- GET `/api/v1/canonical/stats`
- GET `/api/v1/canonical/products`
- POST `/api/v1/canonical/products/import`
- POST `/api/v1/providers/:provider/sync-canonical` — descarga desde un proveedor y persiste directamente en el catálogo canónico.

## Prueba sin Makito
```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/api/v1/canonical/products/import `
  -ContentType "application/json" `
  -Body '{"providerKey":"demo","products":[{"id":"DEMO-1","sku":"DEMO-1","name":"Botella de acero","material":"Acero inoxidable","categories":["Botellas"],"variants":[{"sku":"DEMO-1-NEGRO","color":"Negro"}],"images":["https://example.com/demo.jpg"]}]}'
```
