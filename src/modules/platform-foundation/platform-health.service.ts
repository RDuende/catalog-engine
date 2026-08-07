import { access } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { PLATFORM_MODULES } from "./platform-module.registry.js";
import type { ModuleHealthResult, PlatformHealthSnapshot, PlatformModuleDefinition } from "./platform-foundation.types.js";

export class PlatformHealthService {
  async checkModule(module: PlatformModuleDefinition): Promise<ModuleHealthResult> {
    const started = performance.now();
    const path = join(process.cwd(), "src", "modules", module.id);
    try {
      await access(path);
      return Object.freeze({
        moduleId: module.id,
        status: "HEALTHY",
        checkedAt: new Date().toISOString(),
        durationMs: Math.round(performance.now() - started),
        message: `Disponible · v${module.version}`,
      });
    } catch {
      return Object.freeze({
        moduleId: module.id,
        status: "UNAVAILABLE",
        checkedAt: new Date().toISOString(),
        durationMs: Math.round(performance.now() - started),
        message: `No se encontró ${path}`,
      });
    }
  }

  async snapshot(): Promise<PlatformHealthSnapshot> {
    const health = await Promise.all(PLATFORM_MODULES.map((module) => this.checkModule(module)));
    const count = (status: ModuleHealthResult["status"]) => health.filter((item) => item.status === status).length;
    return Object.freeze({
      generatedAt: new Date().toISOString(),
      platformVersion: "2.0.0-foundation",
      nodeVersion: process.version,
      platform: `${process.platform}/${process.arch}`,
      uptimeSeconds: Math.round(process.uptime()),
      modules: PLATFORM_MODULES,
      health: Object.freeze(health),
      summary: Object.freeze({
        totalModules: PLATFORM_MODULES.length,
        healthy: count("HEALTHY"),
        degraded: count("DEGRADED"),
        unavailable: count("UNAVAILABLE"),
        unknown: count("UNKNOWN"),
      }),
    });
  }
}

export const defaultPlatformHealth = new PlatformHealthService();