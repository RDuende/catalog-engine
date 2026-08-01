# Dependencias

## Producción

- Fastify 5: servidor HTTP.
- PostgreSQL (`pg`) y Prisma 7: persistencia.
- TypeBox: esquemas y validación.
- dotenv: configuración local.
- xlsx y pdfjs-dist: ingestión documental.

## Desarrollo

- TypeScript 5.7.
- tsx.
- Node test runner.

## Observaciones

- Mantener una sola estrategia de acceso a datos por agregado; Prisma y `pg` no deben mezclarse dentro del mismo repositorio.
- Las dependencias de IA deben quedar encapsuladas en `ai-gateway`.
- Los módulos de dominio no deben importar Fastify.
- Los tests unitarios no deben necesitar `DATABASE_URL`.
