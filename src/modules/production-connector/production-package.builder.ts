import type { PurchaseOrder } from "../purchase-experience/index.js";
import type {
  ProductionArtifactReference,
  ProductionLineContract,
  ProductionPackage,
} from "./production-connector.types.js";

function stringProperty(
  input: object,
  key: string,
): string | undefined {
  if (!(key in input)) return undefined;

  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim()
    ? value
    : undefined;
}

function stringArrayProperty(
  input: object,
  key: string,
): readonly string[] {
  if (!(key in input)) return Object.freeze([]);

  const value = (input as Record<string, unknown>)[key];
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze(
    value.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    ),
  );
}

function artifactRefs(
  line: PurchaseOrder["lines"][number],
): readonly ProductionArtifactReference[] {
  const result: ProductionArtifactReference[] = [];
  const seen = new Set<string>();

  const add = (
    artifactId: string | undefined,
    role: ProductionArtifactReference["role"],
  ) => {
    if (!artifactId || seen.has(artifactId)) return;
    seen.add(artifactId);
    result.push(Object.freeze({ artifactId, role }));
  };

  add(
    stringProperty(line, "purchaseIntentArtifactId"),
    "PURCHASE_INTENT",
  );

  add(
    line.presentationArtifactId,
    "PRESENTATION",
  );

  for (const artifactId of stringArrayProperty(
    line,
    "workspaceArtifactIds",
  )) {
    add(artifactId, "OTHER");
  }

  return Object.freeze(result);
}

export function buildProductionPackage(
  order: PurchaseOrder,
  metadata: Readonly<Record<string, string>> = {},
): ProductionPackage {
  const lines = order.lines.map(
    (line): ProductionLineContract =>
      Object.freeze({
        productId: line.productId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        ...(stringProperty(line, "proposalId")
          ? {
              proposalId: stringProperty(
                line,
                "proposalId",
              ),
            }
          : {}),
        artifacts: artifactRefs(line),
      }),
  );

  return Object.freeze({
    version: "1.0",
    internalOrderId: order.id,
    journeyId: order.journeyId,
    source: "RECUERDARTE",
    status: order.status,
    lines: Object.freeze(lines),
    totals: order.totals,
    metadata: Object.freeze({
      sourceSystem: "catalog-engine",
      ...(metadata ?? {}),
    }),
    createdAt: new Date().toISOString(),
  });
}
