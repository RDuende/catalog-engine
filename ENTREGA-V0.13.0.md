# Catalog Engine v0.13.0

## Objetivo

Convertir productos canónicos en productos enriquecidos para RecuerdArte.

## Flujo

Semantic → Canonical → Knowledge Loader → Product DNA → Knowledge Graph

## Instalación

Descomprimir sobre `C:\catalog-engine`, conservar `.env` y ejecutar:

```powershell
npm install
npm run typecheck
npm run test:core-foundation
```

## Prueba

```powershell
npm run catalog:compile -- .\reports\catalogo-makito-texto\pages.json
```

La salida compilada contiene ahora `enriched`, con `ontology` y `dna` por producto.
