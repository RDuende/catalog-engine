# Catalog Engine v0.41.2 — Makito API B2B Real Connector

## Configuración

Copia estas variables a `.env` y añade tus credenciales reales:

```env
MAKITO_API_BASE_URL=https://apis.makito.es
MAKITO_CLIENT_ID=
MAKITO_CLIENT_SECRET=
```

Las claves no se devuelven en las respuestas ni deben subirse a Git.

## Endpoints

- `GET /api/v1/providers/makito/status`
- `POST /api/v1/providers/makito/test`
- `POST /api/v1/providers/makito/preview`
- `POST /api/v1/providers/makito/sync`
- `POST /api/v1/providers/makito/snapshot`

Los endpoints Makito pueden recibir un body vacío y usar el `.env`.

### Probar conexión

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/api/v1/providers/makito/test `
  -ContentType 'application/json' `
  -Body '{"config":{}}'
```

### Vista previa de 5 productos

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/api/v1/providers/makito/preview `
  -ContentType 'application/json' `
  -Body '{"config":{},"limit":5}'
```

### Snapshot combinado

Descarga catálogo, stock y precios y los relaciona con productos/variantes:

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/api/v1/providers/makito/snapshot `
  -ContentType 'application/json' `
  -Body '{"config":{},"options":{"limit":10,"includeStock":true,"includePrices":true}}'
```

El marcaje es opcional porque sus archivos pueden ser grandes:

```json
{
  "config": {},
  "options": {
    "includeStock": true,
    "includePrices": true,
    "includePrintConfig": true,
    "includePrintPrices": false
  }
}
```

## Comprobación

```powershell
npm install
npm run typecheck
npm run test:providers
npm run dev
```
