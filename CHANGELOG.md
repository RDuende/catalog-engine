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

## 0.9.0 - Core Foundation
- Document Model, Pipeline Engine, Lexer, Syntax AST, Parser, Visitors y métricas.
- CLI `catalog:compile` y pruebas del compilador.
- ADR-001 y RFC-001.

### Core lexer/parser contract refactor

- Added canonical `CatalogTokenTypes` values shared by lexer and parser.
- Added an exhaustive `DocumentBlockType` → `CatalogTokenType` translation table.
- Removed the unsafe `element.kind as CatalogTokenType` cast.
- Added regression coverage for all block-to-token mappings.


## 0.10.0 - Semantic Analyzer

- Añadido modelo semántico de catálogo y producto.
- Normalización de referencias, etiquetas y precios en EUR (minor units).
- Validación de identidad mínima del producto: referencia y nombre.
- Diagnósticos semánticos, estadísticas y herencia de categoría.
- Nuevo pipeline `compileSemanticBlocks`.
- `catalog:compile` incluye la salida semántica.
