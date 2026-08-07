# RC2.1 — Hotfix conversación de Rai

Aplicar sobre RC2 copiando el contenido del parche en la raíz del proyecto y aceptando la sustitución de archivos.

Corrige:

1. Lectura doble del cuerpo `Response` en Experience SDK.
2. Extracción de `result.nextQuestion` y del último mensaje RAI de la sesión.
3. Registro del error real de OpenAI antes de usar fallback.
4. Prueba de regresión para cuerpos HTTP consumibles una sola vez.

Después:

```powershell
npm run typecheck
npm run test:experience-sdk
npm run web:build
npm run web:e2e
```

Reinicia backend y frontend, y pulsa «Nuevo» para descartar la sesión anterior.
