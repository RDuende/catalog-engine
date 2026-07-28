# Catalog Engine v0.31.0 — Knowledge Index

## Incluido

- Nuevo módulo `src/modules/catalog-knowledge/`.
- Índice O(1) por referencia.
- Fusión de referencias repetidas entre páginas.
- Índices por categoría, material y términos.
- Familias inferidas desde encabezados y categorías.
- API pública `CatalogKnowledge` con:
  - `findReference()`
  - `findCategory()`
  - `findMaterial()`
  - `findFamily()`
  - `search()`
- Script `npm run test:knowledge-index`.
- Hotfixes anteriores de `rai-agent` y `page-detector` incluidos.

## Verificación realizada

- `npm run typecheck`: correcto.
- Tests compilados del analizador: 5/5.
- Tests compilados del Knowledge Index: 4/4.

## Comandos en Windows

```powershell
npm run typecheck
npm run test:analyzer
npm run test:knowledge-index
```
