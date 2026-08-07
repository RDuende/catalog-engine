# RecuerdArte · Área de administración completa rc4.0.0

Este paquete sustituye a los ZIPs parciales anteriores del área de administración.
Debe descomprimirse sobre la raíz de `C:\catalog-engine`, conservando las rutas.

## Módulos incluidos

- Dashboard principal: `/admin`
- Catálogo Inteligente: `/admin/catalog-intelligence`
- Importaciones unificadas: `/admin/catalog-imports`
- Proveedores: `/admin/providers`
- Estadísticas: `/admin/statistics`
- Settings: `/admin/settings`
- Laboratorio IA: `/admin/ai-lab`
- Centro de Inteligencia: `/admin/intelligence-center`
- Márgenes, tiempos y envíos: `/admin/commercial-operations`

## Backend incluido

- Importador unificado de catálogos.
- Trabajos persistentes con pausa, reanudación y cancelación.
- Descarga autenticada y almacenamiento local de imágenes.
- Product Brain e integración con Catálogo Inteligente.
- Gestión de proveedores y credenciales.
- Settings persistentes preparados para futura migración a RDgest.
- Estadísticas de plataforma.
- Laboratorio IA y trazabilidad del Centro de Inteligencia.
- Reglas comerciales, márgenes, producción y envíos.

## Instalación

1. Espera a que finalice o pausa cualquier importación activa.
2. Detén el servidor con `Ctrl+C`.
3. Haz una copia de seguridad o commit del proyecto.
4. Descomprime este ZIP sobre `C:\catalog-engine`.
5. Ejecuta:

```powershell
cd C:\catalog-engine
npm install
npm run typecheck
npm run test:catalog-import
npm run test:catalog-import-resume
npm run test:catalog-media
npm run test:platform-settings
npm run test:catalog-providers
npm run test:commercial-operations
npm run web:build
npm run dev
```

## Datos persistentes

El paquete no incluye ni reemplaza los datos locales existentes. Los módulos usan:

- `.data/catalog-media/`
- `.data/platform-settings.json`
- `.data/catalog-providers.json`
- `.data/commercial-operations.json`
- `.data/intelligence-traces.json`
- `storage/jobs/`

No borres estas rutas si quieres conservar imágenes, configuración, proveedores, trazas y trabajos.

## Importación unificada

Desde el panel `/admin/catalog-imports` se ejecuta en un solo flujo:

1. descarga del proveedor;
2. normalización y catálogo canónico;
3. Product Brain;
4. descarga y persistencia local de medios;
5. actualización incremental;
6. métricas, progreso, errores y ETA.

Los trabajos pueden pausarse y reanudarse. Los productos e imágenes ya procesados se omiten.

## Nota sobre RDgest

Settings y Proveedores están desacoplados mediante servicios propios. En una integración futura con RDgest se podrá sustituir la persistencia local sin cambiar las pantallas ni el resto del motor.
