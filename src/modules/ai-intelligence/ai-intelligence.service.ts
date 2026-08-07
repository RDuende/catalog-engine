import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { SmartCatalogService } from "../smart-catalog/smart-catalog.service.js";
import { detectCanonicalGiftInterests } from "../interest-brain/index.js";
import { JourneyProject } from "../journey-domain/index.js";
import { buildGiftModel, decideJourney } from "../journey-model/index.js";
import type { SmartCatalogContext } from "../smart-catalog/smart-catalog.types.js";
import type { AiLabScenario, IntelligenceStage, IntelligenceTrace } from "./ai-intelligence.types.js";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

const INTEREST_TERMS: Readonly<Record<string, readonly string[]>> = {
  football: ["futbol", "balon", "equipo", "liga", "portero"],
  nautical: ["barco", "barcos", "mar", "nautico", "vela"],
  music: ["musica", "guitarra", "piano", "concierto"],
  gaming: ["gaming", "videojuego", "consola", "gamer"],
  travel: ["viaje", "viajar", "turismo", "aventura"],
  cooking: ["cocina", "cocinar", "chef", "gastronomia"],
};

function inferInterests(message: string, explicit: readonly string[] | undefined): readonly string[] {
  const result = new Set((explicit ?? []).map((item) => item.trim()).filter(Boolean));
  const text = normalize(message);
  for (const [id, terms] of Object.entries(INTEREST_TERMS)) {
    if (terms.some((term) => text.includes(term))) result.add(id === "football" ? "fútbol" : id);
  }
  return [...result];
}

function inferOccasion(message: string, explicit?: string): string | undefined {
  if (explicit?.trim()) return explicit.trim();
  const text = normalize(message);
  const options: readonly [string, readonly string[]][] = [
    ["wedding", ["boda", "casamiento"]],
    ["birthday", ["cumpleanos", "cumple"]],
    ["anniversary", ["aniversario"]],
    ["retirement", ["jubilacion"]],
    ["communion", ["comunion"]],
  ];
  return options.find(([, terms]) => terms.some((term) => text.includes(term)))?.[0];
}

export class AiIntelligenceService {
  constructor(
    private readonly smartCatalog: SmartCatalogService,
    private readonly storagePath = process.env.INTELLIGENCE_TRACE_PATH ?? ".data/intelligence-traces.json",
  ) {}

  private async readTraces(): Promise<readonly IntelligenceTrace[]> {
    try {
      const parsed = JSON.parse(await readFile(this.storagePath, "utf8")) as unknown;
      return Array.isArray(parsed) ? parsed as IntelligenceTrace[] : [];
    } catch { return []; }
  }

  private async saveTrace(trace: IntelligenceTrace): Promise<void> {
    const current = await this.readTraces();
    const next = [trace, ...current].slice(0, 250);
    await mkdir(dirname(this.storagePath), { recursive: true });
    const temp = `${this.storagePath}.tmp`;
    await writeFile(temp, JSON.stringify(next, null, 2), "utf8");
    await rename(temp, this.storagePath);
  }

