import { PrismaClient } from "@prisma/client";

import { normalizedTags } from "./tag-taxonomy.mjs";

const prisma = new PrismaClient();

async function main() {
  const shouldDeactivateMissing = process.argv.includes("--deactivate-missing");
  const slugs = normalizedTags.map((tag) => tag.slug);

  let createdCount = 0;
  let updatedCount = 0;

  for (const tag of normalizedTags) {
    const existing = await prisma.tag.findUnique({
      where: { slug: tag.slug },
    });

    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {
        name: tag.name,
        isActive: true,
      },
      create: {
        slug: tag.slug,
        name: tag.name,
        isActive: true,
      },
    });

    if (existing) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }
  }

  let deactivatedCount = 0;

  if (shouldDeactivateMissing) {
    const result = await prisma.tag.updateMany({
      where: {
        slug: {
          notIn: slugs,
        },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    deactivatedCount = result.count;
  }

  console.log(
    JSON.stringify(
      {
        synced: normalizedTags.length,
        created: createdCount,
        updated: updatedCount,
        deactivated: deactivatedCount,
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
