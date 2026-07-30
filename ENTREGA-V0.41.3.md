# Catalog Engine v0.41.3 — Makito diagnostics

## Cambios

- Nuevo endpoint `POST /api/v1/providers/makito/debug`.
- Muestra URL, HTTP status, redirección, Content-Type y hasta 2.000 caracteres del cuerpo de Makito.
- Oculta completamente las credenciales y el JWT.
- Los errores del conector ya no sustituyen todos los 401/403 por un mensaje genérico.
- El header `Authorization` se aplica al final para impedir que una cabecera personalizada lo sobrescriba.
- Se mantiene un único URL entre el primer intento y la renovación automática del token.

## Diagnóstico del catálogo

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://127.0.0.1:3000/api/v1/providers/makito/debug `
  -ContentType "application/json" `
  -Body '{"config":{},"path":"/catalog/files","query":{"format":"JSON","lang":"es"}}' | ConvertTo-Json -Depth 10
```

El resultado no contiene `clientSecret` ni el JWT completo.
