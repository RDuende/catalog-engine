import type { FastifyInstance, FastifyReply } from "fastify";
import { PaymentIntentNotFoundError, PaymentIntentStateError, PurchaseOrderNotFoundError, PurchaseOrderStateError, PurchaseOrderValidationError } from "./purchase-experience.errors.js";
import type { PaymentIntentService } from "./payment-intent.service.js";
import type { PurchaseExperienceService } from "./purchase-experience.service.js";
import type { CreatePurchaseOrderInput } from "./purchase-experience.types.js";

function sendError(reply: FastifyReply, error: unknown): unknown {
  if (error instanceof PurchaseOrderValidationError) return reply.code(400).send({ error: error.code, message: error.message });
  if (error instanceof PurchaseOrderNotFoundError || error instanceof PaymentIntentNotFoundError) return reply.code(404).send({ error: error.code, message: error.message });
  if (error instanceof PurchaseOrderStateError || error instanceof PaymentIntentStateError) return reply.code(409).send({ error: error.code, message: error.message });
  throw error;
}

export async function purchaseExperienceRoutes(app: FastifyInstance, service: PurchaseExperienceService, payments?: PaymentIntentService) {
  app.post<{ Body: CreatePurchaseOrderInput }>("/purchase/orders", async (request, reply) => { try { return reply.code(201).send({ order: service.create(request.body) }); } catch (error) { return sendError(reply, error); } });
  app.get<{ Params: { orderId: string } }>("/purchase/orders/:orderId", async (request, reply) => { try { return { order: service.get(request.params.orderId) }; } catch (error) { return sendError(reply, error); } });
  app.get<{ Params: { journeyId: string } }>("/journeys/:journeyId/orders", async (request) => ({ orders: service.listByJourney(request.params.journeyId) }));
  app.post<{ Params: { orderId: string } }>("/purchase/orders/:orderId/confirm", async (request, reply) => { try { return { order: service.confirm(request.params.orderId) }; } catch (error) { return sendError(reply, error); } });
  app.post<{ Params: { orderId: string } }>("/purchase/orders/:orderId/cancel", async (request, reply) => { try { return { order: service.cancel(request.params.orderId) }; } catch (error) { return sendError(reply, error); } });

  if (!payments) return;
  app.post<{ Params:{orderId:string}; Body?:{idempotencyKey?:string} }>("/purchase/orders/:orderId/payment-intents", async (request, reply) => { try { return reply.code(201).send({ paymentIntent: payments.create(request.params.orderId, request.body?.idempotencyKey) }); } catch(error){ return sendError(reply,error); } });
  app.get<{ Params:{orderId:string} }>("/purchase/orders/:orderId/payment-intents", async (request) => ({ paymentIntents:payments.listByOrder(request.params.orderId) }));
  app.get<{ Params:{paymentIntentId:string} }>("/purchase/payment-intents/:paymentIntentId", async (request,reply) => { try { return { paymentIntent:payments.get(request.params.paymentIntentId) }; } catch(error){ return sendError(reply,error); } });
  app.post<{ Params:{paymentIntentId:string} }>("/purchase/payment-intents/:paymentIntentId/confirm", async (request,reply) => { try { return { paymentIntent:payments.confirm(request.params.paymentIntentId) }; } catch(error){ return sendError(reply,error); } });
  app.post<{ Params:{paymentIntentId:string} }>("/purchase/payment-intents/:paymentIntentId/cancel", async (request,reply) => { try { return { paymentIntent:payments.cancel(request.params.paymentIntentId) }; } catch(error){ return sendError(reply,error); } });
}
