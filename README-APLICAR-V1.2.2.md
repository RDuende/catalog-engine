# Aplicar V1.2.2

1. Copia el contenido del parche sobre la raíz del proyecto.
2. Sustituye los dos archivos cuando Windows lo solicite.
3. Ejecuta:

```bash
npm run typecheck
npm run test:v1-2
```

El hotfix amplía la extracción de presupuestos para expresiones con `es`, `sería`, `máximo`, `hasta`, `unos`, `sobre`, y el símbolo euro antes o después del importe.
