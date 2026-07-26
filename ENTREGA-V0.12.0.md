# Catalog Engine v0.12.0 — Canonical Product Layer

## Instalación

1. Descomprime esta versión sobre una copia del proyecto.
2. Conserva tu archivo `.env` actual.
3. Ejecuta:

```powershell
npm install
npm run typecheck
npm run test:core-foundation
```

## Probar un catálogo

```powershell
npm run catalog:compile -- .\reports\catalogo-makito-texto\pages.json
```

El JSON generado contiene ahora:

- `tree`
- `semantic`
- `canonical`
- `graph`
- `metrics`

## Commit recomendado

```powershell
git add .
git commit -m "feat: add canonical product layer v0.12.0"
git tag v0.12.0
```
