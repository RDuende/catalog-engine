# Sprint 5 — Import Engine 1.0

Incluye un framework extensible de importación con:

- Registro de adaptadores.
- Adaptadores `generic-csv`, `generic-json` y `makito`.
- Normalización al modelo común de producto.
- Creación/actualización idempotente de productos.
- Categorías, variantes e imágenes.
- Trazabilidad completa en `ImportJob` e `ImportRecord`.
- Modo simulación (`dryRun`).
- API REST y comando CLI.

## Instalación

Copia los archivos sobre `C:\catalog-engine` y ejecuta:

```powershell
npm run typecheck
npm run dev
```

No requiere una migración nueva: reutiliza `ImportSource`, `ImportJob` e `ImportRecord` que ya existen.

## 1. Crear una fuente Makito

```powershell
$source = Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:3000/api/v1/imports/sources" `
  -ContentType "application/json" `
  -Body '{"name":"Makito","type":"makito","configuration":{"provider":"makito"}}'

$source.id
```

Para asociarla a un proveedor ya existente, añade `supplierId`.

## 2. Simulación segura

```powershell
$body = @{
  sourceId = $source.id
  filePath = "C:\catalog-engine\imports\makito.csv"
  adapter = "makito"
  dryRun = $true
  limit = 20
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:3000/api/v1/imports/run" `
  -ContentType "application/json" `
  -Body $body
```

## 3. Importación real

Cambia `dryRun` a `$false` o elimina esa propiedad.

## Endpoints

- `GET /api/v1/imports/adapters`
- `GET /api/v1/imports/sources`
- `POST /api/v1/imports/sources`
- `GET /api/v1/imports/jobs`
- `POST /api/v1/imports/run`

## Formatos aceptados

### CSV

Columnas mínimas: `name`/`nombre` y `id`/`sku`/`reference`/`referencia`.

### JSON

Puede ser un array, un objeto con `products`, JSON Lines o NDJSON.

## Siguiente iteración

El PDF de 33 páginas se procesará mediante un adaptador específico de documento. Este Sprint deja preparado el framework y la persistencia, sin mezclar todavía extracción visual/OCR con importación de catálogo.
