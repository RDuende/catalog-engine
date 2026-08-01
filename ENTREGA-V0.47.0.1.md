# Catalog Engine v0.47.0.1 — Semantic Query JSONB Hotfix

Corrige el error PostgreSQL:

```text
no existe la función jsonb_array_elements(json)
```

La agregación de entidades del CTE `grouped` ahora usa `jsonb_agg(...)` en lugar de `json_agg(...)`, por lo que `g.entities` es `jsonb` y puede procesarse correctamente con `jsonb_array_elements(...)`.

## Validación

```powershell
npm run typecheck
npm run test:semantic-query
npm run test:knowledge-intelligence
```

Después reinicia `npm run dev` y repite la consulta.

No requiere migración de base de datos.
