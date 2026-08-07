# Aplicar RC2.4

Copiar el contenido del parche sobre la raíz de RC2.3, conservando las rutas.

Ejecutar:

```powershell
npm run typecheck
npm run test:contextual-answers
npm run test:mvp-conversation
npm run web:build
npm run web:e2e
```

Reiniciar backend y frontend y pulsar **Nuevo** antes de probar.