  async run(scenario: AiLabScenario): Promise<IntelligenceTrace> {
    const started = Date.now();
    const stages: IntelligenceStage[] = [];
    const message = scenario.message?.trim() ?? "";

    let stageStart = Date.now();
    const legacyInterests = inferInterests(
      message,
      scenario.interests,
    );
    const interests = detectCanonicalGiftInterests(
      message,
      legacyInterests,
    );
    const occasion = inferOccasion(message, scenario.occasion);
    const giftProfile = Object.freeze({
      recipient: scenario.recipient?.trim() || undefined,
      age: scenario.age,
      occasion,
      budget: scenario.budget,
      interests,
      emotionalGoals: scenario.emotionalGoals ?? [],
      visualStyle: scenario.visualStyle,
      sourceMessage: message,
    });
    stages.push({ id: "gift-profile", label: "Construcción del Gift Profile", status: "COMPLETED", durationMs: Date.now() - stageStart, summary: `${interests.length} intereses y ${occasion ? "ocasión detectada" : "ocasión pendiente"}.`, input: scenario, output: giftProfile });

    stageStart = Date.now();
    let journey = JourneyProject.create({ type: "GIFT" });
    if (scenario.recipient?.trim()) journey = journey.setFact({ key: "recipient.relationship", value: scenario.recipient.trim(), confidence: 0.9, source: "SYSTEM" });
    if (scenario.age !== undefined) journey = journey.setFact({ key: "recipient.age", value: scenario.age, confidence: 1, source: "SYSTEM" });
    if (occasion) journey = journey.setFact({ key: "occasion.type", value: occasion, confidence: 1, source: "SYSTEM" });
    if (scenario.budget !== undefined) journey = journey.setFact({ key: "budget.max", value: scenario.budget, confidence: 1, source: "SYSTEM" });
    if (interests.length > 0) journey = journey.setFact({ key: "recipient.interests", value: interests, confidence: 0.95, source: "SYSTEM" });
    const journeyModel = buildGiftModel(journey.snapshot());
    const journeyDecision = decideJourney(journey.snapshot());
    stages.push({ id: "journey-intelligence", label: "Journey Intelligence", status: journeyModel.readiness.ready ? "COMPLETED" : "WARNING", durationMs: Date.now() - stageStart, summary: `Calidad ${journeyModel.quality.score}% · readiness ${journeyModel.readiness.level}.`, input: giftProfile, output: { giftModel: journeyModel, decision: journeyDecision } });

    stageStart = Date.now();
    const context: SmartCatalogContext = {
      interests,
      budget: scenario.budget,
      recipientAge: scenario.age,
      emotionalGoals: scenario.emotionalGoals,
      ...(scenario.visualStyle ? { visualStyle: scenario.visualStyle as SmartCatalogContext["visualStyle"] } : {}),
    };
    stages.push({ id: "query", label: "Contexto del recomendador", status: interests.length > 0 ? "COMPLETED" : "WARNING", durationMs: Date.now() - stageStart, summary: interests.length > 0 ? `Consulta centrada en ${interests.join(", ")}.` : "No se detectaron intereses; el ranking será más general.", input: giftProfile, output: context });

    stageStart = Date.now();
    const catalogDiagnostics =
      await this.smartCatalog.diagnose(
        context,
        scenario.limit ?? 12,
        60,
      );
    const recommendations =
      catalogDiagnostics.recommendations;
    stages.push({
      id: "catalog",
      label: "Búsqueda y ranking de catálogo",
      status:
        recommendations.length > 0
          ? "COMPLETED"
          : "WARNING",
      durationMs: Date.now() - stageStart,
      summary:
        `${catalogDiagnostics.catalogSize} productos totales · ` +
        `${catalogDiagnostics.scopedCount} examinados · ` +
        `${catalogDiagnostics.affinityCount} con afinidad · ` +
        `${recommendations.length} seleccionados.`,
      input: context,
      output: catalogDiagnostics,
    });

    stageStart = Date.now();
    const proposalSeeds = recommendations.slice(0, 3).map((item, index) => ({
      position: index + 1,
      productId: item.product.id,
      title: item.product.name,
      score: item.score,
      role: item.product.productBrain?.giftRoles?.[0] ?? item.product.brain?.giftRoles?.[0] ?? "UNDEFINED",
      reasons: item.reasons,
      warnings: item.warnings,
    }));
    stages.push({ id: "proposal-seeds", label: "Semillas de propuesta", status: proposalSeeds.length > 0 ? "COMPLETED" : "SKIPPED", durationMs: Date.now() - stageStart, summary: proposalSeeds.length > 0 ? `${proposalSeeds.length} semillas listas para el motor creativo.` : "No hay productos suficientes para construir propuestas.", input: recommendations.slice(0, 3), output: proposalSeeds });

    const trace: IntelligenceTrace = Object.freeze({
      id: randomUUID(), createdAt: new Date().toISOString(), scenario, giftProfile,
      recommendations, stages,
      totals: { durationMs: Date.now() - started, recommendations: recommendations.length, warnings: stages.filter((item) => item.status === "WARNING").length },
    });
    await this.saveTrace(trace);
    return trace;
  }

  async list(limit = 50): Promise<readonly IntelligenceTrace[]> { return (await this.readTraces()).slice(0, Math.max(1, Math.min(limit, 250))); }
  async get(id: string): Promise<IntelligenceTrace | undefined> { return (await this.readTraces()).find((trace) => trace.id === id); }
}
