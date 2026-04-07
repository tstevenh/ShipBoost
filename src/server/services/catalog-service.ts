import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
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
            publicationStatus: "PUBLISHED",
            moderationStatus: "APPROVED",
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

export function getPublicCategoryBySlug(slug: string) {
  return prisma.category.findFirst({
    where: {
      slug,
      isActive: true,
    },
    include: {
      toolCategories: {
        where: {
          tool: {
            publicationStatus: "PUBLISHED",
            moderationStatus: "APPROVED",
          },
        },
        orderBy: [{ sortOrder: "asc" }, { tool: { isFeatured: "desc" } }],
        include: {
          tool: {
            include: {
              logoMedia: true,
              toolCategories: {
                include: {
                  category: true,
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
              toolTags: {
                include: {
                  tag: true,
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  });
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
