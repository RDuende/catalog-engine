import type { FastifyInstance, FastifyRequest } from "fastify";
import { MvpConversationOwnershipError } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";
import type { ClaimVoucherConversationRequest, ContinueConversationRequest, MvpConversationOwnerKind, ShowProposalsRequest, MvpConversationPrincipal, RevokeVoucherConversationRequest, SavePersonalizationDraftRequest, GenerateDesignsRequest, SelectDesignRequest, RenderPreviewRequest } from "./mvp-conversation.types.js";
import { MvpVoucherLifecycleError } from "./mvp-voucher-lifecycle.js";

const revokeSchema={type:"object",additionalProperties:false,properties:{reason:{type:"string",maxLength:500},now:{type:"string"}}} as const;
const claimSchema={type:"object",additionalProperties:false,required:["userId"],properties:{userId:{type:"string",minLength:1,maxLength:160},now:{type:"string"}}} as const;
const proposalsSchema={type:"object",additionalProperties:false,properties:{correlationId:{type:"string",minLength:1},now:{type:"string"}}} as const;
const messageSchema={type:"object",additionalProperties:false,required:["message"],properties:{message:{type:"string",minLength:1,maxLength:5000},correlationId:{type:"string",minLength:1},now:{type:"string"}}} as const;
const personalizationSchema={type:"object",additionalProperties:false,required:["proposalId","productId"],properties:{proposalId:{type:"string",minLength:1,maxLength:200},productId:{type:"string",minLength:1,maxLength:200},name:{type:"string",maxLength:200},dedication:{type:"string",maxLength:1000},date:{type:"string",maxLength:100},colors:{type:"array",maxItems:8,items:{type:"string",maxLength:80}},photoUrl:{type:"string",maxLength:2000},notes:{type:"string",maxLength:1000},now:{type:"string"}}} as const;

const designSchema={type:"object",additionalProperties:false,required:["proposalId","productId"],properties:{proposalId:{type:"string",minLength:1,maxLength:200},productId:{type:"string",minLength:1,maxLength:200},name:{type:"string",maxLength:200},dedication:{type:"string",maxLength:1000},date:{type:"string",maxLength:100},colors:{type:"array",maxItems:8,items:{type:"string",maxLength:80}},photoUrl:{type:"string",maxLength:2000},notes:{type:"string",maxLength:1000},proposalTitle:{type:"string",maxLength:300},now:{type:"string"}}} as const;
const selectDesignSchema={type:"object",additionalProperties:false,required:["variantId"],properties:{variantId:{type:"string",minLength:1,maxLength:200},now:{type:"string"}}} as const;

const renderSchema={type:"object",additionalProperties:false,required:["proposalId","designVariantId","style","headline","supportingText","palette"],properties:{proposalId:{type:"string",minLength:1,maxLength:200},designVariantId:{type:"string",minLength:1,maxLength:200},style:{type:"string",enum:["ETHEREAL","EDITORIAL","MEMORY_COLLAGE"]},headline:{type:"string",maxLength:500},supportingText:{type:"string",maxLength:2000},palette:{type:"array",maxItems:8,items:{type:"string",maxLength:80}},photoUrl:{type:"string",maxLength:2000},now:{type:"string"}}} as const;
function header(request:FastifyRequest,name:string):string|undefined { const value=request.headers[name]; return Array.isArray(value)?value[0]:value; }
function principalFrom(request:FastifyRequest,allowGuestCreation=false):MvpConversationPrincipal|undefined {
  const rawKind=header(request,"x-mvp-owner-type")?.toUpperCase();
  const id=header(request,"x-mvp-owner-id");
  const accessToken=header(request,"x-mvp-access-token");
  if(!rawKind && !id && !accessToken) return allowGuestCreation ? undefined : undefined;
  if(!rawKind || !id || !["USER","GUEST","VOUCHER"].includes(rawKind)) throw new MvpConversationOwnershipError("MVP_CONVERSATION_AUTH_REQUIRED","Las cabeceras de propietario no son válidas.");
  return {kind:rawKind as MvpConversationOwnerKind,id,accessToken};
}
function ownershipReply(reply:any,error:unknown){ if(error instanceof MvpConversationOwnershipError){ return reply.code(error.code==="MVP_CONVERSATION_AUTH_REQUIRED"?401:403).send({error:error.code,message:error.message}); } if(error instanceof MvpVoucherLifecycleError){ const status=error.code==="MVP_VOUCHER_EXPIRED"?410:409; return reply.code(status).send({error:error.code,message:error.message}); } throw error; }

