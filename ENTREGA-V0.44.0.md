# Catalog Engine v0.44.0 — Core Job Engine + Pipeline

Esta entrega convierte las sincronizaciones de proveedores en trabajos asíncronos y añade el primer motor de pipelines reutilizable.

## Instalación

Descomprime el ZIP sobre el repositorio completo y ejecuta:

```powershell
npm install
npm run typecheck
npm run test:core-sync
npm run test:providers
npm run dev
```

## Nueva sincronización asíncrona

```http
POST /api/v1/providers/makito/sync
Content-Type: application/json

{
  "importCanonical": true,
  "options": {
    "includeStock": true,
    "includePrices": true,
    "includePrintConfig": true,
    "includePrintPrices": true
  }
}
```

Respuesta HTTP 202:

```json
{
  "jobId": "uuid",
  "status": "QUEUED",
  "statusUrl": "/api/v1/jobs/uuid"
}
```

## Consultar trabajos

```http
GET /api/v1/jobs/:id
GET /api/v1/jobs?provider=makito&status=RUNNING
POST /api/v1/jobs/:id/cancel
```

## Compatibilidad

La sincronización síncrona anterior sigue disponible temporalmente en:

```http
POST /api/v1/providers/:provider/sync-now
```

## Arquitectura añadida

- `JobManager`: cola en memoria, concurrencia configurable, progreso, resultado, error y cancelación.
- `PipelineEngine`: ejecución secuencial de etapas reutilizables.
- `CoreSyncEventBus`: eventos internos de jobs y etapas.
- `providerSyncPipeline`: inicialización, descarga/normalización, importación canónica e informe.
- rutas `/api/v1/jobs`.

## Variables de entorno

```env
SYNC_JOB_CONCURRENCY=1
SYNC_JOB_RETENTION=500
```

## Eventos emitidos

- `JobQueued`
- `JobStarted`
- `JobCompleted`
- `JobFailed`
- `JobCancelled`
- `PipelineStarted`
- `PipelineStageStarted`
- `PipelineStageCompleted`
- `PipelineCompleted`

## Nota de alcance

En v0.44.0 los trabajos viven en memoria. Se conservan mientras el servidor está activo. La persistencia PostgreSQL de jobs, snapshots y reanudación tras reinicio queda preparada para la siguiente entrega.
