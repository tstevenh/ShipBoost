import { v2 as cloudinary } from "cloudinary";

const FAVICON_PROVIDER_HOSTNAME = "favicon.im";
const DEFAULT_LOGO_FETCH_TIMEOUT_MS = 10000;

export function isFaviconProviderUrl(value) {
  if (!value) {
    return false;
  }

  try {
    return new URL(value).hostname === FAVICON_PROVIDER_HOSTNAME;
  } catch {
    return false;
  }
}

export function buildFaviconProviderUrl(websiteUrl, { larger = false } = {}) {
  if (!websiteUrl) {
    return null;
  }

  try {
    const hostname = new URL(websiteUrl).hostname.replace(/^www\./, "");

    if (!hostname) {
      return null;
    }

    const url = new URL(`https://${FAVICON_PROVIDER_HOSTNAME}/${hostname}`);

    if (larger) {
      url.searchParams.set("larger", "true");
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function configureCloudinaryFromEnv() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const uploadFolder = process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "shipboost";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return uploadFolder;
}

export async function validateRemoteLogoUrl(
  url,
  { timeoutMs = DEFAULT_LOGO_FETCH_TIMEOUT_MS } = {},
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/*,*/*;q=0.8",
        "user-agent": "ShipBoostLogoBackfill/1.0 (+https://shipboost.io)",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const bytes = Buffer.from(await response.arrayBuffer());

    return {
      ok: response.ok && contentType.toLowerCase().startsWith("image/") && bytes.length > 0,
      status: response.status,
      contentType,
      byteLength: bytes.length,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function uploadFaviconLogoToCloudinary({
  sourceUrl,
  slug,
  uploadFolder,
}) {
  const publicId = `seeded-logo-${slug}`;
  const uploadOptions = {
    resource_type: "image",
    folder: `${uploadFolder}/logos`,
    public_id: publicId,
    overwrite: true,
    invalidate: true,
    format: "webp",
    transformation: [{ quality: "auto:good" }],
    filename_override: publicId,
  };

  let result;

  try {
    result = await cloudinary.uploader.upload(sourceUrl, uploadOptions);
  } catch (error) {
    if (error?.http_code !== 400 || !/empty file/i.test(error?.message ?? "")) {
      throw error;
    }

    const response = await fetch(sourceUrl, {
      headers: {
        accept: "image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/*,*/*;q=0.8",
        "user-agent": "ShipBoostLogoBackfill/1.0 (+https://shipboost.io)",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const bytes = Buffer.from(await response.arrayBuffer());

    if (!response.ok || !contentType.toLowerCase().startsWith("image/") || bytes.length === 0) {
      throw error;
    }

    const dataUri = `data:${contentType};base64,${bytes.toString("base64")}`;
    result = await cloudinary.uploader.upload(dataUri, uploadOptions);
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format ?? undefined,
    width: result.width ?? undefined,
    height: result.height ?? undefined,
  };
}
