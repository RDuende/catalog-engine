# Changelog

## [0.16.0] - 2026-07-26

### Added
- API REST de análisis de intención en `POST /api/v1/intent/analyze`.
- Flujo integrado intención + recomendación en `POST /api/v1/intent/recommend`.
- Endpoint `GET /version` y versión incluida en `/health`.
- Playground web actualizado para visualizar intención, criterios y ranking.
- Adaptador probado entre el Intent Engine y el servicio persistente de recomendaciones.

## 0.15.0

- Añade Intent Engine determinista para interpretar consultas en español.
- Extrae destinatarios, ocasiones, materiales, técnicas, emociones y usos.
- Interpreta presupuestos máximos, mínimos y rangos en euros, además de cantidad, urgencia y personalización.
- Resuelve sinónimos frecuentes como `profe`, `maestro` y `seño`.
- Convierte la intención en `RecommendationCriteria` sin acoplar ambos motores.
- Añade `npm test`, `npm run test:intent` y pruebas unitarias del nuevo módulo.

## 0.14.0

- Añade Recommendation Engine puro sobre `KnowledgeGraphSnapshot`.
- Incorpora filtros estrictos por validez, presupuesto, confianza y personalización.
- Añade scoring ponderado por texto, categorías, atributos, presupuesto, confianza y Product DNA.
- Devuelve ranking, desglose de puntuación, evidencias y explicaciones legibles.
- Permite pesos configurables, puntuación mínima y límite de resultados.
- Añade pruebas unitarias y exportación pública desde `src/core`.

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
