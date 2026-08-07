import { randomUUID } from "node:crypto";
import { MvpOrchestrator } from "./mvp-orchestrator.js";
import {
  assertConversationOwner,
  MvpConversationOwnershipError,
  createDefaultMvpConversationRepository,
  createOwner,
  type MvpConversationRepository,
} from "./mvp-conversation.repository.js";
import type { RaiDiscoveryConverser } from "./rai-discovery-converser.js";
import { createConfiguredRaiDiscoveryConverser } from "./openai-rai-discovery-converser.js";
import { ConversationResponseBuilder } from "../conversation-planner/conversation-response-builder.js";
import type {
  ClaimVoucherConversationRequest,
  ClaimVoucherConversationResult,
  ContinueConversationRequest,
  ContinueConversationResult,
  MvpConversationAction,
  MvpConversationPrincipal,
  RevokeVoucherConversationRequest,
  ShowProposalsRequest,
  ShowProposalsResult,
  VoucherLifecycleResult,
  SavePersonalizationDraftRequest,
  PersonalizationDraftResult,
  GenerateDesignsRequest,
  DesignSetResult,
  SelectDesignRequest,
  RenderPreviewRequest,
  RenderPreviewResult,
} from "./mvp-conversation.types.js";
import { assertVoucherClaimable, claimVoucherLifecycle, createVoucherLifecycle, currentVoucherLifecycle, revokeVoucherLifecycle } from "./mvp-voucher-lifecycle.js";
import { InMemoryMvpPersonalizationRepository } from "./mvp-personalization.js";
import { InMemoryMvpDesignStudioRepository } from "./mvp-design-studio.js";
import { InMemoryMvpRenderPipelineRepository } from "./mvp-render-pipeline.js";

const DISCOVERY_ACTIONS: readonly MvpConversationAction[] = Object.freeze([
  Object.freeze({ type: "SHOW_PROPOSALS", label: "Mostrar propuestas", enabled: true }),
]);
const PROPOSAL_ACTIONS: readonly MvpConversationAction[] = Object.freeze([]);

export class MvpConversationService {
  constructor(
    private readonly repository: MvpConversationRepository = createDefaultMvpConversationRepository(),
    private readonly orchestrator = new MvpOrchestrator(),
    private readonly converser: RaiDiscoveryConverser = createConfiguredRaiDiscoveryConverser(),
    private readonly responseBuilder = new ConversationResponseBuilder(),
    private readonly personalizations = new InMemoryMvpPersonalizationRepository(),
    private readonly designs = new InMemoryMvpDesignStudioRepository(),
    private readonly renders = new InMemoryMvpRenderPipelineRepository(),
  ) {}

  get(sessionId:string,principal?:MvpConversationPrincipal){ const session=this.repository.get(sessionId); if(session) assertConversationOwner(session,principal); return session; }

