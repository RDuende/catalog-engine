# RecuerdArte Catalog Engine

**Versión 0.30.0 — Intelligent Catalog Foundation**

Motor de catálogo, conocimiento y recomendaciones para RecuerdArte.

## Novedades principales

La v0.30.0 incorpora una capa PIM importable y comprensible por Rai:

- importación CSV, TSV, Excel y JSON;
- normalización a producto canónico;
- variantes e imágenes;
- destinatarios, intereses, ocasiones, emociones, estilos, valores y casos de uso;
- trazabilidad de trabajos y errores;
- búsqueda de candidatos para construir conjuntos de regalo.

## Instalación en Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar.ps1
npm run dev
```

## Endpoints nuevos

```text
GET  /api/v1/imports/adapters
POST /api/v1/imports/analyze
POST /api/v1/imports/sources
POST /api/v1/imports/run
GET  /api/v1/imports/jobs
GET  /api/v1/imports/jobs/:jobId
POST /api/v1/catalog/candidates
```

Consulta `docs/V0.30.0-INTELLIGENT-CATALOG.md` y el ejemplo `examples/import/productos-campo.csv`.
