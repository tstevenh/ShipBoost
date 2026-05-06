import fs from "node:fs";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";

import {
  buildFaviconProviderUrl,
  configureCloudinaryFromEnv,
} from "./favicon-logo-cloudinary.mjs";

const prisma = new PrismaClient();
const csvPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
const EXECUTE = process.argv.includes("--execute");
const FETCH_TIMEOUT_MS = 12000;
const UPLOAD_TIMEOUT_MS = 25000;

if (!csvPath) {
  console.error("Usage: node scripts/backfill-cluster-21-30-missing-logos.mjs <enriched.csv> [--execute]");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

async function fetchLogoBytes(sourceUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: {
        accept: "image/avif,image/webp,image/svg+xml,image/png,image/jpeg,image/*,*/*;q=0.8",
        "user-agent": "ShipBoostLogoBackfill/1.0 (+https://shipboost.io)",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const bytes = Buffer.from(await response.arrayBuffer());

    if (!response.ok) {
      throw new Error(`Logo returned HTTP ${response.status}`);
    }

    if (!contentType.toLowerCase().startsWith("image/")) {
      throw new Error(`Logo returned ${contentType || "unknown content type"}`);
    }

    if (bytes.length === 0) {
      throw new Error("Logo response was empty");
    }

    return { bytes, contentType };
  } finally {
    clearTimeout(timeout);
  }
}

async function uploadLogoBytes({ bytes, slug, uploadFolder }) {
  const publicId = `seeded-logo-${slug}`;

  return await Promise.race([
    new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          folder: `${uploadFolder}/logos`,
          public_id: publicId,
          overwrite: true,
          invalidate: true,
          format: "webp",
          transformation: [{ quality: "auto:good" }],
          filename_override: publicId,
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload failed"));
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format ?? undefined,
            width: result.width ?? undefined,
            height: result.height ?? undefined,
          });
        },
      );

      stream.end(bytes);
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Cloudinary logo upload timed out")), UPLOAD_TIMEOUT_MS),
    ),
  ]);
}

try {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const names = rows.map((row) => row.name);
  const toolByName = new Map(
    (
      await prisma.tool.findMany({
        where: { name: { in: names } },
        select: {
          id: true,
          slug: true,
          name: true,
          websiteUrl: true,
          logoMediaId: true,
        },
      })
    ).map((tool) => [tool.name, tool]),
  );

  const targets = rows
    .map((row) => toolByName.get(row.name))
    .filter(Boolean)
    .filter((tool) => !tool.logoMediaId);

  if (!EXECUTE) {
    console.log(
      JSON.stringify(
        {
          execute: false,
          targetCount: targets.length,
          targets: targets.map((tool) => ({
            slug: tool.slug,
            name: tool.name,
            sourceLogoUrl: buildFaviconProviderUrl(tool.websiteUrl, { larger: true }),
          })),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  const uploadFolder = configureCloudinaryFromEnv();
  const results = [];

  for (const tool of targets) {
    const sourceLogoUrl = buildFaviconProviderUrl(tool.websiteUrl, { larger: true });

    try {
      process.stderr.write(`Uploading logo for ${tool.name}\n`);
      const logo = await fetchLogoBytes(sourceLogoUrl);
      const uploaded = await uploadLogoBytes({
        bytes: logo.bytes,
        slug: tool.slug,
        uploadFolder,
      });

      const logoMedia = await prisma.toolMedia.create({
        data: {
          toolId: tool.id,
          type: "LOGO",
          url: uploaded.url,
          publicId: uploaded.publicId,
          format: uploaded.format,
          width: uploaded.width,
          height: uploaded.height,
          sortOrder: 0,
        },
        select: { id: true },
      });

      await prisma.tool.update({
        where: { id: tool.id },
        data: { logoMediaId: logoMedia.id },
      });

      results.push({
        slug: tool.slug,
        status: "uploaded",
        sourceLogoUrl,
        cloudinaryUrl: uploaded.url,
        publicId: uploaded.publicId,
        width: uploaded.width,
        height: uploaded.height,
      });
    } catch (error) {
      results.push({
        slug: tool.slug,
        status: "failed",
        sourceLogoUrl,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        execute: true,
        processedCount: results.length,
        uploadedCount: results.filter((result) => result.status === "uploaded").length,
        failedCount: results.filter((result) => result.status === "failed").length,
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
