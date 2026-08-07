# Product Brain v1

## Aplicación
Copiar las rutas del ZIP sobre la raíz del proyecto.

## Clasificar Makito
```powershell
npm run catalog:classify -- --source=makito --limit=100000
```
Para recalcular todo:
```powershell
npm run catalog:classify -- --source=makito --limit=100000 --force
```

## Verificación
```powershell
npm run typecheck
npm run test:product-brain
npm run test:smart-catalog
```

La tabla `canonical_product_brains` se crea automáticamente. `canonical_products` no se modifica.
