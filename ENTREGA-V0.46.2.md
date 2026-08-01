# Catalog Engine v0.46.2 — Knowledge Graph Intelligence

## Incluye

- Diccionario editable en `knowledge/*.json` para materiales, técnicas, certificados y categorías.
- Sincronización idempotente de entidades, alias y relaciones semánticas.
- Relaciones `COMPATIBLE_WITH` e `IS_A` generadas desde el diccionario.
- Builder incremental real: un enlace sin cambios devuelve `UNCHANGED` y no escribe en PostgreSQL.
- Contador `linksUnchanged`; una segunda construcción debe dejar `linksUpdated: 0`.
- Búsqueda semántica inicial sobre entidades, alias y productos.
- Exploración de subgrafos compatible con Cytoscape/React Flow (`nodes` y `edges`).
- Consulta de compatibilidad material/técnica.
- Índices PostgreSQL para búsqueda y recorrido del grafo.

## Instalación

```powershell
cd C:\catalog-engine
npm install
npx prisma migrate deploy
npm run typecheck
npm run test:knowledge-intelligence
npm run knowledge:dictionary:sync
npm run knowledge:build:v2 -- --provider=makito
```

## Endpoints

- `POST /api/v1/knowledge/dictionary/sync`
- `GET /api/v1/knowledge/search?q=bambu+laser`
- `GET /api/v1/knowledge/compatible?material=bambu`
- `GET /api/v1/knowledge/explore/:entityId?depth=2`

## Validación incremental esperada

Tras una segunda ejecución sin cambios:

```json
{
  "entitiesCreated": 0,
  "linksCreated": 0,
  "linksUpdated": 0,
  "linksUnchanged": 34503,
  "staleLinksRemoved": 0,
  "failed": 0
}
```
