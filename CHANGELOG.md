# 0.24.1

- Corrige la subida de fotografías que Fastify rechazaba por superar el límite JSON predeterminado de 1 MiB.
- Añade validación de formato y tamaño en el navegador.
- Mejora la compatibilidad y diagnóstico de OpenAI Images.

# v0.22.1

- Corrige las consultas Prisma de Rai Agent para las relaciones de medios (`ProductMedia.media`).
- Restaura la inferencia tipada de `prices`, `categories`, `occasions`, `audiences` y `customizations`.
- Corrige la lectura de URL y tipo de imágenes desde `MediaAsset`.

# v0.21.4 — Respuestas cortas de personalización

- Rai entiende respuestas como «foto», «una foto», «una fotografía», «una imagen», «su nombre», «una dedicatoria», «una frase» y «las tres».
- Las respuestas cortas se interpretan usando la pregunta pendiente de personalización.
- Se conserva correctamente el destinatario, la edad, la ocasión y el presupuesto al completar la conversación.
- Añadidas pruebas de regresión para el caso «graduación de mi padre de 70 años → 50 € → una foto».

# Changelog

## 0.21.3

- Corrige el test de graduación para usar el valor canónico interno `graduacion`.
- Mantiene la presentación con tildes separada de los valores normalizados del motor.
- Separa pruebas críticas y funcionales en el instalador.
- Los fallos funcionales generan advertencias sin abortar una instalación técnicamente válida.
- Todos los comandos se ejecutan dentro de `C:\catalog-engine`; no se crean `src` ni `node_modules` en la carpeta del instalador.

## 0.21.1 — Conversación inteligente

- Detecta relaciones como hija, hijo, hermana, amigo y entrenador.
- Extrae la edad del destinatario y su segmento de edad.
- Comprende respuestas cortas como «mi hija».
- Evita repetir preguntas ya resueltas.
- Agrupa ocasión, presupuesto y personalización en una pregunta natural.
- Añade pruebas de regresión para el flujo observado en Rai Playground.

# Changelog

## 0.20.2 - Personalization extraction hotfix

- Corrige la detección de personalización en frases naturales como `quiero que lleve una foto`, `que incluya fotos`, `poner el nombre` y `quiero una dedicatoria`.
- Mantiene la precedencia de las negaciones explícitas, por ejemplo `sin personalizar`.
- Añade pruebas de regresión para foto, fotografías, nombres, logotipos, textos, mensajes y dedicatorias.
- Conserva la API y el esquema de base de datos sin cambios.

## 0.20.1 - Conversation memory and budget extraction hotfix

- Corrige la extracción de presupuestos en expresiones naturales como `tengo 30 euros`, `unos 30 €`, `puedo gastar 30 euros` y cantidades monetarias aisladas.
- Añade soporte para `como máximo`, `al menos` y rangos `entre X y Y`.
- Refuerza la memoria incremental para conservar destinatario, ocasión, presupuesto y personalización entre turnos.
- Añade pruebas de conversaciones de varios turnos y de corrección explícita del presupuesto.
- Mantiene la API y el esquema de base de datos sin cambios.

## 0.20.0 - Rai Intelligence Platform

- Añade Conversation Engine con sesiones, historial y fusión incremental de intención.
- Detecta la información que falta y formula una sola pregunta de seguimiento.
- Añade Creativity Engine con ideas emotivas, elegantes, divertidas, originales y prácticas.
- Genera explicaciones, productos asociados, presupuesto orientativo y prompts visuales.
- Añade `POST /api/v1/rai/converse`.
- Integra conversación, intención, soluciones, recomendaciones y razonamiento.
- Añade pruebas para conversación y creatividad.
- No requiere migraciones de Prisma.

## 0.19.0 - Reasoning Engine

- Añade `src/core/reasoning` con motor, restricciones, evidencias y trazas auditables.
- Evalúa presupuesto, personalización, cantidad y prioridad de entrega.
- Descarta candidatos que incumplen restricciones obligatorias.
- Calcula una puntuación razonada y genera explicaciones estructuradas.
- Integra la traza de razonamiento en `POST /api/v1/intent/recommend`.
- Añade pruebas específicas del Reasoning Engine.
- No requiere migraciones de Prisma.

## 0.17.5 - Foundation

