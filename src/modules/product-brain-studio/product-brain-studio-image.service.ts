import {
  access,
  readFile,
} from "node:fs/promises";
import {
  extname,
  isAbsolute,
  join,
  normalize,
  resolve,
} from "node:path";

import {
  makitoFetchBinary,
} from "../provider-engine/makito-client.js";
import {
  defaultProductBrainStudioRepository,
  ProductBrainStudioRepository,
} from "./product-brain-studio.repository.js";

export interface ProductBrainStudioImage {
  readonly bytes: Uint8Array;
  readonly contentType: string;
  readonly source:
    | "LOCAL"
    | "MAKITO_AUTHENTICATED"
    | "DATA_URL";
  readonly sourceReference: string;
}

const MIME_BY_EXTENSION:
  Readonly<Record<string, string>> =
  Object.freeze({
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  });

function mimeFromPath(
  path: string,
): string {
  return (
    MIME_BY_EXTENSION[
      extname(
        path
          .split("?")[0] ??
          path,
      ).toLowerCase()
    ] ??
    "application/octet-stream"
  );
}

function decodeDataUrl(
  source: string,
): ProductBrainStudioImage {
  const match =
    source.match(
      /^data:([^;,]+)?(;base64)?,(.*)$/su,
    );

  if (!match) {
    throw new Error(
      "Data URL de imagen inválida.",
    );
  }

  const contentType =
    match[1] ??
    "application/octet-stream";
  const encoded =
    match[3] ?? "";
  const bytes =
    match[2]
      ? Buffer.from(
          encoded,
          "base64",
        )
      : Buffer.from(
          decodeURIComponent(
            encoded,
          ),
          "utf8",
        );

  return Object.freeze({
    bytes:
      new Uint8Array(bytes),
    contentType,
    source: "DATA_URL",
    sourceReference:
      "data-url",
  });
}

function localCandidates(
  source: string,
): readonly string[] {
  const cwd = process.cwd();
  const cleaned =
    source
      .replace(/^file:\/+/iu, "")
      .replace(/[?#].*$/u, "")
      .replace(/\\/gu, "/");

  const candidates =
    new Set<string>();

  if (isAbsolute(source)) {
    candidates.add(
      normalize(source),
    );
  }

  if (
    /^[a-z]:\//iu.test(cleaned)
  ) {
    candidates.add(
      normalize(cleaned),
    );
  }

  const relative =
    cleaned.replace(/^\/+/u, "");

  candidates.add(
    resolve(cwd, relative),
  );
  candidates.add(
    resolve(
      cwd,
      "public",
      relative,
    ),
  );
  candidates.add(
    resolve(
      cwd,
      "storage",
      relative.replace(
        /^storage\//u,
        "",
      ),
    ),
  );
  candidates.add(
    resolve(
      cwd,
      "apps",
      "recuerdarte-web",
      "public",
      relative,
    ),
  );

  const basename =
    relative.split("/").at(-1);

  if (basename) {
    candidates.add(
      join(
        cwd,
        "storage",
        "providers",
        "makito",
        "images",
        basename,
      ),
    );
    candidates.add(
      join(
        cwd,
        "storage",
        "media",
        basename,
      ),
    );
  }

  return Object.freeze(
    [...candidates],
  );
}

async function existingLocalFile(
  source: string,
): Promise<string | undefined> {
  for (const candidate of
    localCandidates(source)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  return undefined;
}

function isRemoteUrl(
  source: string,
): boolean {
  return (
    source.startsWith("http://") ||
    source.startsWith("https://")
  );
}

export class ProductBrainStudioImageService {
  constructor(
    private readonly repository:
      ProductBrainStudioRepository =
      defaultProductBrainStudioRepository,
  ) {}

  async get(
    productId: string,
    imageIndex: number,
  ): Promise<ProductBrainStudioImage> {
    const product =
      await this.repository.findById(
        productId,
      );

    if (!product) {
      throw new Error(
        `Producto ${productId} no encontrado.`,
      );
    }

    const source =
      product.images[imageIndex];

    if (!source) {
      throw new Error(
        `La imagen ${imageIndex} no existe para ${productId}.`,
      );
    }

    if (
      source.startsWith(
        "data:image/",
      )
    ) {
      return decodeDataUrl(source);
    }

    const local =
      await existingLocalFile(
        source,
      );

    if (local) {
      const bytes =
        await readFile(local);

      return Object.freeze({
        bytes:
          new Uint8Array(bytes),
        contentType:
          mimeFromPath(local),
        source: "LOCAL",
        sourceReference: local,
      });
    }

    if (!isRemoteUrl(source)) {
      throw new Error(
        `No se encontró la copia local de ${source}.`,
      );
    }

    /*
     * La URL pertenece al proveedor Makito y requiere
     * OAuth. Se reutiliza el cliente oficial del
     * Provider Engine para obtener/renovar el token.
     */
    const media =
      await makitoFetchBinary(
        {},
        source,
      );

    const contentType =
      media.contentType
        ?.split(";")[0]
        ?.trim() ??
      mimeFromPath(source);

    const extension =
      extname(
        new URL(source).pathname,
      ).toLowerCase();

    const imageByExtension =
      [
        ".avif",
        ".gif",
        ".jpeg",
        ".jpg",
        ".png",
        ".svg",
        ".webp",
      ].includes(extension);

    if (
      !contentType.startsWith(
        "image/",
      ) &&
      !imageByExtension
    ) {
      throw new Error(
        `El recurso autenticado no es una imagen (${contentType}).`,
      );
    }

    return Object.freeze({
      bytes:
        new Uint8Array(
          media.bytes,
        ),
      contentType,
      source:
        "MAKITO_AUTHENTICATED",
      sourceReference: source,
    });
  }
}

export const
  defaultProductBrainStudioImages =
    new ProductBrainStudioImageService();
