# V3.1 — Payment Intent & Order Persistence

- Persistencia JSON atómica para pedidos e intentos de pago.
- Proveedor de pago desacoplado con implementación mock.
- Idempotencia por clave de checkout.
- El importe siempre procede del pedido recalculado desde catálogo.
- Flujo CONFIRMED → PaymentIntent → PAID.
- Endpoints de creación, consulta, confirmación y cancelación.
