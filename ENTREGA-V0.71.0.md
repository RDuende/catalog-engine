# Catalog Engine v0.71.0 — Rai Agent Runtime

Primera base del runtime configurable de Rai.

## Incluye

- Registro desacoplado de Skills y Tools.
- Flujos configurables por objetivo.
- Skill de comprensión conversacional mediante AI Gateway.
- Tool de validación de requisitos.
- Tool de ejecución del Sales Brain.
- Traza por etapa con estado y duración.
- Parada controlada para solicitar información al usuario.
- Endpoints de estado y ejecución.

## API

- `GET /api/v1/rai-runtime/status`
- `POST /api/v1/rai-runtime/run`

## Validación

```powershell
npm run typecheck
npm run test:rai-runtime
npm run test:ai-gateway
npm run test:sales-brain
```
