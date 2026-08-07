# rc2.7.1 — sesión automática y botón Mostrar propuestas

## Corrección

- Nuevos endpoints web con cookie HttpOnly:
  - `POST /mvp/chat/messages`
  - `POST /mvp/chat/proposals`
- La cookie conserva `sessionId`, propietario y token durante 30 días.
- El navegador ya no tiene que gestionar manualmente la sesión.
- `browser/rai-chat-widget.js` muestra el botón que devuelve `actions` y llama al endpoint de propuestas.

## Registro de rutas

Además de `mvpConversationRoutes`, registra:

```ts
await app.register(mvpBrowserChatRoutes);
```

## Integración del widget

```html
<script type="module" src="/assets/rai-chat-widget.js"></script>
<rai-chat></rai-chat>
```

Copia `browser/rai-chat-widget.js` a la carpeta pública usada por la web.

## Pruebas

```powershell
npm run test:mvp-conversation
npm run test:mvp-orchestrator
npx tsx --test src/modules/mvp-orchestrator/mvp-browser-chat.routes.test.ts
```
