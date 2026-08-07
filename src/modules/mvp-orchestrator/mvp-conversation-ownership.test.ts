import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryMvpConversationRepository, MvpConversationOwnershipError } from "./mvp-conversation.repository.js";
import { MvpConversationService } from "./mvp-conversation.service.js";

test("crea una conversación invitada y exige su credencial para continuar",async()=>{
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const first=await service.continue(undefined,{message:"Quiero un regalo para mis gemelas de 7 años",now:"2026-08-02T09:00:00.000Z"});
  assert.equal(first.session.owner.kind,"GUEST"); assert.ok(first.access?.accessToken);
  await assert.rejects(()=>service.continue(first.session.id,{message:"Es para su cumpleaños"}), (error:unknown)=>error instanceof MvpConversationOwnershipError && error.code==="MVP_CONVERSATION_AUTH_REQUIRED");
  const second=await service.continue(first.session.id,{message:"Es para su cumpleaños y tengo 60 euros"},{kind:"GUEST",id:first.access!.ownerId,accessToken:first.access!.accessToken});
  assert.equal(second.result.status,"READY_FOR_PROPOSALS");
});

test("un usuario no puede acceder a la conversación de otro",async()=>{
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero un regalo para mi madre"},{kind:"USER",id:"user-a"});
  assert.throws(()=>service.get(created.session.id,{kind:"USER",id:"user-b"}), (error:unknown)=>error instanceof MvpConversationOwnershipError && error.code==="MVP_CONVERSATION_FORBIDDEN");
});

test("un bono puede ser propietario de una conversación",async()=>{
  const service=new MvpConversationService(new InMemoryMvpConversationRepository());
  const created=await service.continue(undefined,{message:"Quiero personalizar mi bono"},{kind:"VOUCHER",id:"voucher-123",accessToken:"voucher-secret"});
  assert.equal(created.session.owner.kind,"VOUCHER");
  assert.equal(service.get(created.session.id,{kind:"VOUCHER",id:"voucher-123",accessToken:"voucher-secret"})?.id,created.session.id);
});
