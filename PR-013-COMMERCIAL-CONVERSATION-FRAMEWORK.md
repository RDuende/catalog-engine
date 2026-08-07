# PR-013 — Commercial Conversation Framework

Rai realiza primero descubrimiento comercial y solo consulta el catálogo cuando dispone de contexto suficiente.

## Clasificación inicial

- BUSINESS: destinatario, objetivo, cantidad y presupuesto.
- CONSUMER: idea concreta o propuestas.

## Particular que quiere propuestas

Se construye un perfil útil del receptor: relación, edad aproximada, intereses, personalidad, aspectos a evitar, ocasión y presupuesto.

## Control técnico

`search_products` queda bloqueada con `DISCOVERY_INCOMPLETE` hasta que la evaluación de descubrimiento esté completa. Esto evita consultas prematuras y repetidas aunque el modelo intente llamar a la herramienta.

## Nuevos campos

`customerType`, `giftDiscoveryMode`, `recipientRelationship`, `recipientAge`, `recipientInterests`, `recipientDislikes`, `recipientPersonality`, `occasion` e `intendedUse`.
