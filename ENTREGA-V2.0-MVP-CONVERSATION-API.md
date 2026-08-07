# V2.0 — MVP Conversation API

Añade sesiones conversacionales sobre el MVP Orchestrator.

## Endpoints

- `POST /api/v1/mvp/conversations`
- `POST /api/v1/mvp/conversations/:sessionId/messages`
- `GET /api/v1/mvp/conversations/:sessionId`

La sesión conserva Journey, mensajes y artefactos entre turnos. La persistencia es local en memoria y podrá sustituirse por PostgreSQL/Redis sin cambiar el servicio.

## Validación

```bash
npm run typecheck
npm run test:v2-0
```
