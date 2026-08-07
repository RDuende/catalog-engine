# Aplicar M3.3

1. Haz una copia o commit del estado M3.2 estable.
2. Copia el contenido de este parche sobre la raíz de `catalog-engine`, conservando las rutas.
3. Ejecuta:

```bash
npm install
npm run test:m3-3
```

La entrega añade el paso `reason` a los tres flujos canónicos. Los tests que construyen registries personalizados y usan flujos propios no necesitan registrar este handler salvo que añadan ese paso a su flujo.
