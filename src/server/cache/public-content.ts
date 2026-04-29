import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";

import { prisma } from "@/server/db/client";
import {
  getPublicBlogCategoryPage,
  getPublicBlogIndexPage,
  getPublicBlogTagPage,
  getPublishedBlogArticleBySlug,
  listPublishedBlogArticleStaticParams,
  listPublishedBlogCategoryStaticParams,
  listPublishedBlogTagStaticParams,
  listRelatedPublishedBlogArticles,
  listPublicBlogCategories,
} from "@/server/services/blog-service";
import {
  getPreviousWeeklyTopWinner,
  listLaunchBoard,
} from "@/server/services/launch-service";
import { getPublicCategoryPageBySlug } from "@/server/services/catalog-service";
import {
  getAlternativesSeoPage,
  getBestSeoPage,
  getBestTagSeoPage,
} from "@/server/services/seo-service";
import {
  getPublishedToolBySlug,
  listRelatedPublishedTools,
} from "@/server/services/tool-service";
import { alternativesSeoRegistry } from "@/server/seo/registry";
import { bestPagesRegistry } from "@/server/seo/best-pages";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";

export const PUBLIC_HOME_REVALIDATE = 300;
export const PUBLIC_LAUNCH_BOARD_REVALIDATE = 300;
export const PUBLIC_CATEGORY_REVALIDATE = 1800;
export const PUBLIC_BEST_TAG_REVALIDATE = 1800;
export const PUBLIC_BEST_PAGE_REVALIDATE = 1800;
export const PUBLIC_ALTERNATIVES_REVALIDATE = 1800;
export const PUBLIC_TOOL_REVALIDATE = 3600;
export const PUBLIC_HEADER_REVALIDATE = 3600;
export const PUBLIC_BLOG_INDEX_REVALIDATE = 900;
export const PUBLIC_BLOG_ARCHIVE_REVALIDATE = 1800;
export const PUBLIC_BLOG_ARTICLE_REVALIDATE = 3600;

export const PUBLIC_LAUNCH_BOARDS = [
  "weekly",
  "monthly",
  "yearly",
] as const;

export const PUBLIC_CATALOG_SORTS = ["newest", "top"] as const;

export type PublicLaunchBoard = (typeof PUBLIC_LAUNCH_BOARDS)[number];
export type PublicCatalogSort = (typeof PUBLIC_CATALOG_SORTS)[number];

export const PUBLIC_CACHE_TAGS = {
  home: "public:home",
  launchBoards: "public:launch-boards",
  categories: "public:categories",
  bestTags: "public:best-tags",
  bestPages: "public:best-pages",
  alternatives: "public:alternatives",
  tools: "public:tools",
  blogIndex: "public:blog:index",
  blogArticles: "public:blog:articles",
  blogCategories: "public:blog:categories",
  blogTags: "public:blog:tags",
} as const;

export function revalidatePublicToolContent() {
  revalidateTag(PUBLIC_CACHE_TAGS.tools, "max");
}

export function revalidatePublicBlogContent(input?: {
  articleSlug?: string;
  categorySlug?: string;
  tagSlugs?: string[];
}) {
  revalidateTag(PUBLIC_CACHE_TAGS.blogIndex, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.blogArticles, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.blogCategories, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.blogTags, "max");
  revalidatePath("/blog");

  if (input?.articleSlug) {
    revalidatePath(`/blog/${input.articleSlug}`);
  }

  if (input?.categorySlug) {
    revalidatePath(`/blog/category/${input.categorySlug}`);
  }

  for (const slug of input?.tagSlugs ?? []) {
    revalidatePath(`/blog/tag/${slug}`);
  }
}

export function revalidateAllPublicContent() {
  revalidateTag(PUBLIC_CACHE_TAGS.home, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.launchBoards, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.categories, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.bestTags, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.bestPages, "max");
  revalidateTag(PUBLIC_CACHE_TAGS.alternatives, "max");
  revalidatePublicToolContent();
  revalidatePublicBlogContent();
  revalidatePath("/");
  revalidatePath("/best");
  revalidatePath("/best/[slug]", "page");
  revalidatePath("/alternatives");
  revalidatePath("/alternatives/[slug]", "page");
  revalidatePath("/tags/[slug]", "page");
  revalidatePath("/categories");
  revalidatePath("/categories/[slug]", "page");
  revalidatePath("/launches/[board]", "page");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/blog/category/[slug]", "page");
  revalidatePath("/blog/tag/[slug]", "page");
  revalidatePath("/tools/[slug]", "page");
}

