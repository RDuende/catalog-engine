# Catalog Engine v0.41.0 — Provider Engine Foundation

Esta versión cambia la vía principal de adquisición de catálogo de PDF a API.

## Incluye
- Contrato `ProviderAdapter` extensible.
- Registro de proveedores.
- Cliente HTTP con Bearer, API key y Basic Auth.
- Paginación, timeout, cabeceras y sincronización incremental.
- Adaptador REST genérico configurable.
- Primer adaptador Makito.
- Normalización de producto, categorías, variantes e imágenes.
- API REST para listar, probar, previsualizar y sincronizar proveedores.
- Pruebas unitarias del normalizador.

## Rutas
- `GET /api/v1/providers`
- `POST /api/v1/providers/:provider/test`
- `POST /api/v1/providers/:provider/preview`
- `POST /api/v1/providers/:provider/sync`

La configuración real de campos y endpoints de Makito se completa cuando se disponga de su documentación o una respuesta JSON de ejemplo.
