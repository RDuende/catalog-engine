# Catalog Engine v0.35.0 — Semantic Taxonomy Engine

## Incluye

- Taxonomía jerárquica con herencia transitiva.
- Sinónimos y resolución normalizada de conceptos.
- Relaciones `inherits`, `related`, `supports` y `opposes`.
- Pesos configurables y trazabilidad mediante rutas de expansión.
- Validación de conceptos duplicados, destinos inexistentes y pesos inválidos.
- Carga externa desde JSON.
- Taxonomía inicial editable en `config/taxonomy/default-taxonomy.json`.
- Integración opcional con Product DNA y Semantic Recommendation Engine.
- Compatibilidad completa con el comportamiento de v0.34.0 cuando no se proporciona taxonomía.

## Comandos

```powershell
npm install
npm run typecheck
npm run test:semantic-taxonomy
npm run test:recommendation-engine
```

## Resultado de validación

- TypeScript: sin errores.
- Build: correcto.
- Semantic Taxonomy Engine: 4/4 tests.
- Semantic Recommendation Engine: 5/5 tests.
