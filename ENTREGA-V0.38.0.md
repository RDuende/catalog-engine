# Catalog Engine v0.38.0 — Document Intelligence Workbench

## Incluye

- Documento como entidad persistente con SHA-256, páginas, bloques, estado, plantilla y versión del motor.
- `DocumentLoader` agnóstico del origen.
- `LayoutAnalyzer` para texto, tablas, precios e iconos.
- `MakitoExtractor` configurable para referencias, dimensiones, precios, códigos de impresión, colores y features.
- Evidencia y confianza por campo.
- Comparación entre ediciones de documentos sin sobrescribir el histórico.
- Evaluación de plantillas y propuestas de mejora.
- Workbench HTML para revisar páginas, productos detectados, features y evidencias.
- Pruebas unitarias del flujo Makito.

## Instalación

Copiar el contenido sobre el repositorio y ejecutar:

```bash
npm install
npm run typecheck
npm run test:document-intelligence
```

Abrir `tools/document-intelligence-workbench/index.html` para revisar el prototipo visual.

## Integración PDF

El módulo recibe páginas con texto ya extraído. El adaptador PDF real debe suministrar `pages[]` y, cuando esté disponible, coordenadas/imágenes. Esta separación permite usar PDF.js, un servicio externo o extracción nativa sin acoplar el núcleo.
