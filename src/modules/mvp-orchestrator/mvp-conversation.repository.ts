import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { JourneyProjectSnapshot } from "../journey-domain/index.js";
import type {
  MvpConversationAccessGrant,
  MvpConversationMessage,
  MvpConversationOwner,
  MvpConversationPrincipal,
  MvpConversationSession,
  MvpVoucherLifecycle,
} from "./mvp-conversation.types.js";

export class MvpConversationOwnershipError extends Error {
  constructor(
    readonly code: "MVP_CONVERSATION_AUTH_REQUIRED" | "MVP_CONVERSATION_FORBIDDEN",
    message: string,
  ) {
    super(message);
    this.name = "MvpConversationOwnershipError";
  }
}

export interface MvpConversationRepository {
  get(sessionId: string): MvpConversationSession | undefined;
  findByJourney(journeyId: string): MvpConversationSession | undefined;
  save(input: {
    sessionId: string;
    journey: JourneyProjectSnapshot;
    owner: MvpConversationOwner;
    messages: readonly MvpConversationMessage[];
    voucher?: MvpVoucherLifecycle;
    now?: string;
  }): MvpConversationSession;
  append(session: MvpConversationSession | undefined, role: MvpConversationMessage["role"], text: string, now?: string): readonly MvpConversationMessage[];
  transferOwner(sessionId: string, owner: MvpConversationOwner, now?: string): MvpConversationSession;
  updateVoucher(sessionId: string, voucher: MvpVoucherLifecycle, now?: string): MvpConversationSession;
}

export function createOwner(
  principal: MvpConversationPrincipal | undefined,
  now?: string,
): { owner: MvpConversationOwner; access: MvpConversationAccessGrant } {
  const createdAt = now ?? new Date().toISOString();
  if (principal?.kind === "USER") {
    return {
      owner: Object.freeze({ kind: "USER", id: principal.id, createdAt }),
      access: Object.freeze({ ownerKind: "USER", ownerId: principal.id }),
    };
  }
  const kind = principal?.kind ?? "GUEST";
  const id = principal?.id ?? randomUUID();
  const token = principal?.accessToken ?? randomBytes(32).toString("base64url");
  return {
    owner: Object.freeze({ kind, id, accessKeyHash: hashToken(token), createdAt }),
    access: Object.freeze({ ownerKind: kind, ownerId: id, accessToken: token }),
  };
}

export function assertConversationOwner(session: MvpConversationSession, principal: MvpConversationPrincipal | undefined): void {
  if (!principal) {
    throw new MvpConversationOwnershipError("MVP_CONVERSATION_AUTH_REQUIRED", "Se necesita identidad para acceder a la conversación.");
  }
  if (principal.kind !== session.owner.kind || principal.id !== session.owner.id) {
    throw new MvpConversationOwnershipError("MVP_CONVERSATION_FORBIDDEN", "La conversación pertenece a otro propietario.");
  }
  if (session.owner.kind === "USER") return;
  if (!principal.accessToken || !session.owner.accessKeyHash || !safeHashEquals(session.owner.accessKeyHash, hashToken(principal.accessToken))) {
    throw new MvpConversationOwnershipError("MVP_CONVERSATION_FORBIDDEN", "La credencial de acceso no es válida.");
  }
}

function hashToken(token: string): string { return createHash("sha256").update(token).digest("hex"); }
function safeHashEquals(left: string, right: string): boolean {
  const a=Buffer.from(left,"hex"), b=Buffer.from(right,"hex");
  return a.length===b.length && timingSafeEqual(a,b);
}
function createMessage(role: MvpConversationMessage["role"], text: string, now?: string): MvpConversationMessage {
  return Object.freeze({ id: randomUUID(), role, text, createdAt: now ?? new Date().toISOString() });
}
function buildSession(input: { sessionId:string; journey:JourneyProjectSnapshot; owner:MvpConversationOwner; messages:readonly MvpConversationMessage[]; voucher?:MvpVoucherLifecycle; previous?:MvpConversationSession; now?:string }): MvpConversationSession {
  const now=input.now ?? new Date().toISOString();
  return Object.freeze({ id:input.sessionId, journeyId:input.journey.id, journey:input.journey, owner:input.owner, ...(input.voucher ?? input.previous?.voucher ? { voucher: input.voucher ?? input.previous?.voucher } : {}), messages:Object.freeze([...input.messages]), createdAt:input.previous?.createdAt ?? now, updatedAt:now });
}

