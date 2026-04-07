import { AppError } from "@/server/http/app-error";
import { prisma } from "@/server/db/client";

export async function assertCatalogAssignments(
  categoryIds: string[],
  tagIds: string[],
) {
  const [categories, tags] = await Promise.all([
    prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
      select: { id: true },
    }),
    prisma.tag.findMany({
      where: {
        id: { in: tagIds },
        isActive: true,
      },
      select: { id: true },
    }),
  ]);

  if (categories.length !== categoryIds.length) {
    throw new AppError(400, "One or more categories are missing or inactive.");
  }

  if (tags.length !== tagIds.length) {
    throw new AppError(400, "One or more tags are missing or inactive.");
  }
}

