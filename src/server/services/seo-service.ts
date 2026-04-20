import { prisma } from "@/server/db/client";
import { publicToolCardSelect } from "@/server/db/public-selects";
import { bestPagesRegistry } from "@/server/seo/best-pages";
import {
  alternativesSeoRegistry,
  bestTagSeoRegistry,
} from "@/server/seo/registry";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import type {
  AlternativesSeoEntry,
  BestPageEntry,
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
    select: publicToolCardSelect,
  });

  const toolsBySlug = new Map(tools.map((tool) => [tool.slug, tool]));

  return slugs
    .map((slug) => toolsBySlug.get(slug))
    .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool));
}

export function hasAlternativesSeoPage(slug: string) {
  return Boolean(alternativesSeoRegistry[slug]);
}

export function hasBestSeoPage(slug: string) {
  return Boolean(bestPagesRegistry[slug]);
}

function buildBestTagTitle(tagName: string) {
  return `Best ${tagName} SaaS Tools`;
}

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function isReusableBestTagDescription(
  tagName: string,
  description?: string | null,
) {
  if (!description?.trim()) {
    return false;
  }

  const normalizedDescription = normalizeWhitespace(description).toLowerCase();
  const normalizedTagName = normalizeWhitespace(tagName).toLowerCase();

  const genericDescriptions = new Set([
    `browse published ${normalizedTagName} tools curated for bootstrapped saas founders on shipboost.`,
    `browse the best ${normalizedTagName} tools on shipboost. compare curated products, discover alternatives, and find founder-friendly picks.`,
  ]);

  return !genericDescriptions.has(normalizedDescription);
}

function buildBestTagIntro(tagName: string, description?: string | null) {
  if (isReusableBestTagDescription(tagName, description)) {
    return description!.trim();
  }

  return `Browse published ${tagName} tools curated for bootstrapped SaaS founders on ShipBoost.`;
}

function buildBestTagMetaDescription(tagName: string, description?: string | null) {
  if (isReusableBestTagDescription(tagName, description)) {
    return description!.trim();
  }

  return `Browse the best ${tagName} tools on ShipBoost. Compare curated products, discover alternatives, and find founder-friendly picks.`;
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
      select: publicToolCardSelect,
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

export async function getBestSeoPage(slug: string) {
  const entry: BestPageEntry | undefined = bestPagesRegistry[slug];

  if (!entry) {
    return null;
  }

  const rankedSlugs = entry.rankedTools.map((item) => item.toolSlug);
  const tools = await getPublishedToolsBySlugs(rankedSlugs);

  if (tools.length !== rankedSlugs.length) {
    return null;
  }

  return {
    entry,
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
      select: publicToolCardSelect,
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
    override?.metaTitle?.trim() || `${resolvedTitle} | ShipBoost`;
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
