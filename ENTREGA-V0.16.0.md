# Catalog Engine v0.16.0

## Incluye

- API REST para analizar intención: `POST /api/v1/intent/analyze`.
- API REST integrada para analizar y recomendar: `POST /api/v1/intent/recommend`.
- Endpoint de versión: `GET /version`.
- `/health` devuelve también la versión.
- Playground web actualizado en `/studio`.
- Adaptador entre `IntentEngine` y el servicio de recomendaciones persistente.
- Prueba automática del adaptador.

## Verificación

```powershell
npm install
npm run build
npm run test:intent
npm run test:api
npm test
npm run dev
```

Después abre `http://127.0.0.1:3000/studio`.
