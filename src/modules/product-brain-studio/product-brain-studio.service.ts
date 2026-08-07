import {
  defaultCatalogInterestEnrichment,
} from "../catalog-interest-enrichment/index.js";
import {
  defaultKnowledgeBrain,
} from "../knowledge-brain/index.js";
import {
  defaultProductBrainStudioRepository,
  ProductBrainStudioRepository,
} from "./product-brain-studio.repository.js";
import type {
  ProductBrainStudioDetail,
  ProductBrainStudioProduct,
  ProductBrainStudioSearchInput,
  ProductBrainStudioStats,
  ProductBrainStudioWarning,
} from "./product-brain-studio.types.js";

function productText(
  product: ProductBrainStudioProduct,
): string {
  return [
    product.name,
    product.description ?? "",
    product.category ?? "",
    ...product.tags,
  ].join(" ");
}

function warningsFor(
  product: ProductBrainStudioProduct,
): readonly ProductBrainStudioWarning[] {
  const text =
    productText(product)
      .toLocaleLowerCase("es-ES");
  const warnings:
    ProductBrainStudioWarning[] = [];

  const suspicious:
    ReadonlyArray<{
      readonly interest: string;
      readonly terms:
        readonly string[];
      readonly message: string;
    }> = [
      {
        interest: "drums",
        terms: [
          "mah",
          "power bank",
          "usb",
          "batería externa",
        ],
        message:
          "drums aparece en un contexto probablemente electrónico.",
      },
      {
        interest:
          "heavy-metal",
        terms: [
          "acero",
          "aluminio",
          "inoxidable",
          "metálico",
          "metalica",
        ],
        message:
          "heavy-metal aparece en un contexto probablemente material.",
      },
      {
        interest: "manga",
        terms: [
          "manga corta",
          "manga larga",
          "sin mangas",
        ],
        message:
          "manga aparece en un contexto probablemente textil.",
      },
      {
        interest: "cats",
        terms: [
          "cat textil",
          "catálogo",
          "catalogo",
        ],
        message:
          "cats aparece en un contexto probablemente de catálogo.",
      },
    ];

  for (const item of suspicious) {
    if (
      product.canonicalInterests
        .includes(item.interest) &&
      item.terms.some(
        (term) =>
          text.includes(term),
      )
    ) {
      warnings.push({
        code:
          "POSSIBLE_FALSE_POSITIVE",
        severity: "WARNING",
        message: item.message,
        evidence: Object.freeze(
          item.terms.filter(
            (term) =>
              text.includes(term),
          ),
        ),
      });
    }
  }

  if (
    product.canonicalInterests
      .length === 0
  ) {
    warnings.push({
      code:
        "MISSING_INTERESTS",
      severity: "INFO",
      message:
        "El producto no tiene intereses canónicos.",
      evidence: Object.freeze([]),
    });
  }

  if (
    product.materials.length === 0
  ) {
    warnings.push({
      code:
        "MISSING_MATERIALS",
      severity: "INFO",
      message:
        "El producto no tiene materiales clasificados.",
      evidence: Object.freeze([]),
    });
  }

  if (
    product.techniques.length === 0
  ) {
    warnings.push({
      code:
        "MISSING_TECHNIQUES",
      severity: "INFO",
      message:
        "El producto no tiene técnicas clasificadas.",
      evidence: Object.freeze([]),
    });
  }

  if (product.roles.length === 0) {
    warnings.push({
      code: "MISSING_ROLES",
      severity: "INFO",
      message:
        "El producto no tiene roles de Product Brain.",
      evidence: Object.freeze([]),
    });
  }

  if (product.price === 0) {
    warnings.push({
      code: "ZERO_PRICE",
      severity: "WARNING",
      message:
        "El precio cero se considera desconocido y debe revisarse.",
      evidence:
        Object.freeze(["price=0"]),
    });
  }

  return Object.freeze(warnings);
}

function countValues(
  products:
    readonly ProductBrainStudioProduct[],
  selector: (
    product:
      ProductBrainStudioProduct,
  ) => readonly string[],
): readonly {
  readonly id: string;
  readonly count: number;
}[] {
  const counts =
    new Map<string, number>();

  for (const product of products) {
    for (const value of
      selector(product)) {
      counts.set(
        value,
        (counts.get(value) ?? 0) +
          1,
      );
    }
  }

  return Object.freeze(
    [...counts.entries()]
      .map(([id, count]) => ({
        id,
        count,
      }))
      .sort(
        (left, right) =>
          right.count - left.count,
      )
      .slice(0, 50),
  );
}

