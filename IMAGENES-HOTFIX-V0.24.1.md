# RecuerdArte v0.24.1 — corrección de imágenes

Se corrige el fallo principal de subida de fotografías del Visual Commerce.

## Causa
Fastify acepta por defecto cuerpos JSON de aproximadamente 1 MiB. Las fotografías se envían como Base64, por lo que una imagen normal superaba el límite y la petición era rechazada antes de entrar en `/rai/mockup`.

## Cambios
- Límite específico de 13 MiB para `/api/v1/rai/mockup`.
- Validación en navegador: JPG, PNG o WEBP y máximo 8 MiB.
- Mensajes claros para errores HTTP 413.
- Envío multipart compatible para varias imágenes de referencia.
- Compatibilidad con respuestas Base64 o URL temporal de OpenAI Images.
- Registro del error real del generador en el servidor.
