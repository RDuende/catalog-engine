# V2.8 — Presentation Engine

Genera presentaciones visuales persistentes a partir de artefactos `IMAGE`.

## Incluye

- Catálogo declarativo de plantillas.
- Mockups iniciales para camiseta, taza, lienzo y puzle.
- Composición SVG sin dependencias nativas.
- Persistencia como artefacto `MOCKUP` versionado.
- Trazabilidad con la imagen fuente y la plantilla usada.
- API de plantillas, creación y listado por Journey.

## Endpoints

- `GET /api/v1/presentations/templates`
- `POST /api/v1/presentations`
- `GET /api/v1/journeys/:journeyId/presentations`

## Validación

```bash
npm run typecheck
npm run test:presentation-engine
npm run test:v2-8
```
