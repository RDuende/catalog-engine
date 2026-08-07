# PR-012 — Price diagnostics and agent performance

- Extracción recursiva de precios en metadata/attributes y escalas por cantidad.
- Diagnóstico separado: precio válido, precio ausente y precio superior al presupuesto.
- Resultado de search_products compacto para no reenviar el catálogo completo a GPT.
- Historial limitado a los últimos 4 mensajes y 600 caracteres por mensaje.
- Contexto comercial compacto sin providerKey ni confidence.
- Rai no ofrece proveedores no conectados ni afirma disponibilidad sin consultar.
- Refinamiento de need al concretar el producto.
