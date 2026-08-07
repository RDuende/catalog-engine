# Aplicar V3.1

Copiar el parche sobre V3.0 y ejecutar:

```bash
npm install
npm run typecheck
npm run test:v3-1
```

Configuración:

```env
PURCHASE_STORAGE=file
PURCHASE_ORDER_STORAGE_DIR=.data/purchase/orders
PAYMENT_INTENT_STORAGE_DIR=.data/purchase/payment-intents
PAYMENT_PROVIDER=mock
```
