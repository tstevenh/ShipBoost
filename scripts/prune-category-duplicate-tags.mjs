import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true },
  });
  const categorySlugs = categories.map((category) => category.slug);

  const duplicateTags = await prisma.tag.findMany({
    where: {
      slug: {
        in: categorySlugs,
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  const duplicateTagIds = duplicateTags.map((tag) => tag.id);

  const deletedAssignments = duplicateTagIds.length
    ? await prisma.toolTag.deleteMany({
        where: {
          tagId: {
            in: duplicateTagIds,
          },
        },
      })
    : { count: 0 };

  const deletedTags = duplicateTagIds.length
    ? await prisma.tag.deleteMany({
        where: {
          id: {
            in: duplicateTagIds,
          },
        },
      })
    : { count: 0 };

  console.log(
    JSON.stringify(
      {
        categorySlugs,
        removedTagSlugs: duplicateTags.map((tag) => tag.slug),
        deletedAssignments: deletedAssignments.count,
        deletedTags: deletedTags.count,
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
