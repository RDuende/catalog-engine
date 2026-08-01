# Catalog Engine v0.46.1 — Knowledge Graph Builder

## Incluye

- Constructor incremental e idempotente desde `canonical_products`.
- Detección de marcas, categorías, materiales, técnicas, certificados y atributos.
- Diccionarios iniciales de alias en español e inglés.
- Trazabilidad por origen (`PROVIDER`, `INFERRED`, `AI`, `MANUAL`) y confianza.
- Limpieza de enlaces automáticos obsoletos sin tocar enlaces manuales o de IA.
- Historial de ejecuciones en `kg_build_runs`.
- Integración automática en el pipeline de sincronización del proveedor.
- Endpoint manual `POST /api/v1/knowledge/build`.
- CLI `npm run knowledge:build:v2 -- --provider=makito`.
- Métricas y progreso por producto.

## Instalación

```powershell
npm install
npx prisma migrate deploy
npm run typecheck
npm run test:knowledge-builder
```

## Primera construcción completa

```powershell
npm run knowledge:build:v2 -- --provider=makito
```

También puede lanzarse por API:

```http
POST /api/v1/knowledge/build
Content-Type: application/json

{"providerKey":"makito","batchSize":100}
```

Las siguientes sincronizaciones ejecutan el builder automáticamente. Puede desactivarse en una sincronización concreta enviando `"buildKnowledge": false`.
