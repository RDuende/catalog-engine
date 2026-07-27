# RecuerdArte Catalog Engine 0.28.0

- Rai conserva el estado conversacional por sessionId.
- Reconoce respuestas cortas como «mi hija» cuando responde al destinatario.
- El flujo de negocio decide el siguiente dato pendiente antes de pedir a OpenAI que redacte.
- Se evita repetir preguntas sobre datos ya confirmados.
- El instalador comprueba comandos por código de salida y no interpreta como error los mensajes informativos de Prisma.
