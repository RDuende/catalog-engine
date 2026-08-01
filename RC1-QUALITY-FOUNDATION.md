# RC-1 — Quality Foundation

Versión: `0.71.3-rc1-quality`

## Incluido

- Puerta de calidad única mediante `npm run check`.
- Validación de límites arquitectónicos.
- Escaneo local de secretos.
- Verificación de tests de módulos críticos.
- Batería `test:v1-critical`.
- Documentación de uso para ramas y PR.

## Validación en local

```powershell
npm install
npm run quality
npm run typecheck
npm run test:v1-critical
npm run build
```