export class InMemoryMvpConversationRepository implements MvpConversationRepository {
  private readonly sessions=new Map<string,MvpConversationSession>();
  get(sessionId:string){ return this.sessions.get(sessionId); }
  findByJourney(journeyId:string){ return [...this.sessions.values()].find((session)=>session.journeyId===journeyId); }
  save(input:{sessionId:string;journey:JourneyProjectSnapshot;owner:MvpConversationOwner;messages:readonly MvpConversationMessage[];voucher?:MvpVoucherLifecycle;now?:string}){
    const session=buildSession({...input,previous:this.sessions.get(input.sessionId)}); this.sessions.set(input.sessionId,session); return session;
  }
  append(session:MvpConversationSession|undefined,role:MvpConversationMessage["role"],text:string,now?:string){ return Object.freeze([...(session?.messages ?? []),createMessage(role,text,now)]); }
  transferOwner(sessionId:string,owner:MvpConversationOwner,now?:string){
    const session=this.sessions.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    const transferred=Object.freeze({...session,owner,updatedAt:now ?? new Date().toISOString()});
    this.sessions.set(sessionId,transferred);
    return transferred;
  }
  updateVoucher(sessionId:string,voucher:MvpVoucherLifecycle,now?:string){
    const session=this.sessions.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    const updated=Object.freeze({...session,voucher,updatedAt:now ?? new Date().toISOString()});
    this.sessions.set(sessionId,updated);
    return updated;
  }
}

export class FileMvpConversationRepository implements MvpConversationRepository {
  readonly directory:string;
  constructor(directory=".data/mvp-conversations"){ this.directory=resolve(directory); mkdirSync(this.directory,{recursive:true}); }
  get(sessionId:string):MvpConversationSession|undefined { const path=this.pathFor(sessionId); try { return this.parseSession(JSON.parse(readFileSync(path,"utf8")),sessionId); } catch(error){ if((error as NodeJS.ErrnoException).code==="ENOENT") return undefined; throw error; } }
  findByJourney(journeyId:string):MvpConversationSession|undefined {
    for (const file of readdirSync(this.directory)) {
      if (!file.endsWith(".json")) continue;
      const sessionId=file.slice(0,-5);
      const session=this.get(sessionId);
      if(session?.journeyId===journeyId) return session;
    }
    return undefined;
  }
  save(input:{sessionId:string;journey:JourneyProjectSnapshot;owner:MvpConversationOwner;messages:readonly MvpConversationMessage[];voucher?:MvpVoucherLifecycle;now?:string}){
    const session=buildSession({...input,previous:this.get(input.sessionId)}); const target=this.pathFor(input.sessionId); const temporary=`${target}.${process.pid}.${randomUUID()}.tmp`; writeFileSync(temporary,`${JSON.stringify(session,null,2)}\n`,"utf8"); renameSync(temporary,target); return session;
  }
  append(session:MvpConversationSession|undefined,role:MvpConversationMessage["role"],text:string,now?:string){ return Object.freeze([...(session?.messages ?? []),createMessage(role,text,now)]); }
  transferOwner(sessionId:string,owner:MvpConversationOwner,now?:string){
    const session=this.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    return this.save({sessionId,journey:session.journey,owner,messages:session.messages,voucher:session.voucher,now});
  }
  updateVoucher(sessionId:string,voucher:MvpVoucherLifecycle,now?:string){
    const session=this.get(sessionId);
    if(!session) throw new Error(`No existe la conversación ${sessionId}.`);
    return this.save({sessionId,journey:session.journey,owner:session.owner,messages:session.messages,voucher,now});
  }
  private pathFor(sessionId:string){ if(!/^[A-Za-z0-9._-]{1,160}$/.test(sessionId)) throw new Error("El identificador de sesión contiene caracteres no permitidos."); return join(this.directory,`${sessionId}.json`); }
  private parseSession(value:unknown,expectedId:string):MvpConversationSession {
    if(!value || typeof value!=="object") throw new Error(`La sesión persistida ${expectedId} no contiene un objeto válido.`);
    const s=value as Partial<MvpConversationSession>;
    if(s.id!==expectedId || typeof s.journeyId!=="string" || !s.journey || !s.owner || !Array.isArray(s.messages) || typeof s.createdAt!=="string" || typeof s.updatedAt!=="string") throw new Error(`La sesión persistida ${expectedId} no cumple el contrato V2.2.`);
    if(!["USER","GUEST","VOUCHER"].includes(s.owner.kind) || typeof s.owner.id!=="string" || typeof s.owner.createdAt!=="string") throw new Error(`La propiedad owner de ${expectedId} no es válida.`);
    return Object.freeze({ id:s.id, journeyId:s.journeyId, journey:s.journey, owner:Object.freeze({...s.owner}), ...(s.voucher ? { voucher:Object.freeze({...s.voucher}) } : {}), messages:Object.freeze(s.messages.map(m=>Object.freeze({...m}))), createdAt:s.createdAt, updatedAt:s.updatedAt });
  }
}
export function createDefaultMvpConversationRepository():MvpConversationRepository { const mode=process.env.MVP_CONVERSATION_STORAGE?.trim().toLowerCase(); if(mode==="memory") return new InMemoryMvpConversationRepository(); return new FileMvpConversationRepository(process.env.MVP_CONVERSATION_STORAGE_DIR ?? ".data/mvp-conversations"); }