- Añadido Product DNA con confianza, procedencia, versión, builder y validador.
- Añadido Capability Engine para registrar y consultar capacidades por producto.
- Añadido Solution Engine para convertir intención en soluciones comerciales puntuadas.
- Añadido Recipe Engine con recetas versionadas y planificación de operaciones.
- Añadidas pruebas unitarias y documentación de la release.
- Se mantienen compatibles las APIs y motores existentes.

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

## 0.20.2 - Personalization extraction hotfix

- Corrige la detección de personalización en frases naturales como `quiero que lleve una foto`, `que incluya fotos`, `poner el nombre` y `quiero una dedicatoria`.
- Mantiene la precedencia de las negaciones explícitas, por ejemplo `sin personalizar`.
- Añade pruebas de regresión para foto, fotografías, nombres, logotipos, textos, mensajes y dedicatorias.
- Conserva la API y el esquema de base de datos sin cambios.

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

## 0.17.6 - Solution-aware recommendations

- Integra `SolutionEngine` en el flujo real de `/api/v1/intent/recommend`.
- Añade `SolutionRecommendationOrchestrator`.
- Añade catálogo inicial de soluciones comerciales de RecuerdArte.
- Devuelve solución principal, alternativas, motivos y capacidades requeridas.
- Enriquece la consulta enviada al motor de productos con el contexto de la solución.
- Añade `solutionLimit` al contrato de la API.
- Mantiene compatibilidad con la respuesta anterior.

## 0.18.0 - Knowledge Graph V2

- Añade pesos y confianza independientes en relaciones.
- Añade procedencia y versionado en entidades, relaciones y snapshots.
- Amplía las relaciones tipadas para razonamiento comercial y productivo.
- Añade recorridos ponderados con filtros de profundidad, dirección y tipo.
- Añade explicaciones auditables de los caminos del grafo.
- Añade confianza mínima a las consultas de productos.
- Mantiene compatibilidad con snapshots anteriores y no requiere migración de base de datos.


## 0.18.1 - Strict TypeScript and installer hotfix

- Corrige los accesos por índice no comprobados en las pruebas de Knowledge Graph V2.
- Corrige `KnowledgeGraph.explainPath()` para funcionar con `noUncheckedIndexedAccess`.
- Corrige el instalador de Windows para fusionar el contenido de `src` sin crear `src\src`.
- Repara automáticamente una carpeta `src\src` creada por la instalación 0.18.0.
- El instalador comprueba el código de salida de cada comando npm y se detiene ante cualquier error.
- Mantiene el proyecto en TypeScript estricto sin desactivar comprobaciones.

## 0.18.2 - Solution scoring regression fix

- Corrige la expectativa obsoleta del test de `SolutionEngine`: el desglose real es 40 puntos por destinatario, 35 por ocasión, 10 por emoción coincidente y 2 por prioridad, total 87.
- Añade aserciones sobre los motivos de puntuación para evitar que futuros cambios pasen inadvertidos.
- Mantiene intacto el algoritmo de puntuación, ya que el resultado 87 era el comportamiento correcto y documentado por el código.
- Conserva las correcciones de TypeScript estricto y del instalador introducidas en 0.18.1.

## 0.21.2

- Corrige la detección de la ocasión "graduación".
- Corrige frases de personalización como "sí quiero añadir una foto".
- Añade una prueba de regresión para fusionar destinatario, edad, graduación, 50 € y fotografía.
- Sustituye el instalador autocontenido por un instalador con payload dirigido a C:\catalog-engine.
- Evita crear `src` y `node_modules` en la carpeta desde la que se ejecuta el instalador.

## 0.22.0 - Rai Agent

- Sustituye el guion conversacional por un agente LLM conectado a OpenAI Responses API.
- Rai mantiene la conversación mediante `previous_response_id`.
- Añade herramientas de catálogo sobre PostgreSQL: `buscar_productos`, `obtener_producto` y `estadisticas_catalogo`.
- Las recomendaciones solo pueden usar productos reales devueltos por la base de datos.
- Añade configuración `OPENAI_API_KEY` y `OPENAI_MODEL`.
- El Playground muestra modelo y herramientas consultadas en cada turno.

## 0.22.3 - Rai de baja latencia
- Sustituye el bucle de hasta tres llamadas a OpenAI por una sola llamada por mensaje.
- PostgreSQL recupera previamente hasta ocho productos candidatos con una única consulta.
- El contexto reciente de la sesión se reutiliza para búsquedas posteriores.
- Limita la respuesta y reduce el esfuerzo de razonamiento para mejorar la latencia.
- El inspector identifica la estrategia `single_model_call` y conserva el tiempo de búsqueda.
