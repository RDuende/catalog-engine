import { createHash, randomUUID } from "node:crypto";

export type MvpDesignStyle =
  | "ETHEREAL"
  | "EDITORIAL"
  | "MEMORY_COLLAGE";

export interface MvpDesignStudioInput {
  readonly proposalId: string;
  readonly productId: string;
  readonly name?: string;
  readonly dedication?: string;
  readonly date?: string;
  readonly colors?: readonly string[];
  readonly photoUrl?: string;
  readonly notes?: string;
  readonly proposalTitle?: string;
  readonly now?: string;
}

export interface MvpDesignVariant {
  readonly id: string;
  readonly style: MvpDesignStyle;
  readonly title: string;
  readonly description: string;
  readonly headline: string;
  readonly supportingText: string;
  readonly palette: readonly string[];
  readonly typography: {
    readonly display: string;
    readonly body: string;
    readonly alignment: "LEFT" | "CENTER";
  };
  readonly layout: {
    readonly composition: string;
    readonly imagePlacement: "BACKGROUND" | "FRAME" | "SPLIT";
    readonly textPlacement: "TOP" | "CENTER" | "BOTTOM";
  };
  readonly prompt: string;
  readonly selected: boolean;
}

export interface MvpDesignSet {
  readonly id: string;
  readonly sessionId: string;
  readonly proposalId: string;
  readonly productId: string;
  readonly fingerprint: string;
  readonly variants: readonly MvpDesignVariant[];
  readonly selectedVariantId?: string;
  readonly version: number;
  readonly generatedAt: string;
  readonly updatedAt: string;
}

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

function normalizedColors(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze(
    [...new Set((values ?? []).map((value) => value.trim()).filter(Boolean))].slice(0, 5),
  );
}

function fallbackPalette(colors: readonly string[]): readonly string[] {
  return colors.length
    ? colors
    : Object.freeze(["marfil", "malva suave", "verde salvia"]);
}

function fingerprint(input: MvpDesignStudioInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        proposalId: input.proposalId,
        productId: input.productId,
        name: clean(input.name),
        dedication: clean(input.dedication),
        date: clean(input.date),
        colors: normalizedColors(input.colors),
        photoUrl: clean(input.photoUrl),
        notes: clean(input.notes),
        proposalTitle: clean(input.proposalTitle),
      }),
    )
    .digest("hex");
}

function prompt(
  style: MvpDesignStyle,
  input: MvpDesignStudioInput,
  palette: readonly string[],
): string {
  const subject = clean(input.proposalTitle) || "regalo personalizado";
  const name = clean(input.name) || "destinatario";
  const dedication = clean(input.dedication) || "dedicatoria emotiva";
  const photo = clean(input.photoUrl) ? "con fotografía aportada por el usuario" : "sin fotografía";
  return [
    `Diseño ${style.toLowerCase()} para ${subject}.`,
    `Personalizado para ${name}.`,
    `Texto principal: ${dedication}.`,
    `Paleta: ${palette.join(", ")}.`,
    photo,
    "Composición lista para adaptar al área imprimible del producto.",
  ].join(" ");
}

