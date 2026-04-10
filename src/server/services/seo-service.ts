import { toolDetailsInclude } from "@/server/db/includes";
import { prisma } from "@/server/db/client";
import {
  alternativesSeoRegistry,
  bestTagSeoRegistry,
} from "@/server/seo/registry";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import type {
  AlternativesSeoEntry,
  BestTagSeoEntry,
} from "@/server/seo/types";

async function getPublishedToolsBySlugs(slugs: string[]) {
  if (slugs.length === 0) {
    return [];
  }

  const tools = await prisma.tool.findMany({
    where: {
      slug: {
        in: slugs,
      },
      ...getPubliclyVisibleToolWhere(),
    },
    include: toolDetailsInclude,
  });

  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));

  return slugs
    .map((slug) => toolsBySlug.get(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
}

export function hasAlternativesSeoPage(slug: string) {
  return Boolean(alternativesSeoRegistry[slug]);
}

function buildBestTagTitle(tagName: string) {
  return `Best ${tagName} tools for bootstrapped SaaS founders`;
}

function buildBestTagIntro(tagName: string, description?: string | null) {
  if (description?.trim()) {
    return description.trim();
  }

  return `Browse published ${tagName} tools curated for bootstrapped SaaS founders on Shipboost.`;
}

function buildBestTagMetaDescription(tagName: string, description?: string | null) {
  if (description?.trim()) {
    return description.trim();
  }

  return `Explore published ${tagName} tools curated for bootstrapped SaaS founders on Shipboost.`;
}

export async function getAlternativesSeoPage(slug: string) {
  const entry: AlternativesSeoEntry | undefined = alternativesSeoRegistry[slug];

  if (!entry) {
    return null;
  }

  const [anchorTool, tools] = await Promise.all([
    prisma.tool.findFirst({
      where: {
        slug: entry.anchorToolSlug,
        ...getPubliclyVisibleToolWhere(),
      },
      include: toolDetailsInclude,
    }),
    getPublishedToolsBySlugs(entry.toolSlugs),
  ]);

  if (!anchorTool || tools.length === 0) {
    return null;
  }

  return {
    entry,
    anchorTool,
    tools,
  };
}

export async function getBestTagSeoPage(
  slug: string,
  sort: "newest" | "top" = "newest",
) {
  const [tag, tools] = await Promise.all([
    prisma.tag.findFirst({
      where: {
        slug,
        isActive: true,
      },
    }),
    prisma.tool.findMany({
      where: {
        ...getPubliclyVisibleToolWhere(),
        toolTags: {
          some: {
            tag: {
              slug,
              isActive: true,
            },
          },
        },
      },
      include: toolDetailsInclude,
      orderBy:
        sort === "top"
          ? [{ toolVotes: { _count: "desc" } }, { isFeatured: "desc" }]
          : [{ createdAt: "desc" }, { isFeatured: "desc" }],
    }),
  ]);

  if (!tag || tools.length === 0) {
    return null;
  }

  const override: BestTagSeoEntry | undefined = bestTagSeoRegistry[slug];
  const resolvedTitle = override?.title?.trim() || buildBestTagTitle(tag.name);
  const resolvedIntro =
    override?.intro?.trim() || buildBestTagIntro(tag.name, tag.description);
  const resolvedMetaTitle =
    override?.metaTitle?.trim() || `${resolvedTitle} | Shipboost`;
  const resolvedMetaDescription =
    override?.metaDescription?.trim() ||
    buildBestTagMetaDescription(tag.name, tag.description);

  return {
    entry: {
      slug,
      title: resolvedTitle,
      intro: resolvedIntro,
      metaTitle: resolvedMetaTitle,
      metaDescription: resolvedMetaDescription,
      faq: override?.faq,
    },
    tag,
    tools,
  };
}
