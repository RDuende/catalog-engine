import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { analyzePdfCatalog, type PdfBounds } from "./pdf-catalog-analyzer.js";

interface StoredDocument {
  id: string;
  supplier: string;
  fileName: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: "uploaded" | "analyzing" | "review" | "completed" | "failed";
  mode: "automatic" | "review" | "learning";
  createdAt: string;
  productsDetected: number;
  confidence: number | null;
}

interface WorkbenchEvidence {
  id: string;
  page: number;
  kind: "text" | "table" | "icon" | "rule" | "human";
  value: string;
  confidence: number;
  bounds?: PdfBounds;
}

interface WorkbenchField {
  value: string;
  confidence: number;
  evidence: WorkbenchEvidence[];
}

interface WorkbenchProduct {
  id: string;
  page: number;
  reference: WorkbenchField;
  name: WorkbenchField;
  category: WorkbenchField;
  material: WorkbenchField;
  dimensions: WorkbenchField;
  features: string[];
  prices: Array<{ quantity: number; price: number }>;
  confidence: number;
  reviewStatus: "pending" | "approved" | "corrected";
  bounds?: PdfBounds;
}

interface WorkbenchAnalysis {
  engineVersion: string;
  documentId: string;
  generatedAt: string;
  pages: number;
  blocks?: number;
  products: WorkbenchProduct[];
}

const publicDir = path.join(process.cwd(), "src", "modules", "import-workbench", "public");
const dataDir = path.join(process.cwd(), "data", "document-imports");
const metadataFile = path.join(dataDir, "documents.json");