type PrelaunchToolPreview = {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  logoUrl: string | null;
};

export function isPublicLaunchBoard(value: string): value is PublicLaunchBoard {
  return PUBLIC_LAUNCH_BOARDS.includes(value as PublicLaunchBoard);
}

export function coercePublicLaunchBoard(
  value: string | undefined,
): PublicLaunchBoard {
  return value && isPublicLaunchBoard(value) ? value : "weekly";
}

export function coercePublicCatalogSort(
  value: string | undefined,
): PublicCatalogSort {
  return value === "top" ? "top" : "newest";
}

const getCachedPrelaunchTools = unstable_cache(
  async (): Promise<PrelaunchToolPreview[]> => {
    const tools = await prisma.tool.findMany({
      where: getPubliclyVisibleToolWhere(),
      take: 18,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        tagline: true,
        slug: true,
        affiliateUrl: true,
        createdAt: true,
        logoMedia: {
          select: {
            url: true,
          },
        },
      },
    });

    return tools
      .sort((left, right) => {
        const affiliateDifference =
          Number(Boolean(right.affiliateUrl)) - Number(Boolean(left.affiliateUrl));

        if (affiliateDifference !== 0) {
          return affiliateDifference;
        }

        return right.createdAt.getTime() - left.createdAt.getTime();
      })
      .slice(0, 6)
      .map((tool) => ({
        id: tool.id,
        name: tool.name,
        tagline: tool.tagline,
        slug: tool.slug,
        logoUrl: tool.logoMedia?.url ?? null,
      }));
  },
  ["public-home", "v2", "prelaunch-tools"],
  {
    revalidate: PUBLIC_HOME_REVALIDATE,
    tags: [PUBLIC_CACHE_TAGS.home, PUBLIC_CACHE_TAGS.tools],
  },
);

const launchBoardLoaders: Record<PublicLaunchBoard, () => Promise<Awaited<ReturnType<typeof listLaunchBoard>>>> = {
  weekly: unstable_cache(
    () => listLaunchBoard("weekly"),
    ["public-launch-board", "v2", "weekly"],
    {
      revalidate: 900,
      tags: [
        PUBLIC_CACHE_TAGS.home,
        PUBLIC_CACHE_TAGS.launchBoards,
        "public:launch-board:weekly",
      ],
    },
  ),
  monthly: unstable_cache(
    () => listLaunchBoard("monthly"),
    ["public-launch-board", "v2", "monthly"],
    {
      revalidate: 900,
      tags: [PUBLIC_CACHE_TAGS.launchBoards, "public:launch-board:monthly"],
    },
  ),
  yearly: unstable_cache(
    () => listLaunchBoard("yearly"),
    ["public-launch-board", "v2", "yearly"],
    {
      revalidate: 900,
      tags: [PUBLIC_CACHE_TAGS.launchBoards, "public:launch-board:yearly"],
    },
  ),
};

const getCachedPreviousWeeklyTopWinnerLoader = unstable_cache(
  () => getPreviousWeeklyTopWinner(),
  ["public-launch-board", "v1", "previous-weekly-top-winner"],
  {
    revalidate: PUBLIC_LAUNCH_BOARD_REVALIDATE,
    tags: [
      PUBLIC_CACHE_TAGS.home,
      PUBLIC_CACHE_TAGS.launchBoards,
      "public:launch-board:weekly",
    ],
  },
);

export const getCachedHomePageData = cache(
  async (board: PublicLaunchBoard, isPrelaunch: boolean) => {
    const [launches, prelaunchTools, previousWeeklyTopWinner] = await Promise.all([
      getCachedLaunchBoard(board),
      isPrelaunch
        ? getCachedPrelaunchTools()
        : Promise.resolve([] as PrelaunchToolPreview[]),
      isPrelaunch ? Promise.resolve(null) : getCachedPreviousWeeklyTopWinner(),
    ]);

    return {
      launches,
      prelaunchTools,
      previousWeeklyTopWinner,
    };
  },
);

