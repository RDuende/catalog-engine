# Aplicar UI-05

1. Aplica este parche sobre UI-04.
2. Conserva tus variables de entorno y directorios `.data`.
3. Ejecuta:

```bash
npm run web:install
npm run web:build
npm run dev
```

En otra terminal:

```bash
npm run web:dev
```

Con `PAYMENT_PROVIDER=mock`, la confirmación de pago no solicita datos bancarios reales.
