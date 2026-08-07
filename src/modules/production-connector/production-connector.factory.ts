import type {
  PurchaseExperienceService,
} from "../purchase-experience/index.js";
import {
  FileProductionDispatchRepository,
} from "./production-dispatch.repository.js";
import {
  ProductionConnectorService,
} from "./production-connector.service.js";
import {
  HttpRDuendeGestClient,
  RDuendeGestProductionAdapter,
} from "./rduendegest.adapter.js";

export function createDefaultProductionConnector(
  purchases: PurchaseExperienceService,
): ProductionConnectorService {
  const baseUrl =
    process.env.RDUENDEGEST_BASE_URL?.trim();
  const token =
    process.env.RDUENDEGEST_API_TOKEN?.trim();

  const repository =
    new FileProductionDispatchRepository(
      process.env.RDUENDEGEST_DISPATCH_FILE ??
        ".data/rduendegest-dispatches.json",
    );

  if (!baseUrl || !token) {
    return new ProductionConnectorService(
      purchases,
      repository,
    );
  }

  return new ProductionConnectorService(
    purchases,
    repository,
    new RDuendeGestProductionAdapter(
      new HttpRDuendeGestClient({
        baseUrl,
        token,
      }),
    ),
  );
}
