# Catalog Engine v0.39.0 — Import Workbench

## Incluye
- Panel web integrado en Fastify en `http://localhost:3000/imports`.
- Dashboard de documentos, productos, revisiones y confianza.
- Carga real de PDF, CSV y XLSX hasta 100 MB mediante streaming HTTP básico.
- Persistencia local del archivo original y metadatos en `data/document-imports/`.
- Detección de duplicados mediante SHA-256.
- Historial de documentos y cola de revisión.
- Acción de análisis inicial preparada para conectarse al Document Intelligence Engine.
- Interfaz responsive sin dependencias frontend adicionales.

## Uso
```powershell
npm install
npm run typecheck
npm run dev
```

Abrir: `http://localhost:3000/imports`

## Importante
La v0.39.0 entrega el shell operativo, la ingesta y persistencia. El botón Analizar ejecuta por ahora una transición inicial y deja preparado el punto de conexión con la extracción profunda del PDF; no inventa datos extraídos del catálogo.