export class ProductBrainStudioService {
  constructor(
    private readonly repository:
      ProductBrainStudioRepository =
      defaultProductBrainStudioRepository,
  ) {}

  async search(
    input:
      ProductBrainStudioSearchInput,
  ) {
    const result =
      await this.repository.search(
        input,
      );

    if (!input.warningsOnly) {
      return result;
    }

    const items =
      result.items.filter(
        (product) =>
          warningsFor(product)
            .some(
              (warning) =>
                warning.severity ===
                "WARNING" ||
                warning.severity ===
                "ERROR",
            ),
      );

    return Object.freeze({
      total: items.length,
      items: Object.freeze(items),
    });
  }

  async detail(
    productId: string,
  ): Promise<ProductBrainStudioDetail> {
    const product =
      await this.repository.findById(
        productId,
      );

    if (!product) {
      throw new Error(
        `Producto ${productId} no encontrado.`,
      );
    }

    const text =
      productText(product);
    const knowledgeProfile =
      defaultKnowledgeBrain.analyze({
        text,
        existing: {
          interests:
            product
              .canonicalInterests,
          materials:
            product.materials,
          techniques:
            product.techniques,
          themes:
            product.themes,
        },
      });

    const enrichment =
      defaultCatalogInterestEnrichment
        .enrichProduct(
          product.raw as never,
        );

    const warnings =
      warningsFor(product);

    const xray:
      ProductBrainStudioDetail["xray"] =
      Object.freeze([
        {
          stage: "Proveedor",
          status: "PASS",
          summary:
            "Datos normalizados del snapshot.",
          output: product.raw,
        },
        {
          stage:
            "Knowledge Brain",
          status:
            knowledgeProfile.evidence
              .length > 0
              ? "PASS"
              : "WARNING",
          summary:
            `${knowledgeProfile.evidence.length} evidencias semánticas.`,
          output:
            knowledgeProfile,
        },
        {
          stage:
            "Catalog Enrichment",
          status:
            (
              enrichment as {
                canonicalInterests?:
                  readonly string[];
              }
            )
              .canonicalInterests
              ?.length
              ? "PASS"
              : "WARNING",
          summary:
            "Intereses canónicos y evidencia.",
          output: enrichment,
        },
        {
          stage:
            "Product Brain",
          status:
            product.productBrain
              ? "PASS"
              : "WARNING",
          summary:
            product.productBrain
              ? "Perfil Product Brain disponible."
              : "No existe perfil Product Brain persistido.",
          output:
            product.productBrain ?? {},
        },
        {
          stage:
            "Control de calidad",
          status:
            warnings.some(
              (warning) =>
                warning.severity ===
                "WARNING" ||
                warning.severity ===
                "ERROR",
            )
              ? "WARNING"
              : "PASS",
          summary:
            `${warnings.length} observaciones.`,
          output: warnings,
        },
      ]);

    return Object.freeze({
      product,
      knowledgeProfile,
      enrichment,
      warnings,
      xray,
    });
  }

  async stats():
    Promise<ProductBrainStudioStats> {
    const products =
      await this.repository.products();
    const snapshotPath =
      await this.repository
        .snapshotPath();

    const withInterests =
      products.filter(
        (product) =>
          product
            .canonicalInterests
            .length > 0,
      ).length;
    const withMaterials =
      products.filter(
        (product) =>
          product.materials.length >
          0,
      ).length;
    const withTechniques =
      products.filter(
        (product) =>
          product.techniques.length >
          0,
      ).length;
    const withRoles =
      products.filter(
        (product) =>
          product.roles.length > 0,
      ).length;
    const warningCount =
      products.filter(
        (product) =>
          warningsFor(product)
            .some(
              (warning) =>
                warning.severity ===
                  "WARNING" ||
                warning.severity ===
                  "ERROR",
            ),
      ).length;

    return Object.freeze({
      generatedAt:
        new Date().toISOString(),
      snapshotPath,
      totalProducts:
        products.length,
      withInterests,
      withoutInterests:
        products.length -
        withInterests,
      withMaterials,
      withTechniques,
      withRoles,
      warningCount,
      coveragePercent:
        products.length === 0
          ? 0
          : Math.round(
              (
                withInterests /
                products.length
              ) *
                10000,
            ) / 100,
      topInterests:
        countValues(
          products,
          (product) =>
            product
              .canonicalInterests,
        ),
      topMaterials:
        countValues(
          products,
          (product) =>
            product.materials,
        ),
      topTechniques:
        countValues(
          products,
          (product) =>
            product.techniques,
        ),
    });
  }
}

export const
  defaultProductBrainStudio =
    new ProductBrainStudioService();
