import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { PLATFORM_SETTING_DEFINITIONS } from "./platform-settings.definitions.js";
import type { PlatformSettingsSnapshot, SettingDefinition, SettingValue } from "./platform-settings.types.js";

const MASK = "••••••••";

function defaults(): Record<string, SettingValue> {
  return Object.fromEntries(PLATFORM_SETTING_DEFINITIONS.map((definition) => [definition.key, definition.defaultValue]));
}

function validate(definition: SettingDefinition, value: unknown): SettingValue {
  if (definition.kind === "boolean") {
    if (typeof value !== "boolean") throw new Error(`${definition.label}: se esperaba un booleano.`);
    return value;
  }
  if (definition.kind === "number") {
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed)) throw new Error(`${definition.label}: número no válido.`);
    if (definition.min !== undefined && parsed < definition.min) throw new Error(`${definition.label}: mínimo ${definition.min}.`);
    if (definition.max !== undefined && parsed > definition.max) throw new Error(`${definition.label}: máximo ${definition.max}.`);
    return parsed;
  }
  if (typeof value !== "string") throw new Error(`${definition.label}: texto no válido.`);
  if (definition.options && !definition.options.includes(value)) throw new Error(`${definition.label}: valor no permitido.`);
  return value;
}

export class PlatformSettingsService {
  private readonly filePath: string;
  constructor(filePath = path.resolve(process.cwd(), ".data/platform-settings.json")) { this.filePath = filePath; }

  private async readRaw(): Promise<PlatformSettingsSnapshot> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as Partial<PlatformSettingsSnapshot>;
      return { source: parsed.source === "RDGEST" ? "RDGEST" : "LOCAL", version: Number(parsed.version ?? 1), updatedAt: String(parsed.updatedAt ?? new Date(0).toISOString()), values: { ...defaults(), ...(parsed.values ?? {}) } };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return { source:"LOCAL", version:1, updatedAt:new Date(0).toISOString(), values:defaults() };
    }
  }

  async getPublic() {
    const snapshot = await this.readRaw();
    const values = { ...snapshot.values } as Record<string, SettingValue>;
    for (const definition of PLATFORM_SETTING_DEFINITIONS) if (definition.sensitive && values[definition.key]) values[definition.key] = MASK;
    return { ...snapshot, values, definitions: PLATFORM_SETTING_DEFINITIONS };
  }

  async update(patch: Readonly<Record<string, unknown>>) {
    const current = await this.readRaw();
    const values = { ...current.values } as Record<string, SettingValue>;
    const restartRequired: string[] = [];
    for (const [key, raw] of Object.entries(patch)) {
      const definition = PLATFORM_SETTING_DEFINITIONS.find((item) => item.key === key);
      if (!definition) throw new Error(`Setting desconocido: ${key}`);
      if (definition.sensitive && (raw === "" || raw === MASK)) continue;
      const value = validate(definition, raw);
      if (values[key] !== value && definition.restartRequired) restartRequired.push(key);
      values[key] = value;
    }
    const source = values["platform.settingsProvider"] === "RDGEST" ? "RDGEST" : "LOCAL";
    const next: PlatformSettingsSnapshot = { source, version: current.version + 1, updatedAt: new Date().toISOString(), values };
    await mkdir(path.dirname(this.filePath), { recursive:true });
    const temp = `${this.filePath}.tmp`;
    await writeFile(temp, JSON.stringify(next, null, 2), "utf8");
    await rename(temp, this.filePath);
    return { ...(await this.getPublic()), restartRequired };
  }

  async reset(keys?: readonly string[]) {
    const current = await this.readRaw();
    const nextValues = { ...current.values } as Record<string, SettingValue>;
    const selected = keys?.length ? new Set(keys) : undefined;
    for (const definition of PLATFORM_SETTING_DEFINITIONS) if (!selected || selected.has(definition.key)) nextValues[definition.key] = definition.defaultValue;
    return this.update(nextValues);
  }
}
