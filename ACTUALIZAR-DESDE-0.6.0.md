# Actualizar de v0.6.0 a v0.7.0

1. Detén el servidor.
2. Haz una copia de `C:\catalog-engine`.
3. Conserva el archivo `.env`.
4. Sustituye el proyecto por esta versión.
5. Devuelve tu `.env` a la raíz.
6. Conserva la carpeta `prisma\migrations` anterior.

Ejecuta:

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

No uses `prisma migrate reset`.

Comprueba:

```powershell
Invoke-RestMethod http://127.0.0.1:3000/health
.\scripts\probar-knowledge.ps1
```
