# La Colorida — Catalog Engine v0.7.0

Versión completa del backend del catálogo.

## Incluye

- Fastify + TypeScript.
- PostgreSQL.
- Prisma 7 y `prisma.config.ts`.
- Adaptador directo `@prisma/adapter-pg`.
- Modelo completo del catálogo.
- API REST de productos, categorías, proveedores y marcas.
- Búsqueda, filtros y paginación.
- Script de datos de demostración.
- Knowledge Graph con relaciones ponderadas.
- Recomendaciones explicables y registro de decisiones.
- Scripts PowerShell de instalación y prueba.

## Instalación recomendada sobre el proyecto actual

No borres tu proyecto actual inmediatamente.

1. Cierra `npm run dev` y Prisma Studio.
2. Renombra:

```powershell
Rename-Item C:\catalog-engine C:\catalog-engine-backup
```

3. Descomprime esta versión como:

```text
C:\catalog-engine
```

4. Copia tu `.env` anterior:

```powershell
Copy-Item C:\catalog-engine-backup\.env C:\catalog-engine\.env
```

5. Copia las migraciones anteriores, si existen:

```powershell
Copy-Item C:\catalog-engine-backup\prisma\migrations `
  C:\catalog-engine\prisma\migrations -Recurse
```

6. Instala y genera Prisma:

```powershell
cd C:\catalog-engine
npm install
npx prisma format
npx prisma validate
npx prisma generate
```

7. No ejecutes `migrate reset`: tu base de datos ya está creada.

8. Carga datos de demostración:

```powershell
npm run seed:catalog
```

9. Arranca:

```powershell
npm run dev
```

## Comprobación

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
Invoke-RestMethod http://127.0.0.1:3000/api/v1/products
```

También puedes ejecutar:

```powershell
.\scripts\probar-api.ps1
```

## Endpoints

- `GET /health`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PATCH /api/v1/products/:id`
- `DELETE /api/v1/products/:id`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `GET /api/v1/brands`
- `POST /api/v1/brands`

## Crear un producto

```powershell
$body = @{
  name = "Camiseta personalizada"
  sku = "CAM-001"
  status = "ACTIVE"
  customizable = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:3000/api/v1/products" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

## Nota sobre PostgreSQL vector

El esquema contiene `Unsupported("vector")` para los embeddings. La extensión
`vector` debe estar instalada en la base de datos antes de crear esa tabla:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```


## Actualización desde v0.6.0

Conserva tu `.env` y tu base de datos. Después de sustituir los archivos:

```powershell
cd C:\catalog-engine
npm install
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name sprint_5_knowledge_engine
npm run seed:all
npm run dev
```

No ejecutes `prisma migrate reset`.

## Knowledge Engine

Endpoints principales:

- `GET /api/v1/knowledge/nodes`
- `POST /api/v1/knowledge/nodes`
- `GET /api/v1/knowledge/nodes/:id`
- `PATCH /api/v1/knowledge/nodes/:id`
- `DELETE /api/v1/knowledge/nodes/:id`
- `GET /api/v1/knowledge/edges`
- `POST /api/v1/knowledge/edges`
- `POST /api/v1/knowledge/product-links`
- `POST /api/v1/knowledge/traverse`
- `POST /api/v1/knowledge/recommend`
- `GET /api/v1/knowledge/sessions/:id`

Prueba automática:

```powershell
.\scripts\probar-knowledge.ps1
```

Prueba manual:

```powershell
$body = @{
  query = "Voy a abrir una cafetería"
  depth = 3
  limit = 10
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://127.0.0.1:3000/api/v1/knowledge/recommend" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

La respuesta incluye:

- conceptos detectados;
- puntuación de cada coincidencia;
- productos recomendados;
- porcentaje de afinidad;
- razones concretas;
- evidencias utilizadas;
- `sessionId` para consultar el historial completo de decisiones.
