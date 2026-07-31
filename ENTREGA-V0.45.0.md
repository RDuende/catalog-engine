# Catalog Engine v0.45.0 — Importación real de proveedores

Esta versión conecta el Job Engine con un pipeline de importación de extremo a extremo.

## Incluye

- Snapshot persistente por job en `storage/providers/<provider>/snapshots/<jobId>`.
- Escritura JSON atómica para evitar archivos parciales.
- Manifiesto de snapshot.
- Importación canónica por lotes y transacciones.
- Progreso durante la escritura en PostgreSQL.
- Informe permanente y `last-report.json`.
- Desactivación opcional de productos ausentes únicamente en sincronizaciones completas.
- Corrección de memoria: la tarifa completa de impresión ya no se duplica dentro de cada producto.

## Ejecutar una importación real de Makito

```http
POST /api/v1/providers/makito/sync
Content-Type: application/json

{
  "importCanonical": true,
  "saveSnapshot": true,
  "markMissingInactive": false,
  "batchSize": 100,
  "options": {
    "includeStock": true,
    "includePrices": true,
    "includePrintConfig": true,
    "includePrintPrices": true
  }
}
```

La respuesta devuelve `202` y un `jobId`. Consultar:

```http
GET /api/v1/jobs/<jobId>
GET /api/v1/providers/makito/last-report
GET /api/v1/providers/makito/snapshots
```

## Configuración

```env
PROVIDER_STORAGE_PATH=storage/providers
CANONICAL_IMPORT_BATCH_SIZE=100
```

No activar `markMissingInactive` en pruebas con `limit`. El pipeline lo ignora automáticamente si la sincronización no es completa.
