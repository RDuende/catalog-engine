# Catalog Engine v0.50.0 — Rai Commercial AI

## Incluye
- Conversación comercial determinista con sesiones.
- Extracción local de presupuesto, cantidad, sector, campaña, sostenibilidad y personalización.
- Selección automática de perfiles de recomendación.
- Integración directa con Recommendation Engine, Knowledge Graph y Commercial Memory.
- Preguntas breves cuando faltan datos relevantes.
- Reintento sin presupuesto cuando no existen precios utilizables.
- Selección de producto dentro de la sesión.

## API
- `POST /api/v1/rai-commercial/chat`
- `POST /api/v1/rai-commercial/select`
- `GET /api/v1/rai-commercial/sessions/:sessionId`
- `DELETE /api/v1/rai-commercial/sessions/:sessionId`

## Validación
```powershell
npm install
npm run typecheck
npm run test:rai-commercial
npm run test:recommendation-engine
npm run test:commercial-memory
npm run dev
```
