import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import {
  buildFaviconProviderUrl,
  configureCloudinaryFromEnv,
  isFaviconProviderUrl,
  uploadFaviconLogoToCloudinary,
} from "./favicon-logo-cloudinary.mjs";
import { getTagDisplayName, slugify } from "./tag-display-name.mjs";

const prisma = new PrismaClient();

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
      throw new Error(`Unsupported pricing model: ${value}`);
  }
}

function parseList(value) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function parseTagColumnValues(rawRow, headerMap) {
  return Array.from(headerMap.entries())
    .filter(([header]) => /^tag_\d+$/.test(header))
    .sort((left, right) => left[0].localeCompare(right[0], undefined, { numeric: true }))
    .map(([, index]) => rawRow[index]?.trim() ?? "")
    .filter(Boolean);
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
  const skipLogoUpload = process.argv.includes("--skip-logo-upload");

  if (!csvPathArg) {
    throw new Error(
      "Usage: node scripts/import-seeded-tools.mjs <path-to-csv>",
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

  const requiredHeaders = ["name", "url"];
  const importableHeaders = [
    "tagline",
    "rich_description",
    "pricing_model",
    "categories",
    "category",
    "tags",
    "logo_url",
  ];

  for (const header of requiredHeaders) {
    if (!headerMap.has(header)) {
      throw new Error(`Missing required CSV column: ${header}`);
    }
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
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
let uploadedLogoCount = 0;
const failedLogoUploads = [];
let uploadFolder = null;

  function getUploadFolder() {
    uploadFolder ??= configureCloudinaryFromEnv();
    return uploadFolder;
  }

  for (const rawRow of dataRows) {
    const tagColumnValues = parseTagColumnValues(rawRow, headerMap);
    const row = Object.fromEntries(
      [...requiredHeaders, ...importableHeaders].map((header) => [
        header,
        headerMap.has(header)
          ? rawRow[headerMap.get(header)]?.trim() ?? ""
          : undefined,
      ]),
    );

    if (!row.name || !row.url) {
      continue;
    }

    const normalizedCategoriesValue =
      row.categories !== undefined
        ? row.categories
        : row.category !== undefined
          ? row.category
          : undefined;
    const normalizedTagsValue =
      row.tags !== undefined
        ? row.tags
        : tagColumnValues.length > 0
          ? tagColumnValues.join(",")
          : undefined;
    const resolvedLogoUrl =
      row.logo_url || buildFaviconProviderUrl(row.url, { larger: true });

    const baseSlug = slugify(row.name);
    const existingTool = await prisma.tool.findFirst({
      where: {
        OR: [
          { websiteUrl: row.url },
          { name: row.name },
          ...(baseSlug ? [{ slug: baseSlug }] : []),
        ],
      },
      select: {
        id: true,
        slug: true,
        logoMediaId: true,
      },
    });

    if (!existingTool) {
      for (const header of [
        "tagline",
        "rich_description",
        "pricing_model",
      ]) {
        if (!row[header]) {
          throw new Error(
            `Cannot create new tool "${row.name}" without CSV column "${header}"`,
          );
        }
      }

      if (!normalizedCategoriesValue) {
        throw new Error(
          `Cannot create new tool "${row.name}" without CSV column "categories" or "category"`,
        );
      }

      if (!normalizedTagsValue) {
        throw new Error(
          `Cannot create new tool "${row.name}" without CSV column "tags" or at least one "tag_n" column`,
        );
      }
    }

    const normalizedCategorySlugs =
      normalizedCategoriesValue === undefined
        ? []
        : parseList(normalizedCategoriesValue).map((categorySlug) => {
            const normalizedCategorySlug = slugify(categorySlug);
            const categoryId = categoryBySlug.get(normalizedCategorySlug);

            if (!categoryId) {
              throw new Error(
                `Unknown category "${categorySlug}" for tool "${row.name}"`,
              );
            }

            return normalizedCategorySlug;
          });
    const categoryIds = normalizedCategorySlugs.map((categorySlug) =>
      categoryBySlug.get(categorySlug),
    );

    const tagIds = [];

    if (normalizedTagsValue !== undefined) {
      for (const tagName of parseList(normalizedTagsValue)) {
        const tagSlug = slugify(tagName);
        const tagDisplayName = getTagDisplayName(tagName);

        if (categorySlugs.has(tagSlug)) {
          continue;
        }

        let tag = tagBySlug.get(tagSlug);

        if (!tag) {
          tag = await prisma.tag.upsert({
            where: { slug: tagSlug },
            update: {
              name: tagDisplayName,
              isActive: true,
            },
            create: {
              slug: tagSlug,
              name: tagDisplayName,
              isActive: true,
            },
            select: { id: true, slug: true, name: true },
          });
          tagBySlug.set(tagSlug, tag);
        }

        tagIds.push(tag.id);
      }
    }

    const nextSlug = existingTool
      ? existingTool.slug
      : await createUniqueToolSlug(row.name);

    let uploadedLogo = null;

    if (!skipLogoUpload && resolvedLogoUrl && isFaviconProviderUrl(resolvedLogoUrl)) {
      try {
        uploadedLogo = await uploadFaviconLogoToCloudinary({
          sourceUrl: resolvedLogoUrl,
          slug: nextSlug,
          uploadFolder: getUploadFolder(),
        });
      } catch (error) {
        failedLogoUploads.push({
          name: row.name,
          sourceUrl: resolvedLogoUrl,
          error: error instanceof Error ? error.message : JSON.stringify(error),
        });
      }
    }
    const logoMediaData = uploadedLogo
      ? {
          url: uploadedLogo.url,
          publicId: uploadedLogo.publicId,
          format: uploadedLogo.format,
          width: uploadedLogo.width,
          height: uploadedLogo.height,
        }
      : !skipLogoUpload && resolvedLogoUrl
        ? {
            url: resolvedLogoUrl,
            publicId: null,
            format: null,
            width: null,
            height: null,
          }
        : null;

    await prisma.$transaction(async (tx) => {
      const updateData = {
        slug: nextSlug,
        name: row.name,
        websiteUrl: row.url,
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        internalNote: "Imported from seeded CSV",
      };

      if (row.tagline !== undefined) {
        updateData.tagline = row.tagline;
      }

      if (row.rich_description !== undefined) {
        updateData.richDescription = row.rich_description;
      }

      if (row.pricing_model !== undefined) {
        updateData.pricingModel = mapPricingModel(row.pricing_model);
      }

      const tool = existingTool
        ? await tx.tool.update({
            where: { id: existingTool.id },
            data: updateData,
            select: {
              id: true,
              logoMediaId: true,
            },
          })
        : await tx.tool.create({
            data: updateData,
            select: {
              id: true,
              logoMediaId: true,
            },
          });

      if (logoMediaData) {
        if (tool.logoMediaId) {
          await tx.toolMedia.update({
            where: { id: tool.logoMediaId },
            data: {
              ...logoMediaData,
              type: "LOGO",
              sortOrder: 0,
            },
          });
        } else {
          const logoMedia = await tx.toolMedia.create({
            data: {
              toolId: tool.id,
              type: "LOGO",
              ...logoMediaData,
              sortOrder: 0,
            },
            select: { id: true },
          });

          await tx.tool.update({
            where: { id: tool.id },
            data: {
              logoMediaId: logoMedia.id,
            },
          });
        }
      }

      if (normalizedCategoriesValue !== undefined) {
        await replaceToolCategories(tx, tool.id, categoryIds);
      }

      if (normalizedTagsValue !== undefined) {
        await replaceToolTags(tx, tool.id, tagIds);
      }
    }, {
      timeout: 20000,
    });

    if (existingTool) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }

    if (uploadedLogo) {
      uploadedLogoCount += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        file: csvPath,
        importedRows: dataRows.length,
        createdCount,
        updatedCount,
        uploadedLogoCount,
        failedLogoUploadCount: failedLogoUploads.length,
        failedLogoUploads,
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
