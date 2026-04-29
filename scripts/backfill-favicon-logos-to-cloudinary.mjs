import { PrismaClient } from "@prisma/client";

import {
  configureCloudinaryFromEnv,
  isFaviconProviderUrl,
  uploadFaviconLogoToCloudinary,
  validateRemoteLogoUrl,
} from "./favicon-logo-cloudinary.mjs";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const shouldExecute = args.includes("--execute");
const shouldSkipValidation = args.includes("--skip-validation");
const shouldSkipInvalid = args.includes("--skip-invalid");
const slugsArg = args.find((arg) => arg.startsWith("--slugs="));

function getRequestedSlugs() {
  const rawValue = slugsArg?.slice("--slugs=".length).trim();

  if (!rawValue) {
    return null;
  }

  const slugs = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return slugs.length > 0 ? new Set(slugs) : null;
}

function buildLargerFaviconUrl(value) {
  const url = new URL(value);
  url.protocol = "https:";
  url.searchParams.set("larger", "true");
  return url.toString();
}

async function findFaviconLogoCandidates(requestedSlugs) {
  const tools = await prisma.tool.findMany({
    where: {
      ...(requestedSlugs
        ? {
            slug: {
              in: [...requestedSlugs],
            },
          }
        : {}),
      logoMedia: {
        is: {
          OR: [
            {
              url: {
                startsWith: "https://favicon.im/",
              },
            },
            {
              url: {
                startsWith: "http://favicon.im/",
              },
            },
          ],
        },
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      logoMediaId: true,
      logoMedia: {
        select: {
          id: true,
          url: true,
          publicId: true,
        },
      },
    },
    orderBy: {
      slug: "asc",
    },
  });

  return tools.filter(
    (tool) =>
      tool.logoMediaId &&
      tool.logoMedia &&
      isFaviconProviderUrl(tool.logoMedia.url),
  );
}

async function buildPlan(candidates) {
  const items = [];

  for (const tool of candidates) {
    const sourceLogoUrl = buildLargerFaviconUrl(tool.logoMedia.url);
    const validation = shouldSkipValidation
      ? { skipped: true }
      : await validateRemoteLogoUrl(sourceLogoUrl);

    items.push({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      logoMediaId: tool.logoMediaId,
      currentLogoUrl: tool.logoMedia.url,
      currentPublicId: tool.logoMedia.publicId,
      sourceLogoUrl,
      targetPublicId: `seeded-logo-${tool.slug}`,
      validation,
    });
  }

  return items;
}

async function updateLogoMedia(item, uploadFolder) {
  const uploadedLogo = await uploadFaviconLogoToCloudinary({
    sourceUrl: item.sourceLogoUrl,
    slug: item.slug,
    uploadFolder,
  });

  await prisma.toolMedia.update({
    where: { id: item.logoMediaId },
    data: {
      url: uploadedLogo.url,
      publicId: uploadedLogo.publicId,
      format: uploadedLogo.format,
      width: uploadedLogo.width,
      height: uploadedLogo.height,
      type: "LOGO",
      sortOrder: 0,
    },
  });

  return uploadedLogo;
}

async function main() {
  const requestedSlugs = getRequestedSlugs();
  const candidates = await findFaviconLogoCandidates(requestedSlugs);
  const plan = await buildPlan(candidates);
  const invalidItems = plan.filter(
    (item) => !shouldSkipValidation && !item.validation.ok,
  );

  if (!shouldExecute) {
    console.log(
      JSON.stringify(
        {
          execute: false,
          requestedSlugs: requestedSlugs ? [...requestedSlugs] : null,
          candidateCount: plan.length,
          validCandidateCount: plan.length - invalidItems.length,
          invalidCandidateCount: invalidItems.length,
          canExecuteSafely: invalidItems.length === 0 || shouldSkipInvalid,
          nextCommand:
            invalidItems.length === 0 || shouldSkipInvalid
              ? `node scripts/run-with-env.mjs node scripts/backfill-favicon-logos-to-cloudinary.mjs --execute${invalidItems.length > 0 ? " --skip-invalid" : ""}`
              : null,
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
      `Refusing to execute because ${invalidItems.length} favicon logo source(s) failed validation. Re-run dry run and inspect invalid candidates.`,
    );
  }

  const uploadFolder = configureCloudinaryFromEnv();
  const results = [];
  const executablePlan = shouldSkipInvalid
    ? plan.filter((item) => shouldSkipValidation || item.validation.ok)
    : plan;

  for (const item of executablePlan) {
    const uploadedLogo = await updateLogoMedia(item, uploadFolder);

    results.push({
      slug: item.slug,
      logoMediaId: item.logoMediaId,
      previousLogoUrl: item.currentLogoUrl,
      sourceLogoUrl: item.sourceLogoUrl,
      nextLogoUrl: uploadedLogo.url,
      publicId: uploadedLogo.publicId,
      format: uploadedLogo.format,
      width: uploadedLogo.width,
      height: uploadedLogo.height,
    });
  }

  console.log(
    JSON.stringify(
      {
        execute: true,
        skippedInvalidCount: invalidItems.length,
        processedCount: results.length,
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
