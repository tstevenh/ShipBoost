import {
  getAlternativesStaticParams,
  getCachedBlogArticleStaticParams,
  getCachedBlogCategoryStaticParams,
  getCachedBlogTagStaticParams,
  getCachedBestTagStaticParams,
  getCachedCategoryStaticParams,
  getCachedToolStaticParams,
  getBestSeoStaticParams,
  getLaunchBoardStaticParams,
} from "@/server/cache/public-content";
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { bestPagesRegistry } from "@/server/seo/best-pages";
import { freeTools, getFreeToolPath } from "@/server/seo/free-tools";
import {
  buildLlmsFullTxt,
  compactLlmsSections,
  slugToTitle,
  type LlmsEntry,
  type LlmsSection,
} from "@/server/seo/llms";
import { alternativesSeoRegistry } from "@/server/seo/registry";

export const revalidate = 3600;

function byTitle(left: LlmsEntry, right: LlmsEntry) {
  return left.title.localeCompare(right.title);
}

function toLabelMap(entries: { slug: string; name?: string; title?: string }[]) {
  return new Map(
    entries.map((entry) => [entry.slug, entry.name ?? entry.title ?? slugToTitle(entry.slug)]),
  );
}

function staticPageEntries(): LlmsEntry[] {
  return [
    ...compactLlmsSections.flatMap((section) => section.entries),
    {
      title: "FAQs",
      path: "/faqs",
      description: "Answers about submissions, launch weeks, pricing, ranking, and listing visibility.",
    },
    {
      title: "About",
      path: "/about",
      description: "Background on ShipBoost and its launch distribution model.",
    },
    {
      title: "Contact",
      path: "/contact",
      description: "Contact ShipBoost.",
    },
    {
      title: "Advertise",
      path: "/advertise",
      description: "Sponsor placement and advertising information.",
    },
    {
      title: "Affiliate",
      path: "/affiliate",
      description: "ShipBoost affiliate program information.",
    },
    {
      title: "Privacy Policy",
      path: "/privacy",
      description: "Privacy terms for ShipBoost users and visitors.",
    },
    {
      title: "Terms",
      path: "/terms",
      description: "Terms for using ShipBoost.",
    },
  ];
}

