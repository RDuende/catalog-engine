# Catalog Engine v0.7.0 completo

Esta versión está preparada para sustituir directamente la carpeta de la v0.6.

## Instalación recomendada

1. Detén el servidor con `Ctrl + C`.
2. Renombra la carpeta actual:

```powershell
Rename-Item C:\catalog-engine C:\catalog-engine-v0.6-backup
```

3. Descomprime este ZIP.
4. Renombra la carpeta descomprimida a:

```text
C:\catalog-engine
```

5. Copia el archivo `.env` desde la copia anterior:

```powershell
Copy-Item C:\catalog-engine-v0.6-backup\.env C:\catalog-engine\.env
```

6. Conserva también las migraciones anteriores de la v0.6:

```powershell
Copy-Item `
  C:\catalog-engine-v0.6-backup\prisma\migrations `
  C:\catalog-engine\prisma\migrations `
  -Recurse -Force
```

7. Instala dependencias y genera Prisma Client:

```powershell
cd C:\catalog-engine
npm install
npx prisma format
npx prisma validate
npx prisma generate
```

8. Crea las tablas nuevas directamente en PostgreSQL:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\instalar-knowledge-db.ps1
```

9. Carga los datos iniciales:

```powershell
npm run seed:knowledge
```

10. Arranca:

```powershell
npm run dev
```

11. Prueba en otra terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\probar-knowledge.ps1
```

## Importante

No ejecutes:

```powershell
npx prisma migrate reset
npx prisma migrate dev
npx prisma db push
```

La versión incluye un instalador SQL directo para evitar el problema de la migración histórica con `vector`.
