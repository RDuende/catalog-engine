import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryMvpConversationRepository, MvpConversationOwnershipError } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";

test("un bono transfiere la conversación a un usuario y revoca el acceso anterior", async () => {
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero regalar dos camisetas personalizadas",now:"2026-08-02T09:00:00.000Z"},{kind:"VOUCHER",id:"voucher-123",accessToken:"secret-voucher"});
  const claimed=service.claimVoucher(created.session.id,{userId:"user-recipient",now:"2026-08-02T09:05:00.000Z"},{kind:"VOUCHER",id:"voucher-123",accessToken:"secret-voucher"});
  assert.equal(claimed.session.owner.kind,"USER");
  assert.equal(claimed.session.owner.id,"user-recipient");
  assert.equal(claimed.previousOwnerKind,"VOUCHER");
  assert.equal(service.get(created.session.id,{kind:"USER",id:"user-recipient"})?.id,created.session.id);
  assert.throws(()=>service.get(created.session.id,{kind:"VOUCHER",id:"voucher-123",accessToken:"secret-voucher"}),MvpConversationOwnershipError);
});

test("rechaza reclamar una conversación que no pertenece a un bono", async () => {
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero un regalo",now:"2026-08-02T09:00:00.000Z"},{kind:"USER",id:"buyer-1"});
  assert.throws(()=>service.claimVoucher(created.session.id,{userId:"recipient-1"},{kind:"USER",id:"buyer-1"}),MvpConversationOwnershipError);
});
