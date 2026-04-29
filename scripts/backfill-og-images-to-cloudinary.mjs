import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

import { configureCloudinaryFromEnv } from "./favicon-logo-cloudinary.mjs";

const DEFAULT_CSV_PATH =
  "/Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/Cluster 11-20/cluster-11-20-anchor-tools-enriched-master.csv";
const DEFAULT_TIMEOUT_MS = 15000;
const USER_AGENT = "ShipBoostOgImageBackfill/1.0 (+https://shipboost.io)";

const prisma = new PrismaClient();

function getFlagValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

const shouldExecute = process.argv.includes("--execute");
const shouldReplace = process.argv.includes("--replace");
const shouldFallbackToLogo = process.argv.includes("--fallback-logo");
if (shouldFallbackToLogo) {
  throw new Error(
    "Logo fallback uploads are disabled. Use only real homepage og:image/twitter:image assets for screenshots.",
  );
}
const csvPath = getFlagValue("--csv") ?? DEFAULT_CSV_PATH;
const slugFilter = new Set(
  (getFlagValue("--slugs") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);
const limit = Number.parseInt(getFlagValue("--limit") ?? "", 10);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() ?? [];

  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

function normalizeHostname(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function normalizeUrlForMatch(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString().toLowerCase();
  } catch {
    return null;
  }
}

function parseAttributes(tag) {
  const attributes = {};
  const attributePattern = /([^\s"'=<>`]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
  let match;

  while ((match = attributePattern.exec(tag))) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }

  return attributes;
}

function decodeHtmlAttribute(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x26;", "&")
    .replaceAll("&#38;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'");
}

function findSocialImageUrl(html, pageUrl) {
  const candidates = [];
  const metaPattern = /<meta\b[^>]*>/gi;
  let match;

  while ((match = metaPattern.exec(html))) {
    const attributes = parseAttributes(match[0]);
    const key = (attributes.property ?? attributes.name ?? "").toLowerCase();
    const content = attributes.content
      ? decodeHtmlAttribute(attributes.content.trim())
      : "";

    if (!content) {
      continue;
    }

    if (
      key === "og:image" ||
      key === "og:image:url" ||
      key === "twitter:image" ||
      key === "twitter:image:src"
    ) {
      candidates.push(content);
    }
  }

  for (const candidate of candidates) {
    try {
      return new URL(candidate, pageUrl).toString();
    } catch {
      // Keep looking for a valid candidate.
    }
  }

  return null;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": USER_AGENT,
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchHomepageOgImage(websiteUrl) {
  const response = await fetchWithTimeout(websiteUrl, {
    headers: {
      accept: "text/html,application/xhtml+xml",
    },
  });
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    throw new Error(`Homepage returned HTTP ${response.status}`);
  }

  if (!contentType.toLowerCase().includes("text/html")) {
    throw new Error(`Homepage returned ${contentType || "unknown content type"}`);
  }

  const html = await response.text();
  const finalUrl = response.url || websiteUrl;
  const imageUrl = findSocialImageUrl(html, finalUrl);

  if (!imageUrl) {
    throw new Error("No og:image or twitter:image found");
  }

  return imageUrl;
}

async function fetchImageBytes(imageUrl) {
  const response = await fetchWithTimeout(imageUrl, {
    headers: {
      accept: "image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/*,*/*;q=0.8",
    },
  });
  const contentType = response.headers.get("content-type") ?? "";
  const bytes = Buffer.from(await response.arrayBuffer());

  if (!response.ok) {
    throw new Error(`Image returned HTTP ${response.status}`);
  }

  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error(`Image returned ${contentType || "unknown content type"}`);
  }

  if (bytes.length === 0) {
    throw new Error("Image response was empty");
  }

  return {
    bytes,
    contentType,
  };
}

async function uploadOgImageToCloudinary({ bytes, slug, uploadFolder }) {
  const publicId = `seeded-og-${slug}`;

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: `${uploadFolder}/screenshots`,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        format: "webp",
        transformation: [{ quality: "auto:good" }],
        filename_override: publicId,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(uploadResult);
      },
    );

    stream.end(bytes);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    format: result.format ?? undefined,
    width: result.width ?? undefined,
    height: result.height ?? undefined,
  };
}

