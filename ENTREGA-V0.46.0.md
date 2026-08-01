# Catalog Engine v0.46.0 — Knowledge Graph Foundation

## Incluye
- Grafo independiente del proveedor con entidades: marca, categoría, material, técnica, certificado y atributo.
- Alias por proveedor para unificar vocabularios futuros.
- Relaciones entre entidades y enlaces con `canonical_products`.
- Migración PostgreSQL idempotente.
- API: estadísticas, alta/listado/detalle de entidades, relaciones y grafo de producto.
- Tests unitarios del servicio.

## Instalación
```powershell
npm install
npx prisma migrate deploy
npm run typecheck
npm run test:knowledge-foundation
```

## Endpoints
- `GET /api/v1/knowledge/stats`
- `GET|POST /api/v1/knowledge/entities`
- `GET /api/v1/knowledge/entities/:id`
- `POST /api/v1/knowledge/relations`
- `GET /api/v1/knowledge/products/:id`

La construcción automática desde el catálogo canónico queda para v0.46.1.
