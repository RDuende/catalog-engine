# Aplicar V1.1 — Journey Domain

Este parche parte de M4.2.1.

1. Copia el contenido del ZIP en la raíz de `catalog-engine`, permitiendo sobrescribir `package.json` y `package-lock.json`.
2. Ejecuta:

```bash
npm install
npm run test:v1-1
```

No sustituye ni elimina módulos existentes.
