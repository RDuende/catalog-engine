# Catalog Engine v0.43.0 — Makito Rate-Limit Safe Sync

## Incluye

- Token bucket genérico por proveedor.
- Configuración Makito: 100 peticiones de capacidad y 25 peticiones/minuto.
- Factor de seguridad configurable (0,9 por defecto).
- Cola serializada para evitar carreras entre peticiones concurrentes.
- Reintentos automáticos para HTTP 429 y 503.
- Soporte de cabecera `Retry-After`.
- Backoff exponencial con jitter cuando no existe `Retry-After`.
- Renovación JWT conservada para HTTP 401.
- Diagnóstico del limitador en `GET /providers/makito/status`.

## Variables opcionales

```env
MAKITO_RATE_LIMIT_CAPACITY=100
MAKITO_RATE_LIMIT_REFILL_PER_MINUTE=25
MAKITO_RATE_LIMIT_SAFETY_FACTOR=0.9
MAKITO_MAX_RETRIES=5
```

## Validación

```powershell
npm install
npm run typecheck
npm run test:rate-limiter
npm run test:providers
```
