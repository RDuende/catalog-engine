# 0.71.3-rc1-quality

- Añade `npm run check` como puerta de calidad de la V1.
- Añade validación arquitectónica, escaneo de secretos y control de tests críticos.
- Añade una batería estable `test:v1-critical`.
- Documenta el proceso de validación previo a commit y merge.

# Changelog

## 0.7.0

- Knowledge Graph genérico y reutilizable.
- Nodos de conceptos, necesidades, soluciones, pasos, públicos y ocasiones.
- Relaciones dirigidas con peso, confianza y procedencia.
- Enlaces ponderados entre conocimiento y productos.
- Recorrido del grafo hasta cinco niveles.
- Recomendador de productos basado en coincidencias y propagación de pesos.
- Explicaciones legibles para cada producto recomendado.
- Registro secuencial de decisiones y evidencias.
- Sesiones consultables para auditar recomendaciones.
- Seed inicial para cafeterías, regalos, profesores y fin de curso.
- Script PowerShell de prueba del Knowledge Engine.

## 0.6.0

- Proyecto completo unificado.
- API REST del catálogo.
- Prisma 7 con PostgreSQL.

## 0.71.2-pr001

- Añadido contrato central `CommercialContext`.
- Añadido `ContextPatch` común y merger validado.
- Unificados los esquemas de contexto de Sales Brain y Rai Commercial.
- Eliminada la duplicación de aplicación de parches entre Sales Brain y Rai Runtime.
- Añadidos tests de regresión para contexto comercial.