  voucherStatus(sessionId:string,principal:MvpConversationPrincipal|undefined,now?:string):VoucherLifecycleResult {
    const session=this.repository.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session,principal);
    if(!session.voucher) throw new MvpConversationOwnershipError("MVP_CONVERSATION_FORBIDDEN","La conversación no pertenece a un bono.");
    const voucher=currentVoucherLifecycle(session.voucher,now);
    if(voucher!==session.voucher) this.repository.updateVoucher(sessionId,voucher,now);
    return Object.freeze({sessionId,ownerKind:session.owner.kind,voucher});
  }

  revokeVoucher(sessionId:string,input:RevokeVoucherConversationRequest,principal:MvpConversationPrincipal|undefined):VoucherLifecycleResult {
    const session=this.repository.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session,principal);
    if(session.owner.kind!=="VOUCHER" || !session.voucher) throw new MvpConversationOwnershipError("MVP_CONVERSATION_FORBIDDEN","Solo un bono activo puede revocarse.");
    const voucher=revokeVoucherLifecycle(session.voucher,input.reason,input.now);
    const updated=this.repository.updateVoucher(sessionId,voucher,input.now);
    return Object.freeze({sessionId,ownerKind:updated.owner.kind,voucher});
  }

  claimVoucher(sessionId:string,input:ClaimVoucherConversationRequest,principal:MvpConversationPrincipal|undefined):ClaimVoucherConversationResult {
    const session=this.repository.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session,principal);
    if(session.owner.kind!=="VOUCHER") throw new MvpConversationOwnershipError("MVP_CONVERSATION_FORBIDDEN","Solo las conversaciones propiedad de un bono pueden reclamarse.");
    if(!session.voucher) throw new MvpConversationOwnershipError("MVP_CONVERSATION_FORBIDDEN","La conversación no contiene un ciclo de vida de bono.");
    assertVoucherClaimable(session.voucher,input.now);
    const claimedAt=input.now ?? new Date().toISOString();
    const voucher=claimVoucherLifecycle(session.voucher,input.userId,claimedAt);
    this.repository.updateVoucher(sessionId,voucher,claimedAt);
    const owner=Object.freeze({kind:"USER" as const,id:input.userId,createdAt:claimedAt});
    const transferred=this.repository.transferOwner(sessionId,owner,claimedAt);
    return Object.freeze({session:transferred,previousOwnerKind:"VOUCHER",claimedByUserId:input.userId,claimedAt});
  }

  async continue(sessionId:string|undefined,input:ContinueConversationRequest,principal?:MvpConversationPrincipal):Promise<ContinueConversationResult>{
    const resolvedSessionId=sessionId ?? randomUUID();
    const existing=this.repository.get(resolvedSessionId);
    let owner, access;
    if(existing){
      assertConversationOwner(existing,principal);
      if(existing.owner.kind==="VOUCHER" && existing.voucher) assertVoucherClaimable(existing.voucher,input.now);
      owner=existing.owner;
    } else {
      const created=createOwner(principal,input.now);
      owner=created.owner;
      access=created.access;
    }

    const userMessages=this.repository.append(existing,"USER",input.message,input.now);
    const result=await this.orchestrator.run({
      mode:"DISCOVER",
      message:input.message,
      sessionId:resolvedSessionId,
      correlationId:input.correlationId,
      now:input.now,
      journey:existing?.journey,
    });
    const suggestedReply=await this.converser.reply({userMessage:input.message,history:userMessages,journey:result.journey,engineResult:result});
    const response=this.responseBuilder.build({
      previousJourney: existing?.journey,
      journey: result.journey,
      engineResult: result,
      suggestedReply,
    });
    const raiText=response.text;
    const messages=this.repository.append(Object.freeze({id:resolvedSessionId,journeyId:result.journey.id,journey:result.journey,owner,messages:userMessages,createdAt:existing?.createdAt ?? input.now ?? new Date().toISOString(),updatedAt:input.now ?? new Date().toISOString()}),"RAI",raiText,input.now);
    const voucher=existing?.voucher ?? (owner.kind==="VOUCHER" ? createVoucherLifecycle(input.now) : undefined);
    const session=this.repository.save({sessionId:resolvedSessionId,journey:result.journey,owner,messages,voucher,now:input.now});
    return Object.freeze({sessionId: session.id, session,result,response,actions:DISCOVERY_ACTIONS,...(access?{access}: {})});
  }

  getPersonalization(
    sessionId: string,
    proposalId: string,
    principal?: MvpConversationPrincipal,
  ): PersonalizationDraftResult | undefined {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const draft = this.personalizations.get(sessionId, proposalId);
    return draft ? Object.freeze({ sessionId, draft }) : undefined;
  }

  listPersonalizations(
    sessionId: string,
    principal?: MvpConversationPrincipal,
  ): readonly PersonalizationDraftResult[] {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    return Object.freeze(
      this.personalizations.list(sessionId).map((draft) =>
        Object.freeze({ sessionId, draft }),
      ),
    );
  }

  savePersonalization(
    sessionId: string,
    input: SavePersonalizationDraftRequest,
    principal?: MvpConversationPrincipal,
  ): PersonalizationDraftResult {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const draft = this.personalizations.save(sessionId, input);
    return Object.freeze({ sessionId, draft });
  }

  getDesigns(
    sessionId: string,
    proposalId: string,
    principal?: MvpConversationPrincipal,
  ): DesignSetResult | undefined {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const designSet = this.designs.get(sessionId, proposalId);
    return designSet ? Object.freeze({ sessionId, designSet }) : undefined;
  }

  generateDesigns(
    sessionId: string,
    input: GenerateDesignsRequest,
    principal?: MvpConversationPrincipal,
  ): DesignSetResult {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const designSet = this.designs.generate(sessionId, input);
    return Object.freeze({ sessionId, designSet });
  }

  selectDesign(
    sessionId: string,
    proposalId: string,
    input: SelectDesignRequest,
    principal?: MvpConversationPrincipal,
  ): DesignSetResult {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const designSet = this.designs.select(
      sessionId,
      proposalId,
      input.variantId,
      input.now,
    );
    return Object.freeze({ sessionId, designSet });
  }

  getRender(
    sessionId: string,
    proposalId: string,
    principal?: MvpConversationPrincipal,
  ): RenderPreviewResult | undefined {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const scene = this.renders.get(sessionId, proposalId);
    return scene ? Object.freeze({ sessionId, scene }) : undefined;
  }

  renderPreview(
    sessionId: string,
    input: RenderPreviewRequest,
    principal?: MvpConversationPrincipal,
  ): RenderPreviewResult {
    const session = this.repository.get(sessionId);
    if (!session) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(session, principal);
    const scene = this.renders.render(sessionId, input);
    return Object.freeze({ sessionId, scene });
  }

  async showProposals(sessionId:string,input:ShowProposalsRequest,principal?:MvpConversationPrincipal):Promise<ShowProposalsResult>{
    const existing=this.repository.get(sessionId);
    if(!existing) throw new Error(`No existe la conversación ${sessionId}.`);
    assertConversationOwner(existing,principal);
    if(existing.owner.kind==="VOUCHER" && existing.voucher) assertVoucherClaimable(existing.voucher,input.now);

    const result=await this.orchestrator.run({
      mode:"GENERATE_PROPOSALS",
      message:"",
      sessionId,
      correlationId:input.correlationId,
      now:input.now,
      journey:existing.journey,
    });
    if(result.status!=="COMPLETED" || !result.proposalSet) {
      throw new Error("Todavía no hay información mínima suficiente para generar propuestas.");
    }
    const raiText=`Ya tengo preparadas ${result.proposalSet.proposals.length} propuestas para este regalo.`;
    const messages=this.repository.append(existing,"RAI",raiText,input.now);
    const session=this.repository.save({sessionId,journey:result.journey,owner:existing.owner,messages,voucher:existing.voucher,now:input.now});
    return Object.freeze({sessionId: session.id, session,result,proposalSet:result.proposalSet,actions:PROPOSAL_ACTIONS});
  }
}
