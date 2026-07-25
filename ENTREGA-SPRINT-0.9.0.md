# Catalog Engine 0.9.0 — Pattern Engine + AST Builder

## Incluye

- Pattern Engine con reglas puntuables.
- Extractores de referencia, nombre, descripción, dimensiones, materiales, colores, técnicas y precios.
- AST Builder versionado (`1.0`).
- Conversión de nodos PRODUCT a `NormalizedProduct` del Import Engine.
- `CatalogInterpreterService` para ejecutar Block Detector → Pattern Engine → AST Builder → normalización.
- CLI `catalog:interpret`.
- Pruebas unitarias y de integración.
- Block Detector corregido para TypeScript estricto.

## Instalación

Copiar el contenido del ZIP sobre `C:\catalog-engine`, aceptando reemplazar archivos.

```powershell
cd C:\catalog-engine
npm install
npm run typecheck
npm run test:catalog-intelligence
```

## Procesar el catálogo

```powershell
npm run catalog:interpret -- "catalogo-makito-texto.json"
```

Salida predeterminada:

```text
reports/catalogo-makito-texto-interpretation.json
```

También se puede indicar la salida:

```powershell
npm run catalog:interpret -- "catalogo-makito-texto.json" "reports/makito-ast.json"
```

## Resultado

El JSON contiene:

- `detection`: bloques detectados.
- `patterns`: clasificación y campos extraídos.
- `ast`: árbol semántico Catalog → Page → nodes.
- `normalizedProducts`: productos compatibles con el Import Engine.

## Nota de precisión

Esta versión usa heurísticas generales. En el catálogo real de prueba detectó 501 candidatos a producto. Algunos son falsos positivos (por ejemplo números de índice o página). El siguiente ajuste debe centrarse en reglas específicas de estructura Makito, continuidad entre páginas y validación de referencia/nombre antes de importar a PostgreSQL.
