# Catalog Engine v0.15.0

## Novedades

La versión 0.15.0 incorpora el primer Intent Engine determinista del proyecto. Convierte consultas en español en una intención estructurada y en criterios listos para el Recommendation Engine.

## Comprobación

```powershell
npm install
npm test
npm run typecheck
npm run build
npm run test:intent
npm run dev
```

## Ejemplo

```ts
const engine = new IntentEngine();
const analysis = engine.analyze(
  "Busco un regalo de madera para una profesora por menos de 20 €, personalizado"
);
```
