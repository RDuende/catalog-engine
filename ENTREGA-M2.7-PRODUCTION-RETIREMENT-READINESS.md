# Entrega M2.7 — Production Retirement Readiness

## Objetivo
Determinar de forma verificable cuándo pueden eliminarse definitivamente los puntos de entrada legacy de Rai Runtime.

## Incluye
- Política de readiness con ventana de observación y volumen mínimo.
- Bloqueadores tipados y siguiente acción recomendada.
- Integración en `RuntimeEntryPointMetrics` y `runtime.status()`.
- Endpoint `GET /rai-runtime/retirement-readiness`.
- Variables de entorno para ajustar los umbrales.
- Tests y ADR-017.

## Configuración
```env
RAI_RUNTIME_LEGACY_ENTRYPOINTS=disabled
RAI_RUNTIME_RETIREMENT_OBSERVATION_HOURS=168
RAI_RUNTIME_RETIREMENT_MIN_CANONICAL_CALLS=1000
```

## Validación
```bash
npm install
npm run test:m2-7
```

## Nota operativa
El contador incluido en esta fase vive en memoria. Antes de usar el resultado para retirar código en una producción con reinicios o varias réplicas, las métricas deben exportarse a un almacén compartido u observabilidad persistente.
