# Módulo Proveedores

Añade la ruta `/admin/providers` y la API `/api/v1/catalog-providers`.

Incluye alta, edición, activación, eliminación, prueba de conexión, credenciales enmascaradas, capacidades de catálogo y política de importación. Los datos se guardan en `.data/catalog-providers.json` mediante escritura atómica.

Makito se crea como proveedor inicial. El módulo está separado de Settings para poder migrar su persistencia y gestión a RDgest más adelante.

## Comprobación

```powershell
npm run typecheck
npx tsx --test src/modules/catalog-providers/*.test.ts
npm run web:build
npm run dev
```

Abrir: `http://localhost:5173/admin/providers`
