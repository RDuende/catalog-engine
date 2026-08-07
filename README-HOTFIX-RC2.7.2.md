# RC2.7.2 — sesión estable y botón Hacer propuestas

## Causa corregida

La API devolvía el identificador real en `response.session.id`, mientras que el frontend guardaba únicamente `response.sessionId`.
Como `response.sessionId` no existía en la respuesta del servicio, React lo convertía en `undefined` y el mensaje siguiente volvía a crear una conversación nueva.

## Cambios

- El servicio devuelve ahora `sessionId` también en el nivel superior del contrato.
- El frontend acepta tanto `response.sessionId` como `response.session.id`.
- El SDK incorpora `showProposals(sessionId)`.
- La web renderiza el botón visible **Hacer propuestas** después de comenzar la conversación.
- El botón llama a `POST /api/v1/mvp/conversations/:sessionId/proposals`.
- Tras generar propuestas, la experiencia se actualiza y se abre la vista de historias.
- Se añadió un test del endpoint explícito en el SDK.

## Verificación

Los seis archivos modificados pasan la comprobación sintáctica de TypeScript mediante `transpileModule`.
La suite completa no pudo ejecutarse en la copia recibida porque el ZIP no incluye las dependencias raíz instaladas (`tsx`, `@types/node`, Fastify y Prisma).

En el equipo de desarrollo:

```powershell
cd C:\catalog-engine
npm install
npm run test:experience-sdk
npm run test:mvp-conversation
npm run web:build
```