async function buildFullSections(): Promise<LlmsSection[]> {
  const [
    categoryParams,
    bestTagParams,
    toolParams,
    blogArticleParams,
    blogCategoryParams,
    blogTagParams,
  ] = await Promise.all([
    getCachedCategoryStaticParams(),
    getCachedBestTagStaticParams(),
    getCachedToolStaticParams(),
    getCachedBlogArticleStaticParams(),
    getCachedBlogCategoryStaticParams(),
    getCachedBlogTagStaticParams(),
  ]);
  const [
    tools,
    categories,
    tags,
    blogArticles,
    blogCategories,
    blogTags,
  ] = await Promise.all([
    prisma.tool.findMany({
      where: {
        ...getPubliclyVisibleToolWhere(),
        slug: {
          in: toolParams.map(({ slug }) => slug),
        },
      },
      select: {
        slug: true,
        name: true,
      },
    }),
    prisma.category.findMany({
      where: {
        slug: {
          in: categoryParams.map(({ slug }) => slug),
        },
      },
      select: {
        slug: true,
        name: true,
      },
    }),
    prisma.tag.findMany({
      where: {
        slug: {
          in: bestTagParams.map(({ slug }) => slug),
        },
      },
      select: {
        slug: true,
        name: true,
      },
    }),
    prisma.blogArticle.findMany({
      where: {
        slug: {
          in: blogArticleParams.map(({ slug }) => slug),
        },
      },
      select: {
        slug: true,
        title: true,
      },
    }),
    prisma.blogCategory.findMany({
      where: {
        slug: {
          in: blogCategoryParams.map(({ slug }) => slug),
        },
      },
      select: {
        slug: true,
        name: true,
      },
    }),
    prisma.blogTag.findMany({
      where: {
        slug: {
          in: blogTagParams.map(({ slug }) => slug),
        },
      },
      select: {
        slug: true,
        name: true,
      },
    }),
  ]);
  const toolLabels = toLabelMap(tools);
  const categoryLabels = toLabelMap(categories);
  const tagLabels = toLabelMap(tags);
  const blogArticleLabels = toLabelMap(blogArticles);
  const blogCategoryLabels = toLabelMap(blogCategories);
  const blogTagLabels = toLabelMap(blogTags);

  return [
    {
      title: "Static Pages",
      entries: staticPageEntries(),
    },
    {
      title: "Launch Pages",
      entries: [
        {
          title: "Daily Launches",
          path: "/launches/daily",
          description: "Daily product launch discovery.",
        },
        ...getLaunchBoardStaticParams().map(({ board }) => ({
          title: `${slugToTitle(board)} Launches`,
          path: `/launches/${board}`,
          description: `${slugToTitle(board)} ShipBoost product launch board.`,
        })),
      ],
    },
    {
      title: "Tool Pages",
      entries: toolParams
        .map(({ slug }) => ({
          title: toolLabels.get(slug) ?? slugToTitle(slug),
          path: `/tools/${slug}`,
          description: "Public ShipBoost product listing.",
        }))
        .sort(byTitle),
    },
    {
      title: "Category Pages",
      entries: categoryParams
        .map(({ slug }) => ({
          title: categoryLabels.get(slug) ?? slugToTitle(slug),
          path: `/categories/${slug}`,
          description: "SaaS tool category page.",
        }))
        .sort(byTitle),
    },
    {
      title: "Tag Pages",
      entries: bestTagParams
        .map(({ slug }) => ({
          title: tagLabels.get(slug) ?? slugToTitle(slug),
          path: `/tags/${slug}`,
          description: "SaaS tool tag page.",
        }))
        .sort(byTitle),
    },
    {
      title: "Best Software Pages",
      entries: getBestSeoStaticParams()
        .map(({ slug }) => {
          const entry = bestPagesRegistry[slug];

          return {
            title: entry?.title ?? slugToTitle(slug),
            path: `/best/${slug}`,
            description: entry?.metaDescription ?? "ShipBoost software buying guide.",
          };
        })
        .sort(byTitle),
    },
    {
      title: "Alternatives Pages",
      entries: getAlternativesStaticParams()
        .map(({ slug }) => {
          const entry = alternativesSeoRegistry[slug];

          return {
            title: entry?.title ?? `${slugToTitle(slug)} Alternatives`,
            path: `/alternatives/${slug}`,
            description: entry?.metaDescription ?? "ShipBoost software alternatives page.",
          };
        })
        .sort(byTitle),
    },
    {
      title: "Free Tools",
      entries: freeTools
        .map((tool) => ({
          title: tool.title,
          path: getFreeToolPath(tool.slug),
          description: tool.metaDescription,
        }))
        .sort(byTitle),
    },
    {
      title: "Blog Articles",
      entries: blogArticleParams.map(({ slug }) => ({
        title: blogArticleLabels.get(slug) ?? slugToTitle(slug),
        path: `/blog/${slug}`,
        description: "ShipBoost blog article.",
      })),
    },
    {
      title: "Blog Category Pages",
      entries: blogCategoryParams
        .map(({ slug }) => ({
          title: blogCategoryLabels.get(slug) ?? slugToTitle(slug),
          path: `/blog/category/${slug}`,
          description: "ShipBoost blog category archive.",
        }))
        .sort(byTitle),
    },
    {
      title: "Blog Tag Pages",
      entries: blogTagParams
        .map(({ slug }) => ({
          title: blogTagLabels.get(slug) ?? slugToTitle(slug),
          path: `/blog/tag/${slug}`,
          description: "ShipBoost blog tag archive.",
        }))
        .sort(byTitle),
    },
  ];
}

export async function GET() {
  const sections = await buildFullSections();

  return new Response(
    buildLlmsFullTxt({
      appUrl: getEnv().NEXT_PUBLIC_APP_URL,
      sections,
    }),
    {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
