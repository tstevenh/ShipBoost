import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_USER_ID = "1iCnKbnXDil3Ng2ck4GVlMYsx8flZ2A0";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index += 1;
        continue;
      }

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
      field = "";

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }

      row = [];
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

  return rows;
}

function normalizeHeader(value) {
  return value.trim().toLowerCase();
}

function mapPricingModel(value) {
  const normalized = value.trim().toLowerCase();

  switch (normalized) {
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
      return "PAID"; // Default fallback
  }
}

function ensureAbsolutePath(inputPath) {
  return path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(process.cwd(), inputPath);
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

async function replaceToolCategories(tx, toolId, categoryIds) {
  await tx.toolCategory.deleteMany({ where: { toolId } });

  if (categoryIds.length === 0) {
    return;
  }

  await tx.toolCategory.createMany({
    data: categoryIds.map((categoryId, index) => ({
      toolId,
      categoryId,
      sortOrder: index,
    })),
  });
}

async function replaceToolTags(tx, toolId, tagIds) {
  await tx.toolTag.deleteMany({ where: { toolId } });

  if (tagIds.length === 0) {
    return;
  }

  await tx.toolTag.createMany({
    data: tagIds.map((tagId, index) => ({
      toolId,
      tagId,
      sortOrder: index,
    })),
  });
}

async function main() {
  const csvPathArg = process.argv[2];

  if (!csvPathArg) {
    throw new Error(
      "Usage: node scripts/import-affiliate-csv.mjs <path-to-csv>",
    );
  }

  const csvPath = ensureAbsolutePath(csvPathArg);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const csvText = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length < 2) {
    throw new Error("CSV file has no data rows.");
  }

  const [headerRow, ...dataRows] = parsedRows;
  const headerMap = new Map(
    headerRow.map((header, index) => [normalizeHeader(header), index]),
  );

  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryBySlug = new Map(categories.map((item) => [item.slug, item.id]));
  const categorySlugs = new Set(categories.map((item) => item.slug));

  const tagBySlug = new Map(
    (
      await prisma.tag.findMany({
        select: { id: true, slug: true, name: true },
      })
    ).map((tag) => [tag.slug, tag]),
  );

  let createdCount = 0;
  let updatedCount = 0;

  for (const rawRow of dataRows) {
    const getVal = (h) => rawRow[headerMap.get(h)]?.trim() ?? "";
    
    const name = getVal("name");
    const websiteUrl = getVal("url");
    if (!name || !websiteUrl) continue;

    const tagline = getVal("tagline");
    const richDescription = getVal("rich_description");
    const pricingModel = mapPricingModel(getVal("pricing_model"));
    const logoUrl = getVal("logo_url");
    const affiliateUrl = getVal("affiliate_url");
    const categorySlug = slugify(getVal("category"));

    const tagNames = [
      getVal("tag_1"),
      getVal("tag_2"),
      getVal("tag_3"),
      getVal("tag_4"),
      getVal("tag_5")
    ].filter(Boolean);

    // Map Category
    const categoryId = categoryBySlug.get(categorySlug);
    if (!categoryId) {
      console.warn(`Skipping ${name}: Unknown category "${categorySlug}"`);
      continue;
    }

    // Map Tags
    const tagIds = [];
    for (const tagName of tagNames) {
      const tagSlug = slugify(tagName);
      if (categorySlugs.has(tagSlug)) continue;

      let tag = tagBySlug.get(tagSlug);
      if (!tag) {
        tag = await prisma.tag.upsert({
          where: { slug: tagSlug },
          update: { name: tagName, isActive: true },
          create: { slug: tagSlug, name: tagName, isActive: true },
          select: { id: true, slug: true, name: true },
        });
        tagBySlug.set(tagSlug, tag);
      }
      tagIds.push(tag.id);
    }

    const baseSlug = slugify(name);
    const existingTool = await prisma.tool.findFirst({
      where: {
        OR: [
          { websiteUrl: websiteUrl },
          { name: name },
          ...(baseSlug ? [{ slug: baseSlug }] : []),
        ],
      },
      select: { id: true, slug: true, logoMediaId: true },
    });

    const nextSlug = existingTool ? existingTool.slug : await createUniqueToolSlug(name);

    await prisma.$transaction(async (tx) => {
      const toolData = {
        slug: nextSlug,
        name,
        tagline,
        websiteUrl,
        richDescription,
        pricingModel,
        affiliateUrl: affiliateUrl || null,
        affiliateSource: affiliateUrl ? "CSV_SEED" : null,
        hasAffiliateProgram: !!affiliateUrl,
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        ownerUserId: ADMIN_USER_ID,
        internalNote: "Imported from affiliate list CSV",
      };

      const tool = existingTool
        ? await tx.tool.update({
            where: { id: existingTool.id },
            data: toolData,
            select: { id: true, logoMediaId: true },
          })
        : await tx.tool.create({
            data: toolData,
            select: { id: true, logoMediaId: true },
          });

      if (logoUrl) {
        if (tool.logoMediaId) {
          await tx.toolMedia.update({
            where: { id: tool.logoMediaId },
            data: { url: logoUrl, type: "LOGO" },
          });
        } else {
          const logoMedia = await tx.toolMedia.create({
            data: { toolId: tool.id, type: "LOGO", url: logoUrl },
            select: { id: true },
          });
          await tx.tool.update({
            where: { id: tool.id },
            data: { logoMediaId: logoMedia.id },
          });
        }
      }

      await replaceToolCategories(tx, tool.id, [categoryId]);
      await replaceToolTags(tx, tool.id, tagIds);
    });

    if (existingTool) updatedCount++;
    else createdCount++;
  }

  console.log(JSON.stringify({ createdCount, updatedCount }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
