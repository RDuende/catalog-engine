# Catalog Engine v0.54.2 — Reasoning Upgrade

Corrección basada en el diagnóstico real exportado desde Rai Workspace.

## Cambios

- Los saludos como `hola Rai` ya no lanzan búsquedas ni recomendaciones.
- El nombre del asistente `Rai` deja de tratarse como término comercial.
- Se evita la falsa coincidencia `rai` → categorías `Rainbow`.
- Los saludos conservan el contexto anterior sin sobrescribir `need`.
- El Workspace responde con una pregunta comercial en lugar de mostrar productos.
- La consulta enviada al Recommendation Engine elimina saludos, cantidades y presupuestos operativos.
- Nuevo test de regresión: un saludo produce `ASK`, cero llamadas al Recommendation Engine y cero productos.

## Validación

```powershell
npm run typecheck
npm run test:sales-brain
npm run test:rai-workspace
npm run dev
```

Prueba manual:

```text
hola Rai
```

Resultado esperado: Rai saluda y pregunta qué necesidad comercial debe resolver. No debe mostrar productos Rainbow.
