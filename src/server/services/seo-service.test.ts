import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/seo/registry", () => ({
  alternativesSeoRegistry: {
    "example-tool": {
      slug: "example-tool",
      anchorToolSlug: "example-tool",
      title: "Best alternatives to Example Tool",
      intro: "Compare stronger alternatives if Example Tool is not the right fit.",
      metaTitle: "Best alternatives to Example Tool | ShipBoost",
      metaDescription: "Manual alternatives to Example Tool.",
      toolSlugs: ["tool-one", "tool-two"],
    },
  },
  bestTagSeoRegistry: {
    ai: {
      slug: "ai",
      title: "Best AI tools",
      intro: "Manual AI picks.",
      metaTitle: "Best AI tools | ShipBoost",
      metaDescription: "Curated AI tools.",
    },
  },
}));

vi.mock("@/server/seo/best-pages", () => ({
  bestPagesRegistry: {
    "help-desk-software": {
      slug: "help-desk-software",
      targetKeyword: "best help desk software",
      title: "Best Help Desk Software",
      metaTitle: "Best Help Desk Software | ShipBoost",
      metaDescription: "Curated help desk picks.",
      intro: "Support tools ranked by fit.",
      whoItsFor: "Support teams choosing a help desk.",
      howWeEvaluated: ["Ease of use", "Ticketing depth"],
      comparisonTable: [],
      rankedTools: [
        {
          toolSlug: "zendesk",
          rank: 1,
          verdict: "Strong benchmark.",
          bestFor: "Scaling teams",
          notIdealFor: "Very small teams",
        },
        {
          toolSlug: "freshdesk",
          rank: 2,
          verdict: "Balanced choice.",
          bestFor: "Growing teams",
          notIdealFor: "Messaging-first teams",
        },
      ],
      faq: [],
      internalLinks: [],
      primaryCategorySlug: "support",
      supportingTagSlugs: ["help-desk"],
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: {
    tool: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    tag: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db/client";
import {
  getAlternativesSeoPage,
  getBestSeoPage,
  getBestTagSeoPage,
  hasBestSeoPage,
  hasAlternativesSeoPage,
} from "@/server/services/seo-service";

describe("seo-service", () => {
  it("returns null for missing alternatives registry entries", async () => {
    await expect(getAlternativesSeoPage("missing-tool")).resolves.toBeNull();
  });

  it("returns null when a best page is missing from the registry", async () => {
    await expect(getBestSeoPage("missing-page")).resolves.toBeNull();
  });

  it("filters missing and unpublished tools out of best-tag pages", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValueOnce({
      id: "tag_1",
      slug: "ai",
      name: "AI",
      description: "AI tools for founders.",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_1",
        slug: "tool-one",
        name: "Tool One",
        tagline: "A published tool",
        isFeatured: false,
        logoMedia: null,
        media: [],
        toolCategories: [],
        toolTags: [],
        submissions: [],
        launches: [],
      },
    ] as never);

    const page = await getBestTagSeoPage("ai");

    expect(page?.tools.map((tool) => tool.slug)).toEqual(["tool-one"]);
    expect(page?.entry.title).toBe("Best AI tools");
  });

  it("uses generated copy when no tag override exists", async () => {
    vi.mocked(prisma.tag.findFirst).mockResolvedValueOnce({
      id: "tag_2",
      slug: "seo",
      name: "SEO",
      description: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_2",
        slug: "rank-tool",
        name: "Rank Tool",
        tagline: "SEO workflows",
        isFeatured: false,
        logoMedia: null,
        media: [],
        toolCategories: [],
        toolTags: [],
        submissions: [],
        launches: [],
      },
    ] as never);

    const page = await getBestTagSeoPage("seo");

    expect(page?.entry.title).toBe("Best SEO SaaS Tools");
    expect(page?.entry.metaDescription).toBe(
      "Browse the best SEO tools on ShipBoost. Compare curated products, discover alternatives, and find founder-friendly picks.",
    );
  });

  it("exposes link helpers for configured alternatives pages", () => {
    expect(hasAlternativesSeoPage("example-tool")).toBe(true);
  });

  it("resolves a best page with ranked tools in registry order", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_1",
        slug: "zendesk",
        name: "Zendesk",
        tagline: "Customer support",
        isFeatured: false,
        logoMedia: null,
        media: [],
        toolCategories: [],
        toolTags: [],
        submissions: [],
        launches: [],
      },
      {
        id: "tool_2",
        slug: "freshdesk",
        name: "Freshdesk",
        tagline: "Ticketing and support",
        isFeatured: false,
        logoMedia: null,
        media: [],
        toolCategories: [],
        toolTags: [],
        submissions: [],
        launches: [],
      },
    ] as never);

    const page = await getBestSeoPage("help-desk-software");

    expect(page?.tools.map((tool) => tool.slug)).toEqual([
      "zendesk",
      "freshdesk",
    ]);
    expect(page?.entry.title).toBe("Best Help Desk Software");
  });

  it("exposes a registry helper for best pages", () => {
    expect(hasBestSeoPage("help-desk-software")).toBe(true);
  });
});
