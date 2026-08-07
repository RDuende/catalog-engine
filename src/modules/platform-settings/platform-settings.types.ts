export type SettingValue = string | number | boolean;
export type SettingKind = "text" | "number" | "boolean" | "password" | "select";

export type SettingDefinition = {
  readonly key: string;
  readonly category: string;
  readonly label: string;
  readonly description: string;
  readonly kind: SettingKind;
  readonly defaultValue: SettingValue;
  readonly sensitive?: boolean;
  readonly restartRequired?: boolean;
  readonly options?: readonly string[];
  readonly min?: number;
  readonly max?: number;
};

export type PlatformSettingsSnapshot = {
  readonly source: "LOCAL" | "RDGEST";
  readonly version: number;
  readonly updatedAt: string;
  readonly values: Readonly<Record<string, SettingValue>>;
};
