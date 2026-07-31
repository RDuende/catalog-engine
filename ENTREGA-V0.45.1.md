# Catalog Engine v0.45.1 — Production Hardening

## Incluye

- Persistencia de trabajos en `storage/jobs`.
- Consulta de trabajos históricos tras reiniciar el servidor.
- Log estructurado JSONL de cambios de estado y progreso.
- Métricas por etapa del pipeline y productos por segundo.
- Informes de error aunque el pipeline falle antes de la etapa final.
- Manifiestos de snapshot marcados como `FAILED` en errores y cancelaciones.
- Historial de informes por proveedor.
- Limpieza automática y manual de snapshots antiguos.

## Nuevas rutas

- `GET /api/v1/jobs/history?limit=100`
- `GET /api/v1/providers/:provider/reports?limit=20`
- `POST /api/v1/providers/:provider/snapshots/cleanup`

Ejemplo de limpieza manual:

```json
{
  "keep": 10,
  "maxAgeDays": 30
}
```

## Variables nuevas

```env
SYNC_JOB_STORAGE_PATH=storage/jobs
PROVIDER_SNAPSHOT_RETENTION=10
PROVIDER_SNAPSHOT_MAX_AGE_DAYS=30
```

La limpieza automática se ejecuta al finalizar correctamente una sincronización.
