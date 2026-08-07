# Entrega M4.2 — Progress Events

Añade suscripción al log de tareas y streaming SSE.

## Endpoint
`GET /api/v1/tasks/:taskId/stream`

Admite reconexión con la cabecera `Last-Event-ID` o `?after=<sequence>`.

## Comportamiento
- Reproduce eventos pendientes.
- Publica eventos nuevos en orden.
- Heartbeat cada 15 segundos.
- Cierra al completar, fallar o cancelar.

## Validación
```bash
npm install
npm run test:m4-2
```
