# RecuerdArte Admin Suite rc3.6.0 — Settings

Añade `/admin/settings` y la API `/api/v1/platform-settings`.

## Persistencia

Los valores se almacenan en `.data/platform-settings.json` mediante escritura atómica. Los secretos se devuelven enmascarados y un campo secreto vacío conserva el valor existente.

## Preparación para RDgest

`platform.settingsProvider` permite `LOCAL` y `RDGEST`. La interfaz y contratos no cambian cuando RDgest se convierta en la autoridad de configuración; solo deberá sustituirse el proveedor de persistencia.

## Instalación

```powershell
npm install
npm run typecheck
npm run test:platform-settings
npm run web:build
npm run dev
```

Abrir: `http://localhost:5173/admin/settings`
