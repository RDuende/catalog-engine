# Catalog Engine v0.40.2 — Real Analysis Activation

Corrección del Workbench para impedir que un análisis de demostración antiguo siga apareciendo como resultado real.

## Cambios

- Elimina completamente `initialAnalysis()` y el producto fijo Nymeria 22439.
- Versiona los análisis con `engineVersion: 0.40.2`.
- Invalida automáticamente cualquier `.analysis.json` creado por el prototipo.
- Al abrir un documento con análisis antiguo, inicia automáticamente el análisis PDF real.
- Desactiva la caché de los recursos del Workbench.
- Añade cache-busting a `workbench.js`.
- Evita divisiones por cero cuando no se detectan productos.

## Comprobación prevista con el PDF de desarrollo

- 36 páginas PDF.
- Más de un producto detectado.
- En la primera página de productos deben aparecer por separado:
  - Garnep 22285
  - Tempest 22440
  - Nymeria 22439

## Instalación

Copiar el contenido sobre `C:\catalog-engine`, sustituyendo archivos, y ejecutar:

```powershell
npm install
npm run typecheck
npm run dev
```

Abrir el mismo documento. El Workbench invalidará el análisis demo y lanzará el análisis real automáticamente. También puede pulsarse `Reanalizar`.
