# UI-01 — Conversación con Rai

## Objetivo

Convertir la entrada de RecuerdArte en una landing conversacional inmersiva y reducir la primera pantalla a tres elementos: Rai, la promesa emocional y el campo para comenzar.

## Incluye

- Landing a pantalla completa antes de iniciar el Journey.
- Rai etéreo construido en CSS, sin avatar ni estética infantil.
- Campo de conversación central con envío por Enter.
- Transición automática al espacio de trabajo después del primer mensaje.
- Aparición progresiva del timeline, conversación y lienzo del recuerdo.
- Tema claro y oscuro persistente.
- Recuperación de sesiones existentes.
- Diseño responsive y respeto a `prefers-reduced-motion`.
- Corrección de tipos de recomendaciones y pedidos incorporada.

## Validación

- `quality:architecture`: OK.
- `quality:secrets`: OK.
- La compilación Vite debe ejecutarse en el equipo local, ya que el registro interno del entorno no contiene `@types/react`.
