# V3.0 — Purchase Experience

## Alcance

- Pedido interno asociado a Journey.
- Líneas recalculadas desde Smart Catalog.
- Validación de producto, cantidad y stock.
- Totales, envío y moneda.
- Estados DRAFT, CONFIRMED y CANCELLED.
- Confirmación y cancelación idempotentes.
- API REST y repositorio en memoria.

## Endpoints

- POST `/api/v1/purchase/orders`
- GET `/api/v1/purchase/orders/:orderId`
- GET `/api/v1/journeys/:journeyId/orders`
- POST `/api/v1/purchase/orders/:orderId/confirm`
- POST `/api/v1/purchase/orders/:orderId/cancel`
