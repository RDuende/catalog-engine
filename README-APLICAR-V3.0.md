# Aplicar V3.0 — Purchase Experience

Copiar el contenido del parche sobre la raíz del proyecto V2.9, conservando la estructura de carpetas.

Después ejecutar:

```bash
npm install
npm run typecheck
npm run test:purchase-experience
npm run test:v3-0
```

V3.0 crea pedidos internos en estado DRAFT y permite confirmarlos o cancelarlos. No integra todavía una pasarela de pago ni descuenta stock físicamente.