export const getCachedLaunchBoard = cache(
  async (board: PublicLaunchBoard) => launchBoardLoaders[board](),
);

export const getCachedPreviousWeeklyTopWinner = cache(
  async () => getCachedPreviousWeeklyTopWinnerLoader(),
);

export const getCachedCategoryPage = cache(
  async (slug: string, sort: PublicCatalogSort = "newest") =>
    unstable_cache(
      () => getPublicCategoryPageBySlug(slug, sort),
      ["public-category-page", "v2", slug, sort],
      {
        revalidate: PUBLIC_CATEGORY_REVALIDATE,
        tags: [
          PUBLIC_CACHE_TAGS.categories,
          `public:category:${slug}`,
          `public:category-sort:${sort}`,
        ],
      },
    )(),
);

export const getCachedBestTagPage = cache(
  async (slug: string, sort: PublicCatalogSort = "newest") =>
    unstable_cache(
      () => getBestTagSeoPage(slug, sort),
      ["public-best-tag-page", "v3", slug, sort],
      {
        revalidate: PUBLIC_BEST_TAG_REVALIDATE,
        tags: [
          PUBLIC_CACHE_TAGS.bestTags,
          `public:best-tag:${slug}`,
          `public:best-tag-sort:${sort}`,
        ],
      },
    )(),
);

export const getCachedBestSeoPage = cache(async (slug: string) =>
  unstable_cache(
    () => getBestSeoPage(slug),
    ["public-best-page", "v2", slug],
    {
      revalidate: PUBLIC_BEST_PAGE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.bestPages, `public:best-page:${slug}`],
    },
  )(),
);

export const getCachedAlternativesPage = cache(async (slug: string) =>
  unstable_cache(
    () => getAlternativesSeoPage(slug),
    ["public-alternatives-page", "v3", slug],
    {
      revalidate: PUBLIC_ALTERNATIVES_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.alternatives, `public:alternatives:${slug}`],
    },
  )(),
);

export const getCachedPublishedTool = cache(async (slug: string) =>
  unstable_cache(
    () => getPublishedToolBySlug(slug),
    ["public-tool-page", "v2", slug],
    {
      revalidate: PUBLIC_TOOL_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.tools, `public:tool:${slug}`],
    },
  )(),
);

export const getCachedRelatedPublishedTools = cache(
  async (toolId: string, categoryIds: string[], tagIds: string[]) =>
    unstable_cache(
      () =>
        listRelatedPublishedTools(toolId, {
          categoryIds,
          tagIds,
          take: 4,
        }),
      [
        "public-related-tools",
        "v3",
        toolId,
        categoryIds.join(","),
        tagIds.join(","),
      ],
      {
        revalidate: PUBLIC_TOOL_REVALIDATE,
        tags: [PUBLIC_CACHE_TAGS.tools, `public:tool-related:${toolId}`],
      },
    )(),
);

export const getCachedBlogIndexPage = cache(async () =>
  unstable_cache(
    () => getPublicBlogIndexPage(),
    ["public-blog-index", "v1"],
    {
      revalidate: PUBLIC_BLOG_INDEX_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogIndex, PUBLIC_CACHE_TAGS.blogArticles],
    },
  )(),
);

export const getCachedPublishedBlogArticle = cache(async (slug: string) =>
  unstable_cache(
    () => getPublishedBlogArticleBySlug(slug),
    ["public-blog-article", "v1", slug],
    {
      revalidate: PUBLIC_BLOG_ARTICLE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogArticles, `public:blog:article:${slug}`],
    },
  )(),
);

export const getCachedRelatedPublishedBlogArticles = cache(
  async (articleId: string, categoryId: string, tagIds: string[]) =>
    unstable_cache(
      () =>
        listRelatedPublishedBlogArticles({
          articleId,
          categoryId,
          tagIds,
          take: 4,
        }),
      ["public-blog-related", "v1", articleId, categoryId, tagIds.join(",")],
      {
        revalidate: PUBLIC_BLOG_ARTICLE_REVALIDATE,
        tags: [PUBLIC_CACHE_TAGS.blogArticles, `public:blog:related:${articleId}`],
      },
    )(),
);

