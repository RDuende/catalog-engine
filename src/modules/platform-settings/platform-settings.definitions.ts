import type { SettingDefinition } from "./platform-settings.types.js";

export const PLATFORM_SETTING_DEFINITIONS: readonly SettingDefinition[] = Object.freeze([
  { key:"platform.name", category:"General", label:"Nombre de plataforma", description:"Nombre visible en la administración y comunicaciones internas.", kind:"text", defaultValue:"RecuerdArte" },
  { key:"platform.environment", category:"General", label:"Entorno", description:"Entorno operativo actual.", kind:"select", options:["development","staging","production"], defaultValue:"development", restartRequired:true },
  { key:"platform.locale", category:"General", label:"Idioma principal", description:"Idioma por defecto de Rai y la plataforma.", kind:"select", options:["es-ES","en-GB","en-US"], defaultValue:"es-ES" },
  { key:"platform.currency", category:"General", label:"Moneda", description:"Moneda principal para presupuestos y recomendaciones.", kind:"select", options:["EUR","USD","GBP"], defaultValue:"EUR" },
  { key:"platform.timezone", category:"General", label:"Zona horaria", description:"Zona horaria operativa de la plataforma.", kind:"text", defaultValue:"Europe/Madrid", restartRequired:true },
  { key:"platform.settingsProvider", category:"General", label:"Proveedor de settings", description:"LOCAL ahora; RDGEST cuando la administración se integre en RDuendeGest.", kind:"select", options:["LOCAL","RDGEST"], defaultValue:"LOCAL", restartRequired:true },

  { key:"rai.discovery.provider", category:"Rai y conversación", label:"Proveedor conversacional", description:"Motor usado durante la fase de descubrimiento.", kind:"select", options:["local","openai"], defaultValue:"openai" },
  { key:"rai.discovery.model", category:"Rai y conversación", label:"Modelo conversacional", description:"Modelo de OpenAI utilizado por Rai.", kind:"text", defaultValue:"gpt-5-mini" },
  { key:"rai.discovery.maxHistoryMessages", category:"Rai y conversación", label:"Mensajes de contexto", description:"Número máximo de mensajes recientes enviados al conversador.", kind:"number", defaultValue:30, min:4, max:200 },
  { key:"rai.discovery.temperature", category:"Rai y conversación", label:"Creatividad conversacional", description:"Nivel de variación en las respuestas de Rai.", kind:"number", defaultValue:0.5, min:0, max:2 },
  { key:"rai.proposals.minimumFacts", category:"Rai y conversación", label:"Datos mínimos sugeridos", description:"Número orientativo de datos antes de destacar Hacer propuestas. El botón sigue disponible.", kind:"number", defaultValue:3, min:0, max:20 },
  { key:"rai.proposals.count", category:"Rai y conversación", label:"Número de propuestas", description:"Cantidad de propuestas creativas generadas por defecto.", kind:"number", defaultValue:3, min:1, max:10 },
  { key:"rai.session.persistenceDays", category:"Rai y conversación", label:"Persistencia de sesiones", description:"Días que una conversación puede recuperarse sin reiniciarse.", kind:"number", defaultValue:30, min:1, max:365 },

  { key:"openai.apiKey", category:"OpenAI", label:"API key", description:"Clave de OpenAI. Se devuelve enmascarada y dejarla vacía conserva la existente.", kind:"password", defaultValue:"", sensitive:true, restartRequired:true },
  { key:"openai.organization", category:"OpenAI", label:"Organization ID", description:"Identificador de organización opcional.", kind:"text", defaultValue:"", sensitive:true, restartRequired:true },
  { key:"openai.project", category:"OpenAI", label:"Project ID", description:"Proyecto de OpenAI asociado al consumo.", kind:"text", defaultValue:"", sensitive:true, restartRequired:true },
  { key:"openai.timeoutMs", category:"OpenAI", label:"Timeout API", description:"Tiempo máximo de espera por petición.", kind:"number", defaultValue:120000, min:5000, max:600000 },

  { key:"image.provider", category:"Generación visual", label:"Proveedor de imágenes", description:"Proveedor de generación visual.", kind:"select", options:["openai","mock"], defaultValue:"openai" },
  { key:"image.model", category:"Generación visual", label:"Modelo de imagen", description:"Modelo usado para crear imágenes personalizadas.", kind:"text", defaultValue:"gpt-image-1" },
  { key:"image.defaultSize", category:"Generación visual", label:"Tamaño por defecto", description:"Resolución solicitada por defecto.", kind:"select", options:["1024x1024","1536x1024","1024x1536"], defaultValue:"1024x1024" },
  { key:"image.maxConcurrentTasks", category:"Generación visual", label:"Tareas simultáneas", description:"Número máximo de generaciones en paralelo.", kind:"number", defaultValue:2, min:1, max:20 },
  { key:"image.taskPollMs", category:"Generación visual", label:"Consulta de progreso", description:"Intervalo de consulta del estado de generación.", kind:"number", defaultValue:1500, min:250, max:30000 },

  { key:"catalog.primaryProvider", category:"Catálogo", label:"Proveedor principal", description:"Proveedor prioritario al importar y recomendar.", kind:"text", defaultValue:"makito" },
  { key:"catalog.demoFallbackEnabled", category:"Catálogo", label:"Fallback de demostración", description:"Permite usar productos demo cuando el catálogo canónico no responde.", kind:"boolean", defaultValue:false },
  { key:"catalog.recommendationLimit", category:"Catálogo", label:"Resultados del recomendador", description:"Número máximo de productos candidatos por consulta.", kind:"number", defaultValue:30, min:3, max:200 },
  { key:"catalog.requireInterestAffinity", category:"Catálogo", label:"Exigir afinidad temática", description:"Descarta productos no relacionados cuando el usuario indica intereses, salvo soportes universales personalizables.", kind:"boolean", defaultValue:true },
  { key:"catalog.universalPersonalizableEnabled", category:"Catálogo", label:"Soportes universales", description:"Permite camisetas, tazas, botellas, lienzos y similares como soportes adaptables.", kind:"boolean", defaultValue:true },
  { key:"catalog.minimumBrainConfidence", category:"Catálogo", label:"Confianza mínima Product Brain", description:"Umbral para considerar una clasificación lista sin revisión.", kind:"number", defaultValue:0.75, min:0, max:1 },

  { key:"productBrain.enabled", category:"Product Brain", label:"Clasificación automática", description:"Clasifica productos durante la importación.", kind:"boolean", defaultValue:true },
  { key:"productBrain.forceOnImport", category:"Product Brain", label:"Forzar reclasificación", description:"Recalcula perfiles incluso si ya existe una versión actual.", kind:"boolean", defaultValue:false },
  { key:"productBrain.ruleVersion", category:"Product Brain", label:"Versión de reglas", description:"Identificador de la taxonomía y reglas activas.", kind:"text", defaultValue:"product-brain-rules-v3-primary-object-whole-word" },
  { key:"productBrain.aiEnrichmentEnabled", category:"Product Brain", label:"Enriquecimiento con IA", description:"Completa clasificaciones ambiguas usando IA estructurada.", kind:"boolean", defaultValue:false },

  { key:"import.defaultLimit", category:"Importaciones", label:"Límite por defecto", description:"Máximo de productos por ejecución.", kind:"number", defaultValue:100000, min:1, max:1000000 },
  { key:"import.batchSize", category:"Importaciones", label:"Tamaño de lote", description:"Productos procesados por lote.", kind:"number", defaultValue:100, min:1, max:5000 },
  { key:"import.mediaConcurrency", category:"Importaciones", label:"Concurrencia de imágenes", description:"Descargas simultáneas de imágenes.", kind:"number", defaultValue:4, min:1, max:32 },
  { key:"import.retryCount", category:"Importaciones", label:"Reintentos", description:"Reintentos ante errores temporales.", kind:"number", defaultValue:3, min:0, max:20 },
  { key:"import.markMissingInactive", category:"Importaciones", label:"Desactivar ausentes", description:"Marca inactivos productos que desaparecen del proveedor tras una importación completa.", kind:"boolean", defaultValue:true },
  { key:"import.createSnapshot", category:"Importaciones", label:"Crear snapshot", description:"Crea una instantánea antes de aplicar cambios.", kind:"boolean", defaultValue:true },
  { key:"import.resumeEnabled", category:"Importaciones", label:"Pausa y reanudación", description:"Conserva trabajos y checkpoints para continuar procesos interrumpidos.", kind:"boolean", defaultValue:true },

  { key:"media.storageRoot", category:"Medios", label:"Carpeta de medios", description:"Ruta local donde se almacenan imágenes de catálogo.", kind:"text", defaultValue:".data/catalog-media", restartRequired:true },
  { key:"media.downloadOnImport", category:"Medios", label:"Descargar al importar", description:"Descarga autenticadamente las imágenes durante el pipeline.", kind:"boolean", defaultValue:true },
  { key:"media.generateThumbnails", category:"Medios", label:"Generar miniaturas", description:"Crea versiones optimizadas para administración y recomendaciones.", kind:"boolean", defaultValue:true },
  { key:"media.thumbnailWidth", category:"Medios", label:"Ancho de miniatura", description:"Ancho máximo de miniaturas en píxeles.", kind:"number", defaultValue:320, min:64, max:2048 },
  { key:"media.preserveProviderUrl", category:"Medios", label:"Conservar URL original", description:"Guarda la URL del proveedor en metadata para trazabilidad.", kind:"boolean", defaultValue:true },

  { key:"makito.baseUrl", category:"Proveedor Makito", label:"URL API", description:"URL base de la API de Makito.", kind:"text", defaultValue:"https://apis.makito.es", restartRequired:true },
  { key:"makito.username", category:"Proveedor Makito", label:"Usuario", description:"Usuario de acceso al catálogo Makito.", kind:"text", defaultValue:"", sensitive:true, restartRequired:true },
  { key:"makito.password", category:"Proveedor Makito", label:"Contraseña", description:"Contraseña de acceso a Makito.", kind:"password", defaultValue:"", sensitive:true, restartRequired:true },
  { key:"makito.timeoutMs", category:"Proveedor Makito", label:"Timeout", description:"Tiempo máximo para peticiones al proveedor.", kind:"number", defaultValue:120000, min:5000, max:600000 },

  { key:"storage.jobsRoot", category:"Almacenamiento", label:"Carpeta de trabajos", description:"Persistencia de importaciones y tareas reanudables.", kind:"text", defaultValue:"storage/jobs", restartRequired:true },
  { key:"storage.artifactsRoot", category:"Almacenamiento", label:"Carpeta de artefactos", description:"Almacenamiento local de imágenes, briefs y presentaciones.", kind:"text", defaultValue:".data/artifacts", restartRequired:true },
  { key:"storage.retentionDays", category:"Almacenamiento", label:"Retención de temporales", description:"Días antes de limpiar archivos temporales no referenciados.", kind:"number", defaultValue:30, min:1, max:3650 },

  { key:"rdgest.integrationEnabled", category:"Integración RDgest", label:"Integración habilitada", description:"Preparado para trasladar la administración central a RDgest.", kind:"boolean", defaultValue:false },
  { key:"rdgest.baseUrl", category:"Integración RDgest", label:"URL de RDgest", description:"Endpoint base futuro para configuración y administración centralizada.", kind:"text", defaultValue:"", restartRequired:true },
  { key:"rdgest.apiToken", category:"Integración RDgest", label:"Token RDgest", description:"Token para sincronización futura con RDgest.", kind:"password", defaultValue:"", sensitive:true, restartRequired:true },
  { key:"rdgest.syncSettings", category:"Integración RDgest", label:"Sincronizar settings", description:"Cuando esté activo, RDgest será la autoridad para estas variables.", kind:"boolean", defaultValue:false, restartRequired:true },
]);
