# Aplicar V2.1

Copiar el contenido del parche sobre V2.0 conservando las rutas.

```bash
npm install
npm run typecheck
npm run test:v2-1
```

Por defecto los datos se guardan en `.data/mvp-conversations`. Para pruebas efímeras:

```env
MVP_CONVERSATION_STORAGE=memory
```
