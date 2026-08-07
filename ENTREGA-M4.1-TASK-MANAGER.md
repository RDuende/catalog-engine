# Entrega M4.1 — Task Manager

## Incluido

- Estados CREATED, QUEUED, RUNNING, WAITING, COMPLETED, FAILED y CANCELLED.
- Ejecución no bloqueante local mediante `queueMicrotask`.
- Progreso estructurado por porcentaje, paso y mensaje.
- Cancelación con `AbortSignal`.
- Reintentos limitados por `maxAttempts`.
- Registro ordenado de eventos por tarea.
- API para consultar, cancelar y reintentar.
- Tests unitarios y ADR-023.

## Endpoints

- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:taskId`
- `GET /api/v1/tasks/:taskId/events?after=0`
- `POST /api/v1/tasks/:taskId/cancel`
- `POST /api/v1/tasks/:taskId/retry`

## Limitación consciente

El almacenamiento es local y en memoria. M4.1 define los contratos y el comportamiento; la persistencia distribuida llegará cuando haya una necesidad operativa real.

## Validación

```bash
npm install
npm run test:m4-1
```
