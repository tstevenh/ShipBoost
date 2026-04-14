import type { BlogArticleStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { slugify } from "@/server/services/slug";
import type {
  BlogArticleCreateInput,
  BlogArticleListQuery,
  BlogArticleUpdateInput,
  BlogCategoryCreateInput,
  BlogCategoryUpdateInput,
  BlogTagCreateInput,
  BlogTagUpdateInput,
} from "@/server/validators/blog";

type BlogSlugLookupClient = Pick<
  typeof prisma,
  "blogArticle" | "blogCategory" | "blogTag"
>;

type BlogAssignmentLookupClient = Pick<
  typeof prisma,
  "blogAuthor" | "blogCategory" | "blogTag"
>;

type BlogWriteClient = Pick<
  typeof prisma,
  "blogArticle" | "blogArticleTag" | "blogAuthor" | "blogCategory" | "blogTag"
>;

const adminBlogArticleInclude = {
  author: true,
  primaryCategory: true,
  articleTags: {
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      tag: true,
    },
  },
} satisfies Prisma.BlogArticleInclude;

const publicBlogArticleInclude = {
  author: true,
  primaryCategory: true,
  articleTags: {
    where: {
      tag: {
        isActive: true,
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      tag: true,
    },
  },
} satisfies Prisma.BlogArticleInclude;

function getBlogArticleListWhere(filters: BlogArticleListQuery): Prisma.BlogArticleWhereInput {
  return {
    status: filters.status,
    primaryCategoryId: filters.categoryId,
    OR: filters.search
      ? [
          { title: { contains: filters.search, mode: "insensitive" } },
          { slug: { contains: filters.search, mode: "insensitive" } },
          { excerpt: { contains: filters.search, mode: "insensitive" } },
        ]
      : undefined,
  };
}

async function createUniqueBlogArticleSlug(
  baseValue: string,
  db: BlogSlugLookupClient = prisma,
) {
  const baseSlug = slugify(baseValue) || "article";
  let slug = baseSlug;
  let suffix = 1;

  while (await db.blogArticle.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

async function createUniqueBlogCategorySlug(
  baseValue: string,
  db: BlogSlugLookupClient = prisma,
) {
  const baseSlug = slugify(baseValue) || "category";
  let slug = baseSlug;
  let suffix = 1;

  while (await db.blogCategory.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

async function createUniqueBlogTagSlug(
  baseValue: string,
  db: BlogSlugLookupClient = prisma,
) {
  const baseSlug = slugify(baseValue) || "tag";
  let slug = baseSlug;
  let suffix = 1;

  while (await db.blogTag.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

async function assertActiveBlogAssignments(
  input: {
    authorId: string;
    primaryCategoryId: string;
    tagIds: string[];
  },
  db: BlogAssignmentLookupClient = prisma,
) {
  const [author, category, tags] = await Promise.all([
    db.blogAuthor.findFirst({
      where: {
        id: input.authorId,
        isActive: true,
      },
      select: { id: true },
    }),
    db.blogCategory.findFirst({
      where: {
        id: input.primaryCategoryId,
        isActive: true,
      },
      select: { id: true },
    }),
    input.tagIds.length > 0
      ? db.blogTag.findMany({
          where: {
            id: {
              in: [...new Set(input.tagIds)],
            },
            isActive: true,
          },
          select: { id: true },
        })
      : Promise.resolve([]),
  ]);

  if (!author) {
    throw new AppError(400, "Select an active blog author.");
  }

  if (!category) {
    throw new AppError(400, "Select an active blog category.");
  }

  if (tags.length !== new Set(input.tagIds).size) {
    throw new AppError(400, "Select only active blog tags.");
  }
}

function resolveCreateLifecycle(status: BlogArticleStatus) {
  if (status !== "PUBLISHED") {
    return {
      publishedAt: null,
      lastUpdatedAt: null,
    };
  }

  const now = new Date();

  return {
    publishedAt: now,
    lastUpdatedAt: now,
  };
}

function resolveUpdateLifecycle(
  existing: { status: BlogArticleStatus; publishedAt: Date | null },
  nextStatus: BlogArticleStatus,
) {
  if (nextStatus === "PUBLISHED") {
    const now = new Date();

    return {
      publishedAt: existing.publishedAt ?? now,
      lastUpdatedAt: now,
    };
  }

  if (existing.status === "PUBLISHED") {
    return {
      lastUpdatedAt: new Date(),
    };
  }

  return {};
}

async function replaceBlogArticleTags(
  db: BlogWriteClient,
  articleId: string,
  tagIds: string[],
) {
  await db.blogArticleTag.deleteMany({
    where: {
      articleId,
    },
  });

  if (tagIds.length === 0) {
    return;
  }

  await db.blogArticleTag.createMany({
    data: [...new Set(tagIds)].map((tagId, index) => ({
      articleId,
      tagId,
      sortOrder: index,
    })),
  });
}

async function reloadAdminBlogArticle(
  db: Pick<typeof prisma, "blogArticle">,
  articleId: string,
) {
  return db.blogArticle.findUnique({
    where: {
      id: articleId,
    },
    include: adminBlogArticleInclude,
  });
}

export function listBlogAuthors() {
  return prisma.blogAuthor.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ name: "asc" }],
  });
}

export function listAdminBlogCategories() {
  return prisma.blogCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function listAdminBlogTags() {
  return prisma.blogTag.findMany({
    orderBy: [{ name: "asc" }],
  });
}

export function listAdminBlogArticles(filters: BlogArticleListQuery) {
  return prisma.blogArticle.findMany({
    where: getBlogArticleListWhere(filters),
    include: adminBlogArticleInclude,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
}

export function getAdminBlogArticleById(articleId: string) {
  return prisma.blogArticle.findUnique({
    where: {
      id: articleId,
    },
    include: adminBlogArticleInclude,
  });
}

export async function createAdminBlogCategory(input: BlogCategoryCreateInput) {
  const slug = await createUniqueBlogCategorySlug(input.slug ?? input.name);

  return prisma.blogCategory.create({
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

export async function updateAdminBlogCategory(
  categoryId: string,
  input: BlogCategoryUpdateInput,
) {
  const existing = await prisma.blogCategory.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!existing) {
    throw new AppError(404, "Blog category not found.");
  }

  const slug =
    input.slug || (input.name && input.name !== existing.name)
      ? await createUniqueBlogCategorySlug(input.slug ?? input.name ?? existing.name)
      : undefined;

  return prisma.blogCategory.update({
    where: {
      id: categoryId,
    },
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

export async function createAdminBlogTag(input: BlogTagCreateInput) {
  const slug = await createUniqueBlogTagSlug(input.slug ?? input.name);

  return prisma.blogTag.create({
    data: {
      slug,
      name: input.name,
      description: input.description,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isActive: input.isActive,
    },
  });
}

export async function updateAdminBlogTag(tagId: string, input: BlogTagUpdateInput) {
  const existing = await prisma.blogTag.findUnique({
    where: {
      id: tagId,
    },
  });

  if (!existing) {
    throw new AppError(404, "Blog tag not found.");
  }

  const slug =
    input.slug || (input.name && input.name !== existing.name)
      ? await createUniqueBlogTagSlug(input.slug ?? input.name ?? existing.name)
      : undefined;

  return prisma.blogTag.update({
    where: {
      id: tagId,
    },
    data: {
      slug,
      name: input.name,
      description: input.description,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isActive: input.isActive,
    },
  });
}

export async function createAdminBlogArticle(input: BlogArticleCreateInput) {
  await assertActiveBlogAssignments({
    authorId: input.authorId,
    primaryCategoryId: input.primaryCategoryId,
    tagIds: input.tagIds,
  });

  const slug = input.slug?.trim()
    ? slugify(input.slug)
    : await createUniqueBlogArticleSlug(input.title);

  if (!slug) {
    throw new AppError(400, "Article slug is required.");
  }

  if (input.slug?.trim()) {
    const existing = await prisma.blogArticle.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new AppError(409, "An article with that slug already exists.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const lifecycle = resolveCreateLifecycle(input.status);
    const article = await tx.blogArticle.create({
      data: {
        slug,
        title: input.title,
        excerpt: input.excerpt,
        markdownContent: input.markdownContent,
        status: input.status,
        authorId: input.authorId,
        primaryCategoryId: input.primaryCategoryId,
        coverImageUrl: input.coverImageUrl,
        coverImagePublicId: input.coverImagePublicId,
        coverImageAlt: input.coverImageAlt,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        canonicalUrl: input.canonicalUrl,
        ogImageUrl: input.ogImageUrl,
        ...lifecycle,
      },
    });

    await replaceBlogArticleTags(tx, article.id, input.tagIds);

    const created = await reloadAdminBlogArticle(tx, article.id);

    if (!created) {
      throw new AppError(500, "Article created but could not be reloaded.");
    }

    return created;
  });
}

export async function updateAdminBlogArticle(
  articleId: string,
  input: BlogArticleUpdateInput,
) {
  const existing = await prisma.blogArticle.findUnique({
    where: {
      id: articleId,
    },
    include: {
      articleTags: {
        select: {
          tagId: true,
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(404, "Blog article not found.");
  }

  const authorId = input.authorId ?? existing.authorId;
  const primaryCategoryId = input.primaryCategoryId ?? existing.primaryCategoryId;
  const tagIds = input.tagIds ?? existing.articleTags.map((item) => item.tagId);

  await assertActiveBlogAssignments({
    authorId,
    primaryCategoryId,
    tagIds,
  });

  let nextSlug: string | undefined;

  if (input.slug?.trim()) {
    nextSlug = slugify(input.slug);

    const duplicate = await prisma.blogArticle.findUnique({
      where: {
        slug: nextSlug,
      },
      select: {
        id: true,
      },
    });

    if (duplicate && duplicate.id !== articleId) {
      throw new AppError(409, "An article with that slug already exists.");
    }
  }

  return prisma.$transaction(async (tx) => {
    const nextStatus = input.status ?? existing.status;
    const lifecycle = resolveUpdateLifecycle(
      {
        status: existing.status,
        publishedAt: existing.publishedAt,
      },
      nextStatus,
    );

    await tx.blogArticle.update({
      where: {
        id: articleId,
      },
      data: {
        slug: nextSlug,
        title: input.title,
        excerpt: input.excerpt,
        markdownContent: input.markdownContent,
        status: input.status,
        authorId: input.authorId,
        primaryCategoryId: input.primaryCategoryId,
        coverImageUrl: input.coverImageUrl,
        coverImagePublicId: input.coverImagePublicId,
        coverImageAlt: input.coverImageAlt,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        canonicalUrl: input.canonicalUrl,
        ogImageUrl: input.ogImageUrl,
        ...lifecycle,
      },
    });

    if (input.tagIds) {
      await replaceBlogArticleTags(tx, articleId, input.tagIds);
    }

    const updated = await reloadAdminBlogArticle(tx, articleId);

    if (!updated) {
      throw new AppError(500, "Article updated but could not be reloaded.");
    }

    return updated;
  });
}

export function getPublishedBlogArticleBySlug(slug: string) {
  return prisma.blogArticle.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      primaryCategory: {
        isActive: true,
      },
      author: {
        isActive: true,
      },
    },
    include: publicBlogArticleInclude,
  });
}

export async function getPublicBlogIndexPage() {
  const [articles, categories, tags] = await Promise.all([
    prisma.blogArticle.findMany({
      where: {
        status: "PUBLISHED",
        primaryCategory: {
          isActive: true,
        },
        author: {
          isActive: true,
        },
      },
      include: publicBlogArticleInclude,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take: 13,
    }),
    prisma.blogCategory.findMany({
      where: {
        isActive: true,
        articles: {
          some: {
            status: "PUBLISHED",
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            articles: {
              where: {
                status: "PUBLISHED",
              },
            },
          },
        },
      },
    }),
    prisma.blogTag.findMany({
      where: {
        isActive: true,
        articleTags: {
          some: {
            article: {
              status: "PUBLISHED",
            },
          },
        },
      },
      orderBy: [{ name: "asc" }],
      take: 16,
      include: {
        _count: {
          select: {
            articleTags: {
              where: {
                article: {
                  status: "PUBLISHED",
                },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    featuredArticle: articles[0] ?? null,
    latestArticles: articles.slice(1),
    categories: categories.map((category) => ({
      ...category,
      articleCount: category._count.articles,
    })),
    tags: tags.map((tag) => ({
      ...tag,
      articleCount: tag._count.articleTags,
    })),
  };
}

export async function getPublicBlogCategoryPage(slug: string) {
  return prisma.blogCategory.findFirst({
    where: {
      slug,
      isActive: true,
      articles: {
        some: {
          status: "PUBLISHED",
          author: {
            isActive: true,
          },
        },
      },
    },
    include: {
      articles: {
        where: {
          status: "PUBLISHED",
          author: {
            isActive: true,
          },
        },
        include: publicBlogArticleInclude,
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      },
    },
  });
}

export async function getPublicBlogTagPage(slug: string) {
  const tag = await prisma.blogTag.findFirst({
    where: {
      slug,
      isActive: true,
      articleTags: {
        some: {
          article: {
            status: "PUBLISHED",
            author: {
              isActive: true,
            },
            primaryCategory: {
              isActive: true,
            },
          },
        },
      },
    },
    include: {
      articleTags: {
        where: {
          article: {
            status: "PUBLISHED",
            author: {
              isActive: true,
            },
            primaryCategory: {
              isActive: true,
            },
          },
        },
        orderBy: [{ article: { publishedAt: "desc" } }, { article: { updatedAt: "desc" } }],
        include: {
          article: {
            include: publicBlogArticleInclude,
          },
        },
      },
    },
  });

  if (!tag) {
    return null;
  }

  return {
    ...tag,
    articles: tag.articleTags.map((item) => item.article),
  };
}

export function listRelatedPublishedBlogArticles(input: {
  articleId: string;
  categoryId: string;
  tagIds: string[];
  take?: number;
}) {
  const orWhere: Prisma.BlogArticleWhereInput[] = [
    {
      primaryCategoryId: input.categoryId,
    },
  ];

  if (input.tagIds.length > 0) {
    orWhere.push({
      articleTags: {
        some: {
          tagId: {
            in: input.tagIds,
          },
          tag: {
            isActive: true,
          },
        },
      },
    });
  }

  return prisma.blogArticle.findMany({
    where: {
      id: {
        not: input.articleId,
      },
      status: "PUBLISHED",
      author: {
        isActive: true,
      },
      primaryCategory: {
        isActive: true,
      },
      OR: orWhere,
    },
    include: publicBlogArticleInclude,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: input.take ?? 4,
  });
}

export function listPublishedBlogArticleStaticParams() {
  return prisma.blogArticle.findMany({
    where: {
      status: "PUBLISHED",
      author: {
        isActive: true,
      },
      primaryCategory: {
        isActive: true,
      },
    },
    orderBy: [{ publishedAt: "desc" }, { slug: "asc" }],
    select: {
      slug: true,
      updatedAt: true,
    },
  });
}

export function listPublishedBlogCategoryStaticParams() {
  return prisma.blogCategory.findMany({
    where: {
      isActive: true,
      articles: {
        some: {
          status: "PUBLISHED",
          author: {
            isActive: true,
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
    select: {
      slug: true,
      updatedAt: true,
    },
  });
}

export function listPublishedBlogTagStaticParams() {
  return prisma.blogTag.findMany({
    where: {
      isActive: true,
      articleTags: {
        some: {
          article: {
            status: "PUBLISHED",
            author: {
              isActive: true,
            },
            primaryCategory: {
              isActive: true,
            },
          },
        },
      },
    },
    orderBy: [{ slug: "asc" }],
    select: {
      slug: true,
      updatedAt: true,
    },
  });
}
