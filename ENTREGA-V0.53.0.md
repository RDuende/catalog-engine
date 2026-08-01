# Catalog Engine v0.53.0 — Production Intelligence Foundation

## Incluye
- Catálogo configurable de máquinas.
- Selección de máquina por técnica y materiales.
- Estimación de preparación, producción, coste y plazo.
- Alternativas ordenadas y explicaciones.
- Integración en cada línea de propuesta del Sales Brain.
- API de máquinas y planificación.

## Validación
```powershell
npm install
npm run typecheck
npm run test:production-intelligence
npm run test:proposal-pricing
npm run test:sales-brain
npm run dev
```

## API
- `GET /api/v1/production-intelligence/machines`
- `POST /api/v1/production-intelligence/plan`

La disponibilidad y carga real se conectarán posteriormente con RDuendeGest.
