# ADR-024 — Progress Events mediante SSE

## Estado
Aceptada.

## Decisión
Las tareas publican eventos ordenados y la API los transmite mediante Server-Sent Events en `GET /api/v1/tasks/:taskId/stream`.

## Motivos
- El flujo principal es servidor → cliente.
- SSE incluye reconexión y `Last-Event-ID` de forma nativa.
- Es más sencillo que WebSocket para progreso de tareas.
- Mantiene separado el Task Manager del transporte HTTP.

## Consecuencias
- Los eventos tienen secuencia monotónica.
- La reconexión reproduce eventos posteriores a `Last-Event-ID`.
- Se envía heartbeat cada 15 segundos.
- El stream se cierra en `COMPLETED`, `FAILED` o `CANCELLED`.
- Una implementación distribuida futura deberá centralizar el log y la publicación.
