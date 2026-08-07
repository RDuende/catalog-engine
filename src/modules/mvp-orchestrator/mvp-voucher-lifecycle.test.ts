import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryMvpConversationRepository } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";
import { MvpVoucherLifecycleError } from "./mvp-voucher-lifecycle.js";

const principal={kind:"VOUCHER" as const,id:"voucher-life",accessToken:"voucher-secret"};

test("crea un bono activo con fecha de caducidad",async()=>{
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero regalar dos camisetas",now:"2026-08-02T10:00:00.000Z"},principal);
  assert.equal(created.session.voucher?.status,"ACTIVE");
  assert.equal(service.voucherStatus(created.session.id,principal).voucher.status,"ACTIVE");
});

test("revoca un bono y bloquea su reclamación",async()=>{
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero regalar dos camisetas",now:"2026-08-02T10:00:00.000Z"},principal);
  const revoked=service.revokeVoucher(created.session.id,{reason:"pedido cancelado",now:"2026-08-02T10:05:00.000Z"},principal);
  assert.equal(revoked.voucher.status,"REVOKED");
  assert.throws(()=>service.claimVoucher(created.session.id,{userId:"recipient"},principal),(error:unknown)=>error instanceof MvpVoucherLifecycleError && error.code==="MVP_VOUCHER_REVOKED");
});

test("marca el bono como reclamado al transferirlo",async()=>{
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero regalar dos camisetas",now:"2026-08-02T10:00:00.000Z"},principal);
  const claimed=service.claimVoucher(created.session.id,{userId:"recipient",now:"2026-08-02T10:05:00.000Z"},principal);
  assert.equal(claimed.session.voucher?.status,"CLAIMED");
  assert.equal(claimed.session.voucher?.claimedByUserId,"recipient");
});

test("impide reclamar un bono caducado",async()=>{
  const previous=process.env.MVP_VOUCHER_EXPIRATION_DAYS;
  process.env.MVP_VOUCHER_EXPIRATION_DAYS="1";
  try {
    const service=new MvpConversationService(new InMemoryMvpConversationRepository());
    const created=await service.continue(undefined,{message:"Quiero regalar dos camisetas",now:"2026-08-02T10:00:00.000Z"},principal);
    assert.throws(()=>service.claimVoucher(created.session.id,{userId:"recipient",now:"2026-08-04T10:00:00.000Z"},principal),(error:unknown)=>error instanceof MvpVoucherLifecycleError && error.code==="MVP_VOUCHER_EXPIRED");
  } finally {
    if(previous===undefined) delete process.env.MVP_VOUCHER_EXPIRATION_DAYS; else process.env.MVP_VOUCHER_EXPIRATION_DAYS=previous;
  }
});
