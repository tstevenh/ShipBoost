import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { getTagDisplayName, slugify } from "./tag-display-name.mjs";

const prisma = new PrismaClient();
const csvPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;

if (!csvPath) {
  console.error("Usage: node scripts/import-missing-enriched-tools-basic.mjs <enriched.csv>");
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

function mapPricingModel(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "free") return "FREE";
  if (normalized === "freemium") return "FREEMIUM";
  if (normalized === "paid") return "PAID";
  if (normalized === "custom") return "CUSTOM";
  if (normalized === "contact_sales" || normalized === "contact sales") return "CONTACT_SALES";
  throw new Error(`Unsupported pricing model: ${value}`);
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

async function getOrCreateTagId(tagName) {
  const slug = slugify(tagName);
  const existing = await prisma.tag.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const tag = await prisma.tag.create({
    data: {
      slug,
      name: getTagDisplayName(tagName),
      isActive: true,
    },
    select: { id: true },
  });

  return tag.id;
}

try {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const categoryBySlug = new Map(
    (
      await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, slug: true },
      })
    ).map((category) => [category.slug, category.id]),
  );

  let createdCount = 0;
  let skippedCount = 0;
  const created = [];
  const skipped = [];

  for (const row of rows) {
    const baseSlug = slugify(row.name);
    const existing = await prisma.tool.findFirst({
      where: {
        OR: [{ name: row.name }, { websiteUrl: row.url }, ...(baseSlug ? [{ slug: baseSlug }] : [])],
      },
      select: { id: true, slug: true, name: true },
    });

    if (existing) {
      skippedCount += 1;
      skipped.push(row.name);
      continue;
    }

    process.stderr.write(`Creating ${row.name}\n`);

    const categorySlug = slugify(row.category);
    const categoryId = categoryBySlug.get(categorySlug);
    if (!categoryId) {
      throw new Error(`Unknown category "${row.category}" for ${row.name}`);
    }

    const tagIds = [];
    for (const tagName of [row.tag_1, row.tag_2, row.tag_3, row.tag_4, row.tag_5]) {
      const tagSlug = slugify(tagName);
      if (!tagSlug || tagSlug === categorySlug) continue;
      tagIds.push(await getOrCreateTagId(tagName));
    }

    const tool = await prisma.tool.create({
      data: {
        slug: await createUniqueToolSlug(row.name),
        name: row.name,
        websiteUrl: row.url,
        tagline: row.tagline,
        richDescription: row.rich_description,
        pricingModel: mapPricingModel(row.pricing_model),
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        internalNote: "Imported from cluster 21-30 enriched CSV",
      },
      select: { id: true, slug: true, name: true },
    });

    await prisma.toolCategory.create({
      data: { toolId: tool.id, categoryId, sortOrder: 0 },
    });

    if (tagIds.length > 0) {
      await prisma.toolTag.createMany({
        data: tagIds.map((tagId, index) => ({
          toolId: tool.id,
          tagId,
          sortOrder: index,
        })),
      });
    }

    createdCount += 1;
    created.push(tool.name);
  }

  console.log(
    JSON.stringify(
      {
        rowCount: rows.length,
        createdCount,
        skippedCount,
        created,
        skipped,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
