# Catalog Engine v0.40.3 — Workbench Viewer & Multi-product Detection

## Correcciones

- El visor calcula el zoom respecto al espacio real disponible y ya no queda reducido a una franja a la izquierda.
- El layout responsive mantiene visibles Productos, PDF e Inspector al trabajar con la ventana dividida.
- Renderizado HiDPI sin alterar las coordenadas de las evidencias.
- Re-render automático mediante ResizeObserver.
- El contador de productos aparece también en la cabecera.
- La detección de identidad acepta texto e iconos después de `Nombre Referencia`.
- Detecta varias referencias dentro de una misma línea/columna.
- Separa regiones de producto por columnas y por el siguiente encabezado vertical.
- Ignora páginas de índice sin dimensiones ni precios.
- Invalida análisis anteriores mediante `engineVersion: 0.40.3`.

## Uso

1. Sustituir los archivos del ZIP sobre `C:\catalog-engine`.
2. Ejecutar `npm install`.
3. Ejecutar `npm run typecheck`.
4. Ejecutar `npm run dev`.
5. Abrir el documento y pulsar `Reanalizar`.
