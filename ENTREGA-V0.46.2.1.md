# Catalog Engine v0.46.2.1

Hotfix de incrementalidad real para Knowledge Graph Builder.

## Corrección principal

La comparación de enlaces se realiza ahora directamente en PostgreSQL mediante `IS DISTINCT FROM` sobre:

- `source`
- `confidence` como `numeric`
- `metadata` como `jsonb`

Esto evita falsos cambios causados por representación numérica, serialización u orden de propiedades JSON.

La operación es atómica: inserta si no existe, actualiza únicamente si cambió contenido semántico y devuelve `UNCHANGED` sin escritura cuando el enlace es idéntico.

## Métrica nueva

El resultado del Builder incorpora:

```json
{
  "writesAvoided": 34503
}
```

`writesAvoided` aumenta junto a `linksUnchanged`.

## Validación esperada

Después de instalar esta entrega, ejecutar dos veces:

```powershell
npm run knowledge:build:v2 -- --provider=makito
```

La segunda ejecución debe devolver aproximadamente:

```json
{
  "linksCreated": 0,
  "linksUpdated": 0,
  "linksUnchanged": 34503,
  "writesAvoided": 34503,
  "staleLinksRemoved": 0,
  "failed": 0
}
```

No requiere migración de base de datos.