async function main() {
  const csvRows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const sourceUrls = csvRows
    .map((row) => row.url?.trim())
    .filter(Boolean);
  const sourceHosts = new Set(sourceUrls.map(normalizeHostname).filter(Boolean));
  const sourceNormalizedUrls = new Set(
    sourceUrls.map(normalizeUrlForMatch).filter(Boolean),
  );

  const tools = await prisma.tool.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      websiteUrl: true,
      media: {
        where: { type: "SCREENSHOT" },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          publicId: true,
          url: true,
          sortOrder: true,
        },
      },
      logoMedia: {
        select: {
          url: true,
        },
      },
    },
    orderBy: { slug: "asc" },
  });

  const matchedTools = tools
    .filter((tool) => {
      if (slugFilter.size > 0 && !slugFilter.has(tool.slug)) {
        return false;
      }

      const normalizedUrl = normalizeUrlForMatch(tool.websiteUrl);
      const hostname = normalizeHostname(tool.websiteUrl);

      return (
        (normalizedUrl && sourceNormalizedUrls.has(normalizedUrl)) ||
        (hostname && sourceHosts.has(hostname))
      );
    })
    .filter((tool) => shouldReplace || tool.media.length === 0)
    .slice(0, Number.isFinite(limit) ? limit : undefined);

  const plan = matchedTools.map((tool) => ({
    slug: tool.slug,
    name: tool.name,
    websiteUrl: tool.websiteUrl,
    existingScreenshotCount: tool.media.length,
  }));

  if (!shouldExecute) {
    console.log(
      JSON.stringify(
        {
          execute: false,
          csvPath: path.resolve(csvPath),
          csvRowCount: csvRows.length,
          matchedToolCount: matchedTools.length,
          replaceExistingScreenshots: shouldReplace,
          fallbackToLogo: shouldFallbackToLogo,
          tools: plan,
        },
        null,
        2,
      ),
    );
    return;
  }

  const uploadFolder = configureCloudinaryFromEnv();
  const results = [];

  for (const tool of matchedTools) {
    try {
      let sourceImageUrl = await fetchHomepageOgImage(tool.websiteUrl);
      let sourceType = "homepage-og";
      let image;

      try {
        image = await fetchImageBytes(sourceImageUrl);
      } catch (error) {
        if (!shouldFallbackToLogo || !tool.logoMedia?.url) {
          throw error;
        }

        sourceImageUrl = tool.logoMedia.url;
        sourceType = "logo-fallback";
        image = await fetchImageBytes(sourceImageUrl);
      }

      const uploaded = await uploadOgImageToCloudinary({
        bytes: image.bytes,
        slug: tool.slug,
        uploadFolder,
      });

      await prisma.$transaction(async (tx) => {
        if (shouldReplace && tool.media.length > 0) {
          await tx.toolMedia.deleteMany({
            where: {
              id: {
                in: tool.media.map((media) => media.id),
              },
            },
          });
        }

        await tx.toolMedia.create({
          data: {
            toolId: tool.id,
            type: "SCREENSHOT",
            url: uploaded.url,
            publicId: uploaded.publicId,
            format: uploaded.format,
            width: uploaded.width,
            height: uploaded.height,
            sortOrder: shouldReplace ? 0 : tool.media.length,
          },
        });
      });

      results.push({
        slug: tool.slug,
        status: "uploaded",
        sourceType,
        sourceImageUrl,
        sourceContentType: image.contentType,
        cloudinaryUrl: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
      });
    } catch (error) {
      if (shouldFallbackToLogo && tool.logoMedia?.url) {
        try {
          const image = await fetchImageBytes(tool.logoMedia.url);
          const uploaded = await uploadOgImageToCloudinary({
            bytes: image.bytes,
            slug: tool.slug,
            uploadFolder,
          });

          await prisma.toolMedia.create({
            data: {
              toolId: tool.id,
              type: "SCREENSHOT",
              url: uploaded.url,
              publicId: uploaded.publicId,
              format: uploaded.format,
              width: uploaded.width,
              height: uploaded.height,
              sortOrder: tool.media.length,
            },
          });

          results.push({
            slug: tool.slug,
            status: "uploaded",
            sourceType: "logo-fallback",
            sourceImageUrl: tool.logoMedia.url,
            sourceContentType: image.contentType,
            cloudinaryUrl: uploaded.url,
            publicId: uploaded.publicId,
            width: uploaded.width,
            height: uploaded.height,
            ogFailureMessage: error instanceof Error ? error.message : String(error),
          });
          continue;
        } catch (fallbackError) {
          results.push({
            slug: tool.slug,
            status: "failed",
            websiteUrl: tool.websiteUrl,
            message: error instanceof Error ? error.message : String(error),
            fallbackMessage:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
          continue;
        }
      }

      results.push({
        slug: tool.slug,
        status: "failed",
        websiteUrl: tool.websiteUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        execute: true,
        processedCount: results.length,
        uploadedCount: results.filter((item) => item.status === "uploaded").length,
        failedCount: results.filter((item) => item.status === "failed").length,
        results,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
