# Catalog Engine v0.37.0 — Import Management & Learning System

## Incluye
- Sesiones y panel de importaciones.
- Revisión completa y solo incidencias.
- Snapshots inmutables de fuente, normalización, clasificación, revisión y reprocesado.
- Historial temporal por producto.
- Correcciones humanas convertidas en conocimiento confirmado por proveedor.
- Patrones observados/propuestos que requieren confirmación.
- Aplicación incremental de reglas confirmadas a importaciones nuevas.
- Reprocesado comparativo sin sobrescribir productos.
- Consola visual estática en `tools/import-review-panel/index.html`.

## Instalación
Descomprimir sobre `C:\catalog-engine` y ejecutar:
```powershell
npm install
npm run typecheck
npm run test:import-management
```

## Política inicial
`config/import-management/default-import-policy.json` arranca en modo estricto.