export async function mvpConversationRoutes(app:FastifyInstance, service:MvpConversationService=new MvpConversationService()){
  app.post<{Body:ContinueConversationRequest}>("/mvp/conversations",{schema:{body:messageSchema}},async(request,reply)=>{ try{return reply.code(201).send(await service.continue(undefined,request.body,principalFrom(request,true)));}catch(error){return ownershipReply(reply,error);} });
  app.post<{Params:{sessionId:string};Body:ContinueConversationRequest}>("/mvp/conversations/:sessionId/messages",{schema:{body:messageSchema}},async(request,reply)=>{ try{return reply.send(await service.continue(request.params.sessionId,request.body,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });
  app.post<{Params:{sessionId:string};Body:ShowProposalsRequest}>("/mvp/conversations/:sessionId/proposals",{schema:{body:proposalsSchema}},async(request,reply)=>{ try{return reply.send(await service.showProposals(request.params.sessionId,request.body,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });
  app.get<{Params:{sessionId:string;proposalId:string}}>("/mvp/conversations/:sessionId/personalizations/:proposalId",async(request,reply)=>{ try{const result=service.getPersonalization(request.params.sessionId,request.params.proposalId,principalFrom(request)); return result?reply.send(result):reply.code(404).send({error:"MVP_PERSONALIZATION_NOT_FOUND"});}catch(error){return ownershipReply(reply,error);} });
  app.get<{Params:{sessionId:string}}>("/mvp/conversations/:sessionId/personalizations",async(request,reply)=>{ try{return reply.send(service.listPersonalizations(request.params.sessionId,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });
  app.put<{Params:{sessionId:string};Body:SavePersonalizationDraftRequest}>("/mvp/conversations/:sessionId/personalizations",{schema:{body:personalizationSchema}},async(request,reply)=>{ try{return reply.send(service.savePersonalization(request.params.sessionId,request.body,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });
  app.get<{Params:{sessionId:string;proposalId:string}}>("/mvp/conversations/:sessionId/designs/:proposalId",async(request,reply)=>{ try{const result=service.getDesigns(request.params.sessionId,request.params.proposalId,principalFrom(request)); return result?reply.send(result):reply.code(404).send({error:"MVP_DESIGNS_NOT_FOUND"});}catch(error){return ownershipReply(reply,error);} });
  app.post<{Params:{sessionId:string};Body:GenerateDesignsRequest}>("/mvp/conversations/:sessionId/designs",{schema:{body:designSchema}},async(request,reply)=>{ try{return reply.send(service.generateDesigns(request.params.sessionId,request.body,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });
  app.put<{Params:{sessionId:string;proposalId:string};Body:SelectDesignRequest}>("/mvp/conversations/:sessionId/designs/:proposalId/selection",{schema:{body:selectDesignSchema}},async(request,reply)=>{ try{return reply.send(service.selectDesign(request.params.sessionId,request.params.proposalId,request.body,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });
  app.get<{Params:{sessionId:string;proposalId:string}}>("/mvp/conversations/:sessionId/renders/:proposalId",async(request,reply)=>{ try{const result=service.getRender(request.params.sessionId,request.params.proposalId,principalFrom(request)); return result?reply.send(result):reply.code(404).send({error:"MVP_RENDER_NOT_FOUND"});}catch(error){return ownershipReply(reply,error);} });
  app.post<{Params:{sessionId:string};Body:RenderPreviewRequest}>("/mvp/conversations/:sessionId/renders",{schema:{body:renderSchema}},async(request,reply)=>{ try{return reply.send(service.renderPreview(request.params.sessionId,request.body,principalFrom(request)));}catch(error){return ownershipReply(reply,error);} });

  app.get<{Params:{sessionId:string};Querystring:{now?:string}}>("/mvp/conversations/:sessionId/voucher",async(request,reply)=>{
    try{return reply.send(service.voucherStatus(request.params.sessionId,principalFrom(request),request.query.now));}
    catch(error){return ownershipReply(reply,error);}
  });
  app.post<{Params:{sessionId:string};Body:RevokeVoucherConversationRequest}>("/mvp/conversations/:sessionId/voucher/revoke",{schema:{body:revokeSchema}},async(request,reply)=>{
    try{return reply.send(service.revokeVoucher(request.params.sessionId,request.body,principalFrom(request)));}
    catch(error){return ownershipReply(reply,error);}
  });

  app.post<{Params:{sessionId:string};Body:ClaimVoucherConversationRequest}>("/mvp/conversations/:sessionId/claim",{schema:{body:claimSchema}},async(request,reply)=>{
    try{return reply.send(service.claimVoucher(request.params.sessionId,request.body,principalFrom(request)));}
    catch(error){return ownershipReply(reply,error);}
  });
  app.get<{Params:{sessionId:string} }>("/mvp/conversations/:sessionId",async(request,reply)=>{ try{const session=service.get(request.params.sessionId,principalFrom(request)); return session?reply.send(session):reply.code(404).send({error:"MVP_CONVERSATION_NOT_FOUND"});}catch(error){return ownershipReply(reply,error);} });
}

interface BrowserConversationCookie {
  readonly sessionId: string;
  readonly ownerKind: MvpConversationOwnerKind;
  readonly ownerId: string;
  readonly accessToken?: string;
}

const BROWSER_SESSION_COOKIE = "rai_mvp_session";

export function encodeBrowserConversationCookie(value: BrowserConversationCookie): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function decodeBrowserConversationCookie(value: string | undefined): BrowserConversationCookie | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<BrowserConversationCookie>;
    if (!parsed.sessionId || !parsed.ownerKind || !parsed.ownerId) return undefined;
    if (!["USER", "GUEST", "VOUCHER"].includes(parsed.ownerKind)) return undefined;
    return {
      sessionId: parsed.sessionId,
      ownerKind: parsed.ownerKind,
      ownerId: parsed.ownerId,
      ...(parsed.accessToken ? { accessToken: parsed.accessToken } : {}),
    };
  } catch {
    return undefined;
  }
}

function cookieValue(request: FastifyRequest, name: string): string | undefined {
  const raw = request.headers.cookie;
  if (!raw) return undefined;
  for (const item of raw.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return decodeURIComponent(item.slice(separator + 1).trim());
  }
  return undefined;
}

function browserCookieFrom(request: FastifyRequest): BrowserConversationCookie | undefined {
  return decodeBrowserConversationCookie(cookieValue(request, BROWSER_SESSION_COOKIE));
}

function principalFromBrowserCookie(cookie: BrowserConversationCookie | undefined): MvpConversationPrincipal | undefined {
  if (!cookie) return undefined;
  return { kind: cookie.ownerKind, id: cookie.ownerId, accessToken: cookie.accessToken };
}

function setBrowserConversationCookie(reply: any, value: BrowserConversationCookie): void {
  const encoded = encodeBrowserConversationCookie(value);
  reply.header(
    "set-cookie",
    `${BROWSER_SESSION_COOKIE}=${encodeURIComponent(encoded)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
  );
}

/**
 * Endpoints sencillos para el chat web. La cookie conserva sesión y credenciales,
 * por lo que el cliente no necesita guardar ni reenviar sessionId/accessToken.
 */
export async function mvpBrowserChatRoutes(
  app: FastifyInstance,
  service: MvpConversationService = new MvpConversationService(),
) {
  app.post<{ Body: ContinueConversationRequest }>(
    "/mvp/chat/messages",
    { schema: { body: messageSchema } },
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        const result = await service.continue(
          current?.sessionId,
          request.body,
          principalFromBrowserCookie(current),
        );
        const access = result.access;
        setBrowserConversationCookie(reply, {
          sessionId: result.session.id,
          ownerKind: access?.ownerKind ?? result.session.owner.kind,
          ownerId: access?.ownerId ?? result.session.owner.id,
          accessToken: access?.accessToken ?? current?.accessToken,
        });
        return reply.code(current ? 200 : 201).send(result);
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

  app.post<{ Body: ShowProposalsRequest }>(
    "/mvp/chat/proposals",
    { schema: { body: proposalsSchema } },
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) {
          return reply.code(409).send({
            error: "MVP_CONVERSATION_SESSION_REQUIRED",
            message: "Primero debes iniciar la conversación.",
          });
        }
        const result = await service.showProposals(
          current.sessionId,
          request.body,
          principalFromBrowserCookie(current),
        );
        return reply.send(result);
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

  app.get<{ Params: { proposalId: string } }>(
    "/mvp/chat/personalizations/:proposalId",
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        const result = service.getPersonalization(
          current.sessionId,
          request.params.proposalId,
          principalFromBrowserCookie(current),
        );
        return result ? reply.send(result) : reply.code(404).send({ error: "MVP_PERSONALIZATION_NOT_FOUND" });
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

  app.put<{ Body: SavePersonalizationDraftRequest }>(
    "/mvp/chat/personalizations",
    { schema: { body: personalizationSchema } },
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        return reply.send(
          service.savePersonalization(
            current.sessionId,
            request.body,
            principalFromBrowserCookie(current),
          ),
        );
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );


  app.get<{ Params: { proposalId: string } }>(
    "/mvp/chat/designs/:proposalId",
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        const result = service.getDesigns(
          current.sessionId,
          request.params.proposalId,
          principalFromBrowserCookie(current),
        );
        return result ? reply.send(result) : reply.code(404).send({ error: "MVP_DESIGNS_NOT_FOUND" });
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

  app.post<{ Body: GenerateDesignsRequest }>(
    "/mvp/chat/designs",
    { schema: { body: designSchema } },
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        return reply.send(
          service.generateDesigns(
            current.sessionId,
            request.body,
            principalFromBrowserCookie(current),
          ),
        );
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

  app.put<{ Params: { proposalId: string }; Body: SelectDesignRequest }>(
    "/mvp/chat/designs/:proposalId/selection",
    { schema: { body: selectDesignSchema } },
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        return reply.send(
          service.selectDesign(
            current.sessionId,
            request.params.proposalId,
            request.body,
            principalFromBrowserCookie(current),
          ),
        );
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );


  app.get<{ Params: { proposalId: string } }>(
    "/mvp/chat/renders/:proposalId",
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        const result = service.getRender(
          current.sessionId,
          request.params.proposalId,
          principalFromBrowserCookie(current),
        );
        return result ? reply.send(result) : reply.code(404).send({ error: "MVP_RENDER_NOT_FOUND" });
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

  app.post<{ Body: RenderPreviewRequest }>(
    "/mvp/chat/renders",
    { schema: { body: renderSchema } },
    async (request, reply) => {
      try {
        const current = browserCookieFrom(request);
        if (!current) return reply.code(409).send({ error: "MVP_CONVERSATION_SESSION_REQUIRED" });
        return reply.send(
          service.renderPreview(
            current.sessionId,
            request.body,
            principalFromBrowserCookie(current),
          ),
        );
      } catch (error) {
        return ownershipReply(reply, error);
      }
    },
  );

}
