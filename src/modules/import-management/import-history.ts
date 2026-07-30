import type { ImportStore } from "./import-store.js"; import type { ImportSnapshot, SnapshotStage } from "./import-types.js";
const id=()=>`snap_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
export class ImportHistory {
 constructor(private readonly store:ImportStore, private readonly engineVersion:string, private readonly taxonomyVersion?:string){}
 async capture(importId:string,productId:string,stage:SnapshotStage,payload:Record<string,unknown>,reason?:string):Promise<ImportSnapshot>{
  const snapshot:ImportSnapshot={id:id(),importId,productId,stage,payload:structuredClone(payload),engineVersion:this.engineVersion,taxonomyVersion:this.taxonomyVersion,createdAt:new Date().toISOString(),reason};
  await this.store.saveSnapshot(snapshot); return snapshot;
 }
 timeline(productId:string){return this.store.listSnapshots(productId);}
}
