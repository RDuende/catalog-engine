# Catalog Engine v0.47.0 — Semantic Query Engine

Incluye interpretación básica de consultas, restricciones MUST/SHOULD/EXCLUDE, resolución por entidades y alias, ranking, filtros y explicaciones.

## Endpoint

`POST /api/v1/knowledge/query`

```json
{
  "query": "regalo de bambú apto para láser sin plástico",
  "providerKey": "makito",
  "customizable": true,
  "limit": 20,
  "constraints": [
    { "term": "bambú", "type": "MATERIAL", "mode": "MUST" },
    { "term": "grabado láser", "type": "TECHNIQUE", "mode": "MUST" },
    { "term": "plástico", "type": "MATERIAL", "mode": "EXCLUDE" }
  ]
}
```

## Validación

```powershell
npm install
npm run typecheck
npm run test:semantic-query
npm run test:knowledge-intelligence
```

No requiere migración.