async function ensureDataDir(): Promise<void> { await mkdir(dataDir, { recursive: true }); }
async function readDocuments(): Promise<StoredDocument[]> {
  await ensureDataDir();
  try {
    const parsed: unknown = JSON.parse(await readFile(metadataFile, "utf8"));
    return Array.isArray(parsed) ? parsed as StoredDocument[] : [];
  } catch { return []; }
}
async function saveDocuments(documents: StoredDocument[]): Promise<void> {
  await ensureDataDir();
  await writeFile(metadataFile, JSON.stringify(documents, null, 2), "utf8");
}
async function serve(reply: FastifyReply, fileName: string, contentType: string) {
  return reply.header("Cache-Control", "no-store, max-age=0").type(contentType).send(await readFile(path.join(publicDir, fileName)));
}
async function findStoredFile(document: StoredDocument): Promise<string | undefined> {
  const entries = await readdir(dataDir);
  return entries.map((name) => path.join(dataDir, name)).find((entry) => path.basename(entry).startsWith(`${document.id}.`));
}
function analysisFile(id: string): string { return path.join(dataDir, `${id}.analysis.json`); }
async function readAnalysis(id: string): Promise<WorkbenchAnalysis | null> {
  try {
    const analysis = JSON.parse(await readFile(analysisFile(id), "utf8")) as Partial<WorkbenchAnalysis>;
    if (analysis.engineVersion !== "0.40.3" || !Array.isArray(analysis.products)) return null;
    return analysis as WorkbenchAnalysis;
  } catch { return null; }
}
async function saveAnalysis(analysis: WorkbenchAnalysis): Promise<void> {
  await writeFile(analysisFile(analysis.documentId), JSON.stringify(analysis, null, 2), "utf8");
}
function evidence(page: number, kind: WorkbenchEvidence["kind"], value: string, confidence: number): WorkbenchEvidence {
  return { id: randomUUID(), page, kind, value, confidence };
}
export const importWorkbenchRoutes: FastifyPluginAsync = async (app) => {
  app.addContentTypeParser(
    ["application/pdf", "application/octet-stream", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    { parseAs: "buffer", bodyLimit: 100 * 1024 * 1024 },
    (_request, body, done) => done(null, body),
  );

  app.get("/imports", async (_request, reply) => serve(reply, "index.html", "text/html; charset=utf-8"));
  app.get("/imports/workbench", async (_request, reply) => serve(reply, "workbench.html", "text/html; charset=utf-8"));
  app.get("/imports/app.js", async (_request, reply) => serve(reply, "app.js", "application/javascript; charset=utf-8"));
  app.get("/imports/workbench.js", async (_request, reply) => serve(reply, "workbench.js", "application/javascript; charset=utf-8"));
  app.get("/imports/styles.css", async (_request, reply) => serve(reply, "styles.css", "text/css; charset=utf-8"));
  app.get("/imports/workbench.css", async (_request, reply) => serve(reply, "workbench.css", "text/css; charset=utf-8"));
  app.get("/imports/pdfjs/pdf.mjs", async (_request, reply) => reply.type("application/javascript").send(await readFile(path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.mjs"))));
  app.get("/imports/pdfjs/pdf.worker.mjs", async (_request, reply) => reply.type("application/javascript").send(await readFile(path.join(process.cwd(), "node_modules", "pdfjs-dist", "build", "pdf.worker.mjs"))));

  app.get("/api/v1/import-workbench/documents", async () => ({ documents: (await readDocuments()).sort((a,b) => b.createdAt.localeCompare(a.createdAt)) }));
  app.get("/api/v1/import-workbench/stats", async () => {
    const documents = await readDocuments();
    const values = documents.flatMap((document) => document.confidence === null ? [] : [document.confidence]);
    return { documents: documents.length, products: documents.reduce((t,d)=>t+d.productsDetected,0), pendingReview: documents.filter(d=>d.status==="review").length, averageConfidence: values.length ? values.reduce((a,b)=>a+b,0)/values.length : null };
  });

  app.post<{ Querystring: { supplier?: string; fileName?: string; mode?: StoredDocument["mode"] }; Body: Buffer }>("/api/v1/import-workbench/upload", async (request, reply) => {
    const body = request.body;
    if (!Buffer.isBuffer(body) || body.length === 0) return reply.code(400).send({ error: "EMPTY_FILE", message: "El archivo está vacío." });
    const supplier = (request.query.supplier ?? "unknown").trim() || "unknown";
    const fileName = path.basename((request.query.fileName ?? "catalog.pdf").trim() || "catalog.pdf");
    const mode = request.query.mode ?? "review";
    if (!( ["automatic","review","learning"] as const).includes(mode)) return reply.code(400).send({ error: "INVALID_MODE", message: "Modo no válido." });
    const sha256 = createHash("sha256").update(body).digest("hex");
    const documents = await readDocuments();
    const duplicate = documents.find(d=>d.sha256===sha256);
    if (duplicate) return reply.code(409).send({ error: "DUPLICATE_DOCUMENT", document: duplicate });
    const id = randomUUID(); const extension = path.extname(fileName) || ".bin";
    await ensureDataDir(); await writeFile(path.join(dataDir, `${id}${extension}`), body);
    const document: StoredDocument = { id, supplier, fileName, mimeType: request.headers["content-type"] ?? "application/octet-stream", size: body.length, sha256, status:"uploaded", mode, createdAt:new Date().toISOString(), productsDetected:0, confidence:null };
    documents.push(document); await saveDocuments(documents); return reply.code(201).send({ document });
  });

  app.get<{ Params: { id: string } }>("/api/v1/import-workbench/documents/:id/file", async (request, reply) => {
    const document = (await readDocuments()).find(d=>d.id===request.params.id);
    if (!document) return reply.code(404).send({ error: "DOCUMENT_NOT_FOUND" });
    const file = await findStoredFile(document);
    if (!file) return reply.code(404).send({ error: "FILE_NOT_FOUND" });
    return reply.type(document.mimeType || "application/octet-stream").header("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`).send(await readFile(file));
  });

  app.get<{ Params: { id: string } }>("/api/v1/import-workbench/documents/:id/analysis", async (request, reply) => {
    const document = (await readDocuments()).find(d=>d.id===request.params.id);
    if (!document) return reply.code(404).send({ error: "DOCUMENT_NOT_FOUND" });
    return { document, analysis: await readAnalysis(document.id) };
  });

  app.post<{ Params: { id: string } }>("/api/v1/import-workbench/documents/:id/analyze", async (request, reply) => {
    const documents = await readDocuments(); const document = documents.find(d=>d.id===request.params.id);
    if (!document) return reply.code(404).send({ error: "DOCUMENT_NOT_FOUND" });
    document.status = "analyzing"; await saveDocuments(documents);
    const file = await findStoredFile(document);
    if (!file) return reply.code(404).send({ error: "FILE_NOT_FOUND" });
    let analysis: WorkbenchAnalysis;
    try {
      const result = await analyzePdfCatalog(file);
      analysis = { engineVersion: "0.40.3", documentId: document.id, generatedAt: new Date().toISOString(), pages: result.pages, blocks: result.blocks, products: result.products };
    } catch (error) {
      document.status = "failed"; await saveDocuments(documents);
      request.log.error(error, "PDF analysis failed");
      return reply.code(500).send({ error: "PDF_ANALYSIS_FAILED", message: error instanceof Error ? error.message : "No se pudo analizar el PDF." });
    }
    await saveAnalysis(analysis);
    document.status = "review"; document.productsDetected = analysis.products.length;
    document.confidence = analysis.products.length ? analysis.products.reduce((a,p)=>a+p.confidence,0)/analysis.products.length : null;
    await saveDocuments(documents);
    return { document, analysis, message: `Análisis completado: ${analysis.products.length} productos en ${analysis.pages} páginas.` };
  });

  app.patch<{ Params: { id: string; productId: string }; Body: { field?: string; value?: string; approve?: boolean } }>("/api/v1/import-workbench/documents/:id/products/:productId", async (request, reply) => {
    const analysis = await readAnalysis(request.params.id);
    if (!analysis) return reply.code(404).send({ error: "ANALYSIS_NOT_FOUND" });
    const product = analysis.products.find(p=>p.id===request.params.productId);
    if (!product) return reply.code(404).send({ error: "PRODUCT_NOT_FOUND" });
    if (request.body.approve) product.reviewStatus = "approved";
    if (request.body.field && typeof request.body.value === "string") {
      const editable = ["reference","name","category","material","dimensions"] as const;
      if (!editable.includes(request.body.field as typeof editable[number])) return reply.code(400).send({ error: "INVALID_FIELD" });
      const key = request.body.field as typeof editable[number];
      product[key] = { value: request.body.value, confidence: 1, evidence: [evidence(product.page, "human", "Corrección humana", 1)] };
      product.reviewStatus = "corrected";
    }
    await saveAnalysis(analysis); return { product };
  });

  app.get("/api/v1/import-workbench/storage", async () => {
    await ensureDataDir(); const entries=await readdir(dataDir);
    return { directory:dataDir, files:await Promise.all(entries.map(async name=>({name,size:(await stat(path.join(dataDir,name))).size}))) };
  });
};
