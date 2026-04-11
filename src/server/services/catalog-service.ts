import { prisma } from "@/server/db/client";
import { publicToolCardSelect } from "@/server/db/public-selects";
import { AppError } from "@/server/http/app-error";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { slugify } from "@/server/services/slug";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  TagCreateInput,
  TagUpdateInput,
} from "@/server/validators/catalog";

async function createUniqueCategorySlug(baseValue: string) {
  const baseSlug = slugify(baseValue) || "category";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.category.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

async function createUniqueTagSlug(baseValue: string) {
  const baseSlug = slugify(baseValue) || "tag";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.tag.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

export function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listPublicCategories() {
  return prisma.category.findMany({
    where: {
      isActive: true,
      toolCategories: {
        some: {
          tool: {
            ...getPubliclyVisibleToolWhere(),
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function createCategory(input: CategoryCreateInput) {
  const slug = await createUniqueCategorySlug(input.slug ?? input.name);

  return prisma.category.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      seoIntro: input.seoIntro,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function updateCategory(
  categoryId: string,
  input: CategoryUpdateInput,
) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new AppError(404, "Category not found.");
  }

  const slug =
    input.slug || (input.name && input.name !== existing.name)
      ? await createUniqueCategorySlug(input.slug ?? input.name ?? existing.name)
      : undefined;

  return prisma.category.update({
    where: { id: categoryId },
    data: {
      slug,
      name: input.name,
      description: input.description,
      seoIntro: input.seoIntro,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    },
  });
}

export async function deleteCategory(categoryId: string) {
  const existing = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!existing) {
    throw new AppError(404, "Category not found.");
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
}

export function listTags() {
  return prisma.tag.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export async function listPublicTags() {
  const tags = await prisma.tag.findMany({
    where: {
      isActive: true,
      toolTags: {
        some: {
          tool: {
            ...getPubliclyVisibleToolWhere(),
          },
        },
      },
    },
    include: {
      _count: {
        select: {
          toolTags: {
            where: {
              tool: {
                ...getPubliclyVisibleToolWhere(),
              },
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return tags.map(tag => ({
    ...tag,
    count: tag._count.toolTags,
  }));
}

export function getPublicCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      seoIntro: true,
      metaTitle: true,
      metaDescription: true,
      toolCategories: {
        where: {
          tool: {
            ...getPubliclyVisibleToolWhere(),
          },
        },
        orderBy: [{ sortOrder: "asc" }, { tool: { isFeatured: "desc" } }],
        select: {
          tool: {
            select: publicToolCardSelect,
          },
        },
      },
    },
  });
}

export async function getPublicCategoryPageBySlug(
  slug: string,
  sort: "newest" | "top" = "newest",
) {
  const category = await prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      seoIntro: true,
      metaTitle: true,
      metaDescription: true,
      toolCategories: {
        where: {
          tool: {
            ...getPubliclyVisibleToolWhere(),
          },
        },
        orderBy:
          sort === "top"
            ? [{ tool: { toolVotes: { _count: "desc" } } }, { tool: { isFeatured: "desc" } }]
            : [{ tool: { createdAt: "desc" } }, { tool: { isFeatured: "desc" } }],
        select: {
          tool: {
            select: publicToolCardSelect,
          },
        },
      },
    },
  });

  if (!category) {
    return null;
  }

  const toolIds = category.toolCategories.map((item) => item.tool.id);
  
  // Featured tools always at the top of their section, regardless of sort
  const featuredTools = category.toolCategories
    .map((item) => item.tool)
    .filter((tool) => tool.isFeatured)
    .slice(0, 3);

  const topTagsMap = new Map<
    string,
    { id: string; name: string; slug: string; isActive: boolean; count: number }
  >();

  for (const item of category.toolCategories) {
    for (const tag of item.tool.toolTags) {
      const current = topTagsMap.get(tag.tag.id);
      topTagsMap.set(tag.tag.id, {
        id: tag.tag.id,
        name: tag.tag.name,
        slug: tag.tag.slug,
        isActive: tag.tag.isActive,
        count: (current?.count ?? 0) + 1,
      });
    }
  }

  const relatedCategories = toolIds.length
      ? await prisma.category.findMany({
          where: {
            id: {
            not: category.id,
          },
          isActive: true,
          toolCategories: {
            some: {
              toolId: {
                in: toolIds,
              },
            },
            },
          },
          select: {
            id: true,
            slug: true,
            name: true,
          },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          take: 4,
        })
    : [];

  return {
    ...category,
    featuredTools,
    relatedCategories,
    topTags: [...topTagsMap.values()]
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
      .slice(0, 6),
  };
}

export async function createTag(input: TagCreateInput) {
  const slug = await createUniqueTagSlug(input.slug ?? input.name);

  const existing = await prisma.tag.findFirst({
    where: {
      OR: [{ slug }, { name: input.name }],
    },
  });

  if (existing) {
    throw new AppError(409, "A tag with that name or slug already exists.");
  }

  return prisma.tag.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      isActive: input.isActive,
    },
  });
}

export async function updateTag(tagId: string, input: TagUpdateInput) {
  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!existing) {
    throw new AppError(404, "Tag not found.");
  }

  const slug =
    input.slug || (input.name && input.name !== existing.name)
      ? await createUniqueTagSlug(input.slug ?? input.name ?? existing.name)
      : undefined;

  return prisma.tag.update({
    where: { id: tagId },
    data: {
      slug,
      name: input.name,
      description: input.description,
      isActive: input.isActive,
    },
  });
}

export async function deleteTag(tagId: string) {
  const existing = await prisma.tag.findUnique({
    where: { id: tagId },
  });

  if (!existing) {
    throw new AppError(404, "Tag not found.");
  }

  await prisma.tag.delete({
    where: { id: tagId },
  });
}
