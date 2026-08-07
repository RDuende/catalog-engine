# V2.7 PR-3 — Artifact Service & API

Une Artifact Domain y Artifact Storage mediante un servicio de aplicación y endpoints REST.

## Endpoints
- `POST /api/v1/artifacts`
- `GET /api/v1/journeys/:journeyId/artifacts`
- `GET /api/v1/artifacts/:artifactId`
- `GET /api/v1/artifacts/:artifactId/content`
- `DELETE /api/v1/artifacts/:artifactId`

## Configuración
`ARTIFACT_STORAGE_DIR=.data/artifacts`