function variant(
  id: string,
  style: MvpDesignStyle,
  input: MvpDesignStudioInput,
  palette: readonly string[],
): MvpDesignVariant {
  const name = clean(input.name) || "Un recuerdo especial";
  const dedication =
    clean(input.dedication) ||
    "Hay momentos que merecen quedarse para siempre.";
  const date = clean(input.date);

  if (style === "ETHEREAL") {
    return Object.freeze({
      id,
      style,
      title: "Etérea",
      description: "Suave, emocional y luminosa; deja respirar la fotografía y las palabras.",
      headline: name,
      supportingText: [dedication, date].filter(Boolean).join(" · "),
      palette,
      typography: Object.freeze({
        display: "Serif elegante",
        body: "Sans humanista",
        alignment: "CENTER",
      }),
      layout: Object.freeze({
        composition: "Capas suaves, aire y foco central",
        imagePlacement: clean(input.photoUrl) ? "BACKGROUND" : "FRAME",
        textPlacement: "CENTER",
      }),
      prompt: prompt(style, input, palette),
      selected: false,
    });
  }

  if (style === "EDITORIAL") {
    return Object.freeze({
      id,
      style,
      title: "Editorial",
      description: "Ordenada y contemporánea, con jerarquía clara y acabado de revista.",
      headline: name,
      supportingText: [date, dedication].filter(Boolean).join("\n"),
      palette: Object.freeze([...palette].reverse()),
      typography: Object.freeze({
        display: "Sans geométrica",
        body: "Serif editorial",
        alignment: "LEFT",
      }),
      layout: Object.freeze({
        composition: "Retícula asimétrica con bloques definidos",
        imagePlacement: clean(input.photoUrl) ? "SPLIT" : "FRAME",
        textPlacement: "BOTTOM",
      }),
      prompt: prompt(style, input, [...palette].reverse()),
      selected: false,
    });
  }

  return Object.freeze({
    id,
    style,
    title: "Collage de recuerdos",
    description: "Más cálida y narrativa, pensada para reunir fecha, imagen y pequeños detalles.",
    headline: name,
    supportingText: [dedication, date].filter(Boolean).join(" — "),
    palette,
    typography: Object.freeze({
      display: "Manuscrita controlada",
      body: "Sans redondeada",
      alignment: "CENTER",
    }),
    layout: Object.freeze({
      composition: "Marcos superpuestos, textura sutil y detalles memorables",
      imagePlacement: clean(input.photoUrl) ? "FRAME" : "BACKGROUND",
      textPlacement: "TOP",
    }),
    prompt: prompt(style, input, palette),
    selected: false,
  });
}

export class InMemoryMvpDesignStudioRepository {
  readonly #sets = new Map<string, MvpDesignSet>();

  private key(sessionId: string, proposalId: string): string {
    return `${sessionId}:${proposalId}`;
  }

  get(sessionId: string, proposalId: string): MvpDesignSet | undefined {
    return this.#sets.get(this.key(sessionId, proposalId));
  }

  generate(sessionId: string, input: MvpDesignStudioInput): MvpDesignSet {
    const now = input.now ?? new Date().toISOString();
    const previous = this.get(sessionId, input.proposalId);
    const nextFingerprint = fingerprint(input);

    if (previous?.fingerprint === nextFingerprint) {
      return previous;
    }

    const palette = fallbackPalette(normalizedColors(input.colors));
    const styles: readonly MvpDesignStyle[] = Object.freeze([
      "ETHEREAL",
      "EDITORIAL",
      "MEMORY_COLLAGE",
    ]);

    const variants = Object.freeze(
      styles.map((style) =>
        variant(
          createHash("sha256")
            .update(`${sessionId}:${input.proposalId}:${style}:${nextFingerprint}`)
            .digest("hex")
            .slice(0, 18),
          style,
          input,
          palette,
        ),
      ),
    );

    const set = Object.freeze({
      id: previous?.id ?? randomUUID(),
      sessionId,
      proposalId: input.proposalId,
      productId: input.productId,
      fingerprint: nextFingerprint,
      variants,
      version: (previous?.version ?? 0) + 1,
      generatedAt: now,
      updatedAt: now,
    } satisfies MvpDesignSet);

    this.#sets.set(this.key(sessionId, input.proposalId), set);
    return set;
  }

  select(
    sessionId: string,
    proposalId: string,
    variantId: string,
    now = new Date().toISOString(),
  ): MvpDesignSet {
    const current = this.get(sessionId, proposalId);
    if (!current) {
      throw new Error(`No existen diseños para la propuesta ${proposalId}.`);
    }
    if (!current.variants.some((item) => item.id === variantId)) {
      throw new Error(`No existe la variante ${variantId}.`);
    }

    const updated = Object.freeze({
      ...current,
      selectedVariantId: variantId,
      variants: Object.freeze(
        current.variants.map((item) =>
          Object.freeze({ ...item, selected: item.id === variantId }),
        ),
      ),
      version: current.version + 1,
      updatedAt: now,
    });

    this.#sets.set(this.key(sessionId, proposalId), updated);
    return updated;
  }
}
