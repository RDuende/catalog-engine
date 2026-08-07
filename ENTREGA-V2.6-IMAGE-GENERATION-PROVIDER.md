# V2.6 — Image Generation Provider

- Proveedores `mock` y `openai`.
- Endpoint asíncrono `POST /api/v1/images/generations`.
- Ejecución mediante Task Manager.
- Progreso SSE, cancelación y reintento reutilizando `/api/v1/tasks/*`.
- OpenAI Images API mediante `POST /images/generations`.
- La respuesta inicial es `202 Accepted` y no bloquea el Runtime.

## Configuración

```env
IMAGE_PROVIDER=mock
# o
IMAGE_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_API_BASE_URL=https://api.openai.com/v1
```

## Validación

```bash
npm run test:v2-6
```
