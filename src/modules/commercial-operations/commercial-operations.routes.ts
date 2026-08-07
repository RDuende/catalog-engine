import type { FastifyPluginAsync } from "fastify";
import { CommercialOperationsService } from "./commercial-operations.service.js";
import type { CommercialOperationsSettings, MarginRule, ProductionRule, QuoteSimulationInput, ShippingMethod, ShippingZone } from "./commercial-operations.types.js";

export const commercialOperationsRoutes: FastifyPluginAsync = async (app) => {
  const service = new CommercialOperationsService();
  app.get("/commercial-operations", async () => service.getAll());
  app.patch<{ Body: Partial<CommercialOperationsSettings> }>("/commercial-operations/settings", async (request) => service.updateSettings(request.body));
  app.post<{ Body: Partial<MarginRule> & Pick<MarginRule,"name"|"scope"|"mode"|"value"> }>("/commercial-operations/margins", async (request) => service.upsertMargin(request.body));
  app.delete<{ Params:{id:string} }>("/commercial-operations/margins/:id", async (request) => service.removeMargin(request.params.id));
  app.post<{ Body: Partial<ProductionRule> & Pick<ProductionRule,"name"|"scope"|"productionDays"> }>("/commercial-operations/production", async (request) => service.upsertProduction(request.body));
  app.delete<{ Params:{id:string} }>("/commercial-operations/production/:id", async (request) => service.removeProduction(request.params.id));
  app.post<{ Body: ShippingZone }>("/commercial-operations/shipping-zones", async (request) => service.upsertZone(request.body));
  app.delete<{ Params:{id:string} }>("/commercial-operations/shipping-zones/:id", async (request) => service.removeZone(request.params.id));
  app.post<{ Body: Partial<ShippingMethod> & Pick<ShippingMethod,"name"|"carrier"|"zoneId"|"mode"|"basePrice"|"minDeliveryDays"|"maxDeliveryDays"> }>("/commercial-operations/shipping-methods", async (request) => service.upsertShipping(request.body));
  app.delete<{ Params:{id:string} }>("/commercial-operations/shipping-methods/:id", async (request) => service.removeShipping(request.params.id));
  app.post<{ Body: QuoteSimulationInput }>("/commercial-operations/simulate", async (request) => service.simulate(request.body));
};
