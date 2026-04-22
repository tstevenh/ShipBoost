import { PrismaClient } from "@prisma/client";

import { getTagDisplayName } from "./tag-display-name.mjs";

const prisma = new PrismaClient();

async function main() {
  const tags = await prisma.tag.findMany({
    select: { id: true, slug: true, name: true },
  });

  let updatedCount = 0;

  for (const tag of tags) {
    const expectedName = getTagDisplayName(tag.slug);

    if (!expectedName || tag.name === expectedName) {
      continue;
    }

    await prisma.tag.update({
      where: { id: tag.id },
      data: { name: expectedName },
    });

    updatedCount += 1;
  }

  console.log(
    JSON.stringify(
      {
        scanned: tags.length,
        updated: updatedCount,
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
