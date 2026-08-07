# V1.9 — MVP Orchestrator

Unifica Discovery, Journey, Completeness, Creative Brief, Story, Image Brief y Solution Engine en un solo servicio.

## API

`POST /api/v1/mvp/journeys`

Si faltan requisitos responde `NEEDS_INPUT` con la siguiente pregunta. Si el Journey está completo devuelve `COMPLETED` con las tres soluciones y todos los artefactos intermedios.

## Validación

```bash
npm run typecheck
npm run test:v1-9
npm run demo:v1-9
```
