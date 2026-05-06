import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { getTagDisplayName, slugify } from "./tag-display-name.mjs";

const prisma = new PrismaClient();

const csvPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : null;

if (!csvPath) {
  console.error("Usage: node scripts/import-enriched-tools-basic.mjs <enriched.csv>");
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
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
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

function mapPricingModel(value) {
  switch (value.trim().toLowerCase()) {
    case "free":
      return "FREE";
    case "freemium":
      return "FREEMIUM";
    case "paid":
      return "PAID";
    case "custom":
      return "CUSTOM";
    case "contact_sales":
    case "contact sales":
      return "CONTACT_SALES";
    default:
      throw new Error(`Unsupported pricing model: ${value}`);
  }
}

async function createUniqueToolSlug(baseValue) {
  const baseSlug = slugify(baseValue) || "tool";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.tool.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

async function main() {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const categoryBySlug = new Map(
    (
      await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true },
      })
    ).map((category) => [category.slug, category.id]),
  );
  const tagBySlug = new Map(
    (
      await prisma.tag.findMany({
        select: { id: true, slug: true },
      })
    ).map((tag) => [tag.slug, tag.id]),
  );

  let createdCount = 0;
  let updatedCount = 0;
  const skippedExisting = [];

  for (const row of rows) {
    const baseSlug = slugify(row.name);
    const existingTool = await prisma.tool.findFirst({
      where: {
        OR: [{ websiteUrl: row.url }, { name: row.name }, ...(baseSlug ? [{ slug: baseSlug }] : [])],
      },
      select: { id: true, slug: true },
    });

    const categorySlug = slugify(row.category);
    const categoryId = categoryBySlug.get(categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category "${row.category}" for ${row.name}`);
    }

    const tagIds = [];
    for (const value of [row.tag_1, row.tag_2, row.tag_3, row.tag_4, row.tag_5]) {
      const tagSlug = slugify(value);
      if (!tagSlug || tagSlug === categorySlug) {
        continue;
      }

      let tagId = tagBySlug.get(tagSlug);
      if (!tagId) {
        const tag = await prisma.tag.create({
          data: {
            slug: tagSlug,
            name: getTagDisplayName(value),
            isActive: true,
          },
          select: { id: true },
        });
        tagId = tag.id;
        tagBySlug.set(tagSlug, tagId);
      }
      tagIds.push(tagId);
    }

    const slug = existingTool?.slug ?? (await createUniqueToolSlug(row.name));

    const tool = await prisma.tool.upsert({
      where: { slug },
      update: {
        name: row.name,
        websiteUrl: row.url,
        tagline: row.tagline,
        richDescription: row.rich_description,
        pricingModel: mapPricingModel(row.pricing_model),
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        internalNote: "Imported from cluster 21-30 enriched CSV",
      },
      create: {
        slug,
        name: row.name,
        websiteUrl: row.url,
        tagline: row.tagline,
        richDescription: row.rich_description,
        pricingModel: mapPricingModel(row.pricing_model),
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        internalNote: "Imported from cluster 21-30 enriched CSV",
      },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.toolCategory.deleteMany({ where: { toolId: tool.id } }),
      prisma.toolCategory.create({
        data: {
          toolId: tool.id,
          categoryId,
          sortOrder: 0,
        },
      }),
      prisma.toolTag.deleteMany({ where: { toolId: tool.id } }),
      ...(tagIds.length > 0
        ? [
            prisma.toolTag.createMany({
              data: tagIds.map((tagId, index) => ({
                toolId: tool.id,
                tagId,
                sortOrder: index,
              })),
            }),
          ]
        : []),
    ]);

    if (existingTool) {
      updatedCount += 1;
      skippedExisting.push(row.name);
    } else {
      createdCount += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        file: csvPath,
        rowCount: rows.length,
        createdCount,
        updatedCount,
        updatedNames: skippedExisting,
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
