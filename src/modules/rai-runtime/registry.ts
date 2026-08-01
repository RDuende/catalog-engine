import type { RuntimeHandler, RuntimeSkill, RuntimeTool } from "./runtime.types.js";

class HandlerRegistry<T extends RuntimeHandler> {
  private readonly handlers = new Map<string, T>();

  register(handler: T): this {
    if (this.handlers.has(handler.id)) throw new Error(`El handler ${handler.id} ya está registrado.`);
    this.handlers.set(handler.id, handler);
    return this;
  }

  get(id: string): T {
    const handler = this.handlers.get(id);
    if (!handler) throw new Error(`No existe el handler ${id}.`);
    return handler;
  }

  list(): readonly string[] {
    return [...this.handlers.keys()].sort();
  }
}

export class SkillRegistry extends HandlerRegistry<RuntimeSkill> {}
export class ToolRegistry extends HandlerRegistry<RuntimeTool> {}
