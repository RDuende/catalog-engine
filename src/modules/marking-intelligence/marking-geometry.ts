import {
  getMarkingProfile,
  saveMarkingProfile,
} from "./marking-intelligence.service.js";

import type {
  MarkingPlacement,
  ProductMarkingArea,
  ProductMarkingProfile,
} from "./marking-intelligence.types.js";

export type MarkingGeometrySource =
  | "PROVIDER_IMAGE"
  | "AUTO"
  | "ADMIN";

export interface MarkingGeometryUpdate {
  readonly areaId: string;
  readonly placement: MarkingPlacement;
}

function finite(
  value: unknown,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function normalizedPoint(
  value: unknown,
):
  | { readonly x: number; readonly y: number }
  | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  const raw =
    value as Record<string, unknown>;

  if (
    !finite(raw.x) ||
    !finite(raw.y) ||
    raw.x < 0 ||
    raw.y < 0 ||
    raw.x > 1 ||
    raw.y > 1
  ) {
    return undefined;
  }

  return Object.freeze({
    x: raw.x,
    y: raw.y,
  });
}

export function validatePlacementGeometry(
  value: unknown,
):
  | {
      readonly ok: true;
      readonly value: MarkingPlacement;
    }
  | {
      readonly ok: false;
      readonly error: string;
    } {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      ok: false,
      error: "placement debe ser un objeto",
    };
  }

  const raw =
    value as Record<string, unknown>;

  if (
    !finite(raw.x) ||
    !finite(raw.y) ||
    !finite(raw.width) ||
    !finite(raw.height)
  ) {
    return {
      ok: false,
      error:
        "x, y, width y height deben ser números finitos",
    };
  }

  const {
    x,
    y,
    width,
    height,
  } = raw;

  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0
  ) {
    return {
      ok: false,
      error:
        "El origen debe ser >= 0 y el tamaño > 0",
    };
  }

  if (
    x > 1 ||
    y > 1 ||
    width > 1 ||
    height > 1 ||
    x + width > 1 ||
    y + height > 1
  ) {
    return {
      ok: false,
      error:
        "La geometría debe quedar dentro de la imagen (0..1)",
    };
  }

  const rotation =
    finite(raw.rotation)
      ? raw.rotation
      : undefined;

  let corners:
    MarkingPlacement["corners"]
    | undefined;

  if (
    raw.corners !== undefined
  ) {
    if (
      !raw.corners ||
      typeof raw.corners !== "object" ||
      Array.isArray(raw.corners)
    ) {
      return {
        ok: false,
        error:
          "corners debe ser un objeto válido",
      };
    }

    const source =
      raw.corners as Record<
        string,
        unknown
      >;

    const topLeft =
      normalizedPoint(
        source.topLeft,
      );
    const topRight =
      normalizedPoint(
        source.topRight,
      );
    const bottomRight =
      normalizedPoint(
        source.bottomRight,
      );
    const bottomLeft =
      normalizedPoint(
        source.bottomLeft,
      );

    if (
      !topLeft ||
      !topRight ||
      !bottomRight ||
      !bottomLeft
    ) {
      return {
        ok: false,
        error:
          "Las cuatro esquinas deben tener coordenadas normalizadas 0..1",
      };
    }

    corners = Object.freeze({
      topLeft,
      topRight,
      bottomRight,
      bottomLeft,
    });
  }

  const geometrySource:
    MarkingGeometrySource =
      raw.geometrySource ===
        "PROVIDER_IMAGE" ||
      raw.geometrySource ===
        "AUTO" ||
      raw.geometrySource ===
        "ADMIN"
        ? raw.geometrySource
        : "ADMIN";

  const confidence =
    finite(raw.confidence)
      ? Math.max(
          0,
          Math.min(
            1,
            raw.confidence,
          ),
        )
      : undefined;

  return {
    ok: true,
    value: Object.freeze({
      x,
      y,
      width,
      height,
      ...(rotation !== undefined
        ? { rotation }
        : {}),
      ...(corners
        ? { corners }
        : {}),
      geometrySource,
      ...(confidence !== undefined
        ? { confidence }
        : {}),
      calibratedAt:
        typeof raw.calibratedAt ===
          "string" &&
        raw.calibratedAt
          ? raw.calibratedAt
          : new Date().toISOString(),
    }),
  };
}

export function
isPlaceholderPlacement(
  area: ProductMarkingArea,
): boolean {
  const placement =
    area.placement;

  return (
    placement.x === 0 &&
    placement.y === 0 &&
    placement.width === 1 &&
    placement.height === 1 &&
    !placement.corners
  );
}

export function geometryStatus(
  area: ProductMarkingArea,
):
  | "CALIBRATED"
  | "PLACEHOLDER" {
  return isPlaceholderPlacement(area)
    ? "PLACEHOLDER"
    : "CALIBRATED";
}

export async function
updateProductMarkingGeometry(
  productId: string,
  updates:
    readonly MarkingGeometryUpdate[],
): Promise<ProductMarkingProfile> {
  const current =
    await getMarkingProfile(
      productId,
    );

  if (!current) {
    throw new Error(
      `No existe perfil de marcaje para ${productId}`,
    );
  }

  const byArea =
    new Map(
      updates.map(
        (update) =>
          [
            update.areaId,
            update.placement,
          ] as const,
      ),
    );

  const unknown =
    updates
      .map(
        (update) =>
          update.areaId,
      )
      .filter(
        (areaId) =>
          !current.areas.some(
            (area) =>
              area.id === areaId,
          ),
      );

  if (unknown.length) {
    throw new Error(
      `Áreas desconocidas: ${unknown.join(", ")}`,
    );
  }

  const areas =
    current.areas.map(
      (area) => {
        const placement =
          byArea.get(area.id);

        if (!placement) {
          return area;
        }

        return Object.freeze({
          ...area,
          placement,
          source:
            "ADMIN" as const,
        });
      },
    );

  return saveMarkingProfile({
    ...current,
    areas:
      Object.freeze(areas),
    updatedAt:
      new Date().toISOString(),
    updatedBy:
      "admin-geometry",
  });
}

export function geometryView(
  profile: ProductMarkingProfile,
) {
  return Object.freeze({
    productId:
      profile.productId,
    providerKey:
      profile.providerKey,
    providerProductId:
      profile.providerProductId,
    commercialImageUrl:
      profile.commercialImageUrl,
    mockupBaseImageUrl:
      profile.mockupBaseImageUrl,
    areas:
      Object.freeze(
        profile.areas.map(
          (area) =>
            Object.freeze({
              areaId:
                area.id,
              name:
                area.name,
              providerAreaId:
                area.providerAreaId,
              providerPositionId:
                area.providerPositionId,
              markingPreviewImageUrl:
                area.markingPreviewImageUrl,
              baseImageUrl:
                area.baseImageUrl,
              maxWidthMm:
                area.maxWidthMm,
              maxHeightMm:
                area.maxHeightMm,
              placement:
                area.placement,
              geometryStatus:
                geometryStatus(area),
              techniques:
                Object.freeze(
                  area.techniques.map(
                    (technique) =>
                      Object.freeze({
                        code:
                          technique.code,
                        name:
                          technique.name,
                        providerCode:
                          technique.providerCode,
                        providerVariantCode:
                          technique.providerVariantCode,
                        providerOfficial:
                          technique.providerOfficial,
                      }),
                  ),
                ),
            }),
        ),
      ),
  });
}
