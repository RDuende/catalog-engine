# RC3.9.0 — Márgenes, tiempos de realización y envíos

## Instalación
Descomprimir sobre `C:\catalog-engine` y ejecutar:

```powershell
npm run typecheck
npm run test:commercial-operations
npm run web:build
npm run dev
```

Panel: `http://localhost:5173/admin/commercial-operations`

Los datos se guardan de forma atómica en `.data/commercial-operations.json`.

## Incluye
- Reglas de margen globales, por proveedor, categoría o producto.
- Margen porcentual sobre coste, sobre precio o importe fijo.
- Márgenes mínimos en porcentaje e importe.
- Tiempos de preparación, producción, control y seguridad.
- Zonas y métodos de envío, tarifa plana o por peso, envío gratuito y seguimiento.
- Parámetros generales: IVA, packaging, comisiones de pago, peso por defecto y pedido mínimo.
- Simulador de precio, rentabilidad y fecha estimada de entrega.
