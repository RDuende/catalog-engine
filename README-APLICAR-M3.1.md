# Aplicar M3.1

Base requerida: M2.7 con la corrección del test `runtime-entrypoint-convergence.test.ts`.

1. Copia el contenido del parche sobre la raíz de `catalog-engine`.
2. Conserva tus archivos `.env` y datos locales.
3. Ejecuta:

```bash
npm install
npm run test:m3-1
```

El parche incorpora también la corrección del test de M2.7 que cambia `retirementReady` a `false` tras una sola llamada canónica.
