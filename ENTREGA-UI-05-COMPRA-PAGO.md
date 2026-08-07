# UI-05 — Experiencia de compra y pago

## Alcance

- Revisión emocional del pedido.
- Confirmación idempotente del pedido.
- Creación del intento de pago desde el total calculado por el backend.
- Confirmación con el proveedor `mock` de V3.1.
- Actualización del pedido a `PAID`.
- Pantalla final con timeline de producción.
- Exportación de logs ampliada con checkout e intento de pago.

## Seguridad

El frontend nunca envía el importe del pago. El importe y la moneda se obtienen del pedido confirmado en el servidor.

## Validación

```bash
npm run quality:architecture
npm run quality:secrets
npm run quality:tests
npm run web:build
```