export const getCachedBlogCategoryPage = cache(async (slug: string) =>
  unstable_cache(
    () => getPublicBlogCategoryPage(slug),
    ["public-blog-category", "v1", slug],
    {
      revalidate: PUBLIC_BLOG_ARCHIVE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogCategories, `public:blog:category:${slug}`],
    },
  )(),
);

export const getCachedBlogTagPage = cache(async (slug: string) =>
  unstable_cache(
    () => getPublicBlogTagPage(slug),
    ["public-blog-tag", "v1", slug],
    {
      revalidate: PUBLIC_BLOG_ARCHIVE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogTags, `public:blog:tag:${slug}`],
    },
  )(),
);
export const getCachedPublicBlogCategories = cache(async () =>
  unstable_cache(
    () => listPublicBlogCategories(),
    ["public-blog-all-categories", "v1"],
    {
      revalidate: PUBLIC_BLOG_ARCHIVE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogCategories],
    },
  )(),
);

export const getCachedCategoryStaticParams = cache(async () =>
  unstable_cache(
    async () =>
      prisma.category.findMany({
        where: {
          isActive: true,
          toolCategories: {
            some: {
              tool: getPubliclyVisibleToolWhere(),
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          slug: true,
        },
      }),
    ["public-category-static-params", "v2"],
    {
      revalidate: PUBLIC_CATEGORY_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.categories],
    },
  )(),
);

export const getCachedBestTagStaticParams = cache(async () =>
  unstable_cache(
    async () =>
      prisma.tag.findMany({
        where: {
          isActive: true,
          toolTags: {
            some: {
              tool: getPubliclyVisibleToolWhere(),
            },
          },
        },
        orderBy: {
          name: "asc",
        },
        select: {
          slug: true,
        },
      }),
    ["public-best-tag-static-params", "v2"],
    {
      revalidate: PUBLIC_BEST_TAG_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.bestTags],
    },
  )(),
);

export function getBestSeoStaticParams() {
  return Object.keys(bestPagesRegistry)
    .sort((left, right) => left.localeCompare(right))
    .map((slug) => ({ slug }));
}

export const getCachedToolStaticParams = cache(async () =>
  unstable_cache(
    async () =>
      prisma.tool.findMany({
        where: getPubliclyVisibleToolWhere(),
        orderBy: {
          slug: "asc",
        },
        select: {
          slug: true,
        },
      }),
    ["public-tool-static-params", "v2"],
    {
      revalidate: PUBLIC_TOOL_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.tools],
    },
  )(),
);

export const getCachedBlogArticleStaticParams = cache(async () =>
  unstable_cache(
    () => listPublishedBlogArticleStaticParams(),
    ["public-blog-article-static-params", "v1"],
    {
      revalidate: PUBLIC_BLOG_ARTICLE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogArticles],
    },
  )(),
);

export const getCachedBlogCategoryStaticParams = cache(async () =>
  unstable_cache(
    () => listPublishedBlogCategoryStaticParams(),
    ["public-blog-category-static-params", "v1"],
    {
      revalidate: PUBLIC_BLOG_ARCHIVE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogCategories],
    },
  )(),
);

export const getCachedBlogTagStaticParams = cache(async () =>
  unstable_cache(
    () => listPublishedBlogTagStaticParams(),
    ["public-blog-tag-static-params", "v1"],
    {
      revalidate: PUBLIC_BLOG_ARCHIVE_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.blogTags],
    },
  )(),
);

export const getCachedPublicHeaderCategories = cache(async () =>
  unstable_cache(
    async () =>
      prisma.category.findMany({
        where: {
          isActive: true,
          toolCategories: {
            some: {
              tool: getPubliclyVisibleToolWhere(),
            },
          },
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
        },
      }),
    ["public-header-categories", "v1"],
    {
      revalidate: PUBLIC_HEADER_REVALIDATE,
      tags: [PUBLIC_CACHE_TAGS.categories],
    },
  )(),
);

export function getLaunchBoardStaticParams() {
  return PUBLIC_LAUNCH_BOARDS.map((board) => ({ board }));
}

export function getAlternativesStaticParams() {
  return Object.keys(alternativesSeoRegistry)
    .sort((left, right) => left.localeCompare(right))
    .map((slug) => ({ slug }));
}
