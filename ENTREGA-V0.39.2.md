# Catalog Engine v0.39.2 — Document Workbench

## Instalación

Descomprime el ZIP sobre `C:\catalog-engine`, acepta sustituir y ejecuta:

```powershell
npm install
npm run typecheck
npm run dev
```

Abre `http://localhost:3000/imports`, importa un PDF y pulsa **Abrir**.
También puedes entrar directamente en `http://localhost:3000/imports/workbench?id=ID_DOCUMENTO`.

## Incluye

- Visor PDF integrado con navegación y zoom.
- Lista lateral de productos.
- Inspector editable de referencia, nombre, categoría, material y dimensiones.
- Evidencias y confianza por campo.
- Tabla de precios y características.
- Correcciones persistentes como evidencia humana.
- Aprobación persistente del producto.
- API para servir el documento original y recuperar/guardar el análisis.

## Alcance del análisis

Esta entrega conecta el flujo visual completo y la persistencia del Workbench. El análisis profundo de bloques, tablas e iconos todavía debe conectarse al extractor PDF real; el análisis inicial de Makito usa la plantilla de demostración ya empleada por el prototipo anterior.
