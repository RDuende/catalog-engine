# Changelog

## 0.13.0

- Añade Ontology Engine y Knowledge Loader al pipeline canónico.
- Añade Product DNA con memoria, emoción, personalización, sostenibilidad y versatilidad.
- Infere técnicas compatibles a partir de productos y materiales.
- Enriquece el Knowledge Graph con ocasiones, públicos, emociones y usos.
- La CLI incluye la salida `enriched`.
- Añade pruebas del enriquecimiento y regresión del grafo.

## 0.11.0

- Added Knowledge Graph Core with entity deduplication.
- Added category and typed attribute relations.
- Added graph querying by category, attributes, validity and price.
- Added compileKnowledgeBlocks and graph output in catalog:compile.
- Added Knowledge Graph regression tests.

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

## [0.12.0] - 2026-07-26

### Added
- Canonical Product Layer (`CanonicalCatalog`, `CanonicalProduct` y `CanonicalProductBuilder`).
- Normalización de SKU, nombres, categorías, materiales, técnicas, dimensiones y etiquetas.
- Trazabilidad completa desde el producto canónico hasta el documento y producto semántico de origen.
- Validación canónica con diagnósticos propios.
- Nuevo método `compileCanonicalBlocks`.
- Salida `canonical` en `catalog:compile`.
- Tests unitarios del constructor canónico.

### Changed
- Knowledge Graph ahora consume exclusivamente `CanonicalCatalog`.
- Actualizada la identidad del producto a RecuerdArte.
- Versión del proyecto actualizada a 0.12.0.
