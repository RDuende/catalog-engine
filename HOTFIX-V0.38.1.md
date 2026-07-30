# Catalog Engine v0.38.1 — TypeScript hotfix

Corrige los 23 errores detectados al ejecutar `npm run typecheck` tras instalar v0.38.0:

- añade el contrato que faltaba en `src/modules/canonical-product/canonical-types.ts`;
- protege accesos a arrays con `noUncheckedIndexedAccess`;
- evita valores `undefined` en precios, colores y registros importados;
- refuerza las pruebas con aserciones de existencia;
- mantiene intacta la funcionalidad del Workbench.

## Instalación

Descomprimir el ZIP en `C:\catalog-engine`, sustituyendo los archivos existentes.

Después ejecutar:

```powershell
npm run typecheck
npm run test:document-intelligence
npm run test:import-management
npm run test:business-decision
```
