# UI-04 — Experiencia de productos

## Objetivo

Convertir la imagen elegida en una experiencia comercial visual: mockups, comparación de productos, cantidades, precio y creación del pedido.

## Incluye

- Apertura desde la imagen seleccionada.
- Carga de plantillas del Presentation Engine.
- Generación automática de mockups para las seis recomendaciones principales.
- Comparación de precio, stock, plazo, puntuación y motivos.
- Selección persistente de producto y cantidad.
- Creación de pedido usando precios recalculados por el backend.
- Asociación del mockup al pedido mediante `presentationArtifactId`.
- Resumen del pedido creado.
- Exportación de logs ampliada con estado del producto, mockups y pedido.

## Comprobación

```bash
npm run web:install
npm run web:build
npm run test:ui-04
```
