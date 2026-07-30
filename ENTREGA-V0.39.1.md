# Catalog Engine v0.39.1 — Catalog Studio Foundation

## Incluye

- Recuperación de los módulos Intent API, Rai API y Rai Playground que faltaban en la entrega 0.39.0.
- Restauración de las utilidades internas de Rai Agent (`product-tools`, `openai-responses` y `state-extractor`).
- Variables OpenAI restauradas en `src/config/env.ts`.
- Catalog Studio integrado en el ciclo normal de `buildApp()`.
- Dashboard conectado a las estadísticas y documentos reales del Import Workbench.
- Navegación hacia Import Center, documentos, Recommendation Lab, Workbench, Knowledge y Rai.
- Vista completa de documentos importados.
- Recommendation Lab conservado dentro de Catalog Studio.
- Versión actualizada a 0.39.1.

## Arranque

```powershell
npm install
npm run typecheck
npm run dev
```

Abrir:

- Catalog Studio: http://localhost:3000/studio
- Import Center: http://localhost:3000/imports
- Rai Playground: http://localhost:3000/rai/playground
