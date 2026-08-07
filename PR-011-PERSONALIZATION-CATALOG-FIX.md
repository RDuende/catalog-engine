# PR-011 — Personalization & Catalog Search Fix

- Separa la capacidad del producto (`customizable`) de la intención del cliente (`personalizationRequested`).
- Un producto personalizable puede venderse sin marcaje.
- `personalizationRequested=false` ya no filtra ni excluye productos personalizables.
- `personalizationRequested=true` sí exige que el producto admita personalización.
- `search_products` acepta filtros estructurados y limpia del texto proveedor, presupuesto y frases de marcaje.
- La respuesta incluye `catalogAccess` para comprobar candidatos evaluados, recuperados y con precio válido.
