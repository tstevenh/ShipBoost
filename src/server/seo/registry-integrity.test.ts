import { describe, expect, it } from "vitest";

import { prisma } from "@/server/db/client";
import { bestPagesRegistry } from "@/server/seo/best-pages";
import { alternativesSeoRegistry } from "@/server/seo/registry";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";

const dbIt = process.env.DATABASE_URL ? it : it.skip;

describe("SEO registry integrity", () => {
  dbIt("references only publicly visible tools", async () => {
    const referencedToolSlugs = new Set<string>();

    for (const page of Object.values(bestPagesRegistry)) {
      for (const tool of page.rankedTools) {
        referencedToolSlugs.add(tool.toolSlug);
      }
    }

    for (const entry of Object.values(alternativesSeoRegistry)) {
      referencedToolSlugs.add(entry.anchorToolSlug);

      for (const toolSlug of entry.toolSlugs) {
        referencedToolSlugs.add(toolSlug);
      }
    }

    const slugs = [...referencedToolSlugs].sort();
    const tools = await prisma.tool.findMany({
      where: {
        slug: {
          in: slugs,
        },
        ...getPubliclyVisibleToolWhere(),
      },
      select: {
        slug: true,
      },
    });
    const publicSlugs = new Set(tools.map((tool) => tool.slug));
    const missingSlugs = slugs.filter((slug) => !publicSlugs.has(slug));

    expect(missingSlugs).toEqual([]);
  });

  dbIt("keeps best page internal links pointed at existing public routes", async () => {
    const categorySlugs = new Set(
      (
        await prisma.category.findMany({
          select: {
            slug: true,
          },
        })
      ).map((category) => category.slug),
    );
    const tagSlugs = new Set(
      (
        await prisma.tag.findMany({
          where: {
            isActive: true,
          },
          select: {
            slug: true,
          },
        })
      ).map((tag) => tag.slug),
    );
    const publicToolSlugs = new Set(
      (
        await prisma.tool.findMany({
          where: getPubliclyVisibleToolWhere(),
          select: {
            slug: true,
          },
        })
      ).map((tool) => tool.slug),
    );
    const badLinks: string[] = [];

    for (const page of Object.values(bestPagesRegistry)) {
      for (const link of page.internalLinks) {
        const [route, slug] = link.href.split("/").filter(Boolean);

        if (route === "best" && slug && !bestPagesRegistry[slug]) {
          badLinks.push(link.href);
        } else if (
          route === "alternatives" &&
          slug &&
          !alternativesSeoRegistry[slug]
        ) {
          badLinks.push(link.href);
        } else if (route === "categories" && slug && !categorySlugs.has(slug)) {
          badLinks.push(link.href);
        } else if (route === "tags" && slug && !tagSlugs.has(slug)) {
          badLinks.push(link.href);
        } else if (route === "tools" && slug && !publicToolSlugs.has(slug)) {
          badLinks.push(link.href);
        } else if (!["best", "alternatives", "categories", "tags", "tools"].includes(route ?? "")) {
          badLinks.push(link.href);
        }
      }
    }

    expect([...new Set(badLinks)].sort()).toEqual([]);
  });
});
