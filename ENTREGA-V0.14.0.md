# Catalog Engine v0.14.0 — Recommendation Engine

Esta release incorpora el primer motor de recomendación puro del núcleo de RecuerdArte.

## Uso básico

```ts
import { RecommendationEngine } from "./src/core/index.js";

const engine = new RecommendationEngine(snapshot);
const result = engine.recommend({
  query: "regalo para profesor fin de curso",
  categories: ["tazas"],
  attributes: {
    audience: ["profesor"],
    occasion: ["fin de curso"],
  },
  maxPriceMinor: 2000,
  personalization: true,
});
```

Los importes se expresan en unidades menores: `2000` equivale a `20,00 €`.

## Comprobación

```powershell
npm install
npm run typecheck
npm run test:core-foundation
npm run build
```
