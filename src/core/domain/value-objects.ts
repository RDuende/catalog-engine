export class Money {
  private constructor(
    public readonly amountMinor: number,
    public readonly currency: string
  ) {}

  static fromMinor(amountMinor: number, currency = "EUR"): Money {
    if (!Number.isSafeInteger(amountMinor)) throw new Error("El importe debe expresarse en unidades menores enteras.");
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error("La moneda debe ser un código ISO 4217 de tres letras.");
    return new Money(amountMinor, currency);
  }

  static fromMajor(amount: number, currency = "EUR"): Money {
    if (!Number.isFinite(amount)) throw new Error("El importe no es válido.");
    return Money.fromMinor(Math.round(amount * 100), currency);
  }

  get amount(): number {
    return this.amountMinor / 100;
  }
}

export class Sku {
  private constructor(public readonly value: string) {}
  static create(value: string): Sku {
    const normalized = value.trim().toUpperCase();
    if (!normalized || normalized.length > 80) throw new Error("SKU no válido.");
    return new Sku(normalized);
  }
}

export class Barcode {
  private constructor(public readonly value: string) {}
  static create(value: string): Barcode {
    const normalized = value.replace(/\s/g, "");
    if (!/^\d{8,14}$/.test(normalized)) throw new Error("Código de barras no válido.");
    return new Barcode(normalized);
  }
}

export type DimensionUnit = "mm" | "cm" | "m";
export class Dimensions {
  private constructor(
    public readonly width: number,
    public readonly height: number,
    public readonly depth: number | null,
    public readonly unit: DimensionUnit
  ) {}
  static create(width: number, height: number, depth: number | null = null, unit: DimensionUnit = "mm"): Dimensions {
    const values = [width, height, ...(depth === null ? [] : [depth])];
    if (values.some((value) => !Number.isFinite(value) || value <= 0)) throw new Error("Las dimensiones deben ser positivas.");
    return new Dimensions(width, height, depth, unit);
  }
}

export class Weight {
  private constructor(public readonly grams: number) {}
  static fromGrams(grams: number): Weight {
    if (!Number.isFinite(grams) || grams < 0) throw new Error("El peso no es válido.");
    return new Weight(grams);
  }
}

export class LocaleCode {
  private constructor(public readonly value: string) {}
  static create(value: string): LocaleCode {
    const normalized = value.trim();
    if (!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(normalized)) throw new Error("Locale no válido.");
    return new LocaleCode(normalized);
  }
}

export class HexColor {
  private constructor(public readonly value: string) {}
  static create(value: string): HexColor {
    const normalized = value.trim().toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) throw new Error("Color hexadecimal no válido.");
    return new HexColor(normalized);
  }
}
