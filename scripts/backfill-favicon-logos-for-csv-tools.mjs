#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import {
  buildFaviconProviderUrl,
  configureCloudinaryFromEnv,
  uploadFaviconLogoToCloudinary,
  validateRemoteLogoUrl,
} from "./favicon-logo-cloudinary.mjs";

const prisma = new PrismaClient();
const csvPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
const shouldExecute = process.argv.includes("--execute");
const shouldReplace = process.argv.includes("--replace");
const shouldSkipInvalid = process.argv.includes("--skip-invalid");

if (!csvPath) {
  console.error(
    "Usage: node scripts/backfill-favicon-logos-for-csv-tools.mjs <enriched.csv> [--execute] [--replace] [--skip-invalid]",
  );
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

async function main() {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const names = rows.map((row) => row.name);
  const tools = await prisma.tool.findMany({
    where: {
      name: { in: names },
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      websiteUrl: true,
      logoMediaId: true,
    },
    orderBy: { slug: "asc" },
  });

  const toolByName = new Map(tools.map((tool) => [tool.name, tool]));
  const missingTools = names.filter((name) => !toolByName.has(name));

  if (missingTools.length > 0) {
    throw new Error(`Missing imported tools: ${missingTools.join(", ")}`);
  }

  const plan = [];

  for (const row of rows) {
    const tool = toolByName.get(row.name);

    if (!tool || (tool.logoMediaId && !shouldReplace)) {
      continue;
    }

    const sourceLogoUrl = buildFaviconProviderUrl(tool.websiteUrl, { larger: true });
    const validation = sourceLogoUrl
      ? await validateRemoteLogoUrl(sourceLogoUrl)
      : { ok: false, error: "Could not build favicon URL" };

    plan.push({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      logoMediaId: tool.logoMediaId,
      sourceLogoUrl,
      validation,
    });
  }

  const invalidItems = plan.filter((item) => !item.validation.ok);

  if (!shouldExecute) {
    console.log(
      JSON.stringify(
        {
          execute: false,
          csvPath,
          csvRowCount: rows.length,
          replaceExistingLogos: shouldReplace,
          targetCount: plan.length,
          validTargetCount: plan.length - invalidItems.length,
          invalidTargetCount: invalidItems.length,
          canExecuteSafely: invalidItems.length === 0 || shouldSkipInvalid,
          items: plan,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (invalidItems.length > 0 && !shouldSkipInvalid) {
    throw new Error(
      `Refusing to execute because ${invalidItems.length} favicon logo source(s) failed validation. Use --skip-invalid to skip them.`,
    );
  }

  const uploadFolder = configureCloudinaryFromEnv();
  const executablePlan = shouldSkipInvalid
    ? plan.filter((item) => item.validation.ok)
    : plan;
  const results = [];

  for (const item of executablePlan) {
    try {
      const uploadedLogo = await uploadFaviconLogoToCloudinary({
        sourceUrl: item.sourceLogoUrl,
        slug: item.slug,
        uploadFolder,
      });

      if (item.logoMediaId) {
        await prisma.toolMedia.update({
          where: { id: item.logoMediaId },
          data: {
            type: "LOGO",
            url: uploadedLogo.url,
            publicId: uploadedLogo.publicId,
            format: uploadedLogo.format,
            width: uploadedLogo.width,
            height: uploadedLogo.height,
            sortOrder: 0,
          },
        });
      } else {
        const logoMedia = await prisma.toolMedia.create({
          data: {
            toolId: item.id,
            type: "LOGO",
            url: uploadedLogo.url,
            publicId: uploadedLogo.publicId,
            format: uploadedLogo.format,
            width: uploadedLogo.width,
            height: uploadedLogo.height,
            sortOrder: 0,
          },
          select: { id: true },
        });

        await prisma.tool.update({
          where: { id: item.id },
          data: { logoMediaId: logoMedia.id },
        });
      }

      results.push({
        slug: item.slug,
        status: "uploaded",
        sourceLogoUrl: item.sourceLogoUrl,
        cloudinaryUrl: uploadedLogo.url,
        publicId: uploadedLogo.publicId,
        width: uploadedLogo.width,
        height: uploadedLogo.height,
      });
    } catch (error) {
      results.push({
        slug: item.slug,
        status: "failed",
        sourceLogoUrl: item.sourceLogoUrl,
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
        skippedInvalidCount: invalidItems.length,
        skippedInvalid: invalidItems.map((item) => ({
          slug: item.slug,
          name: item.name,
          sourceLogoUrl: item.sourceLogoUrl,
          validation: item.validation,
        })),
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
