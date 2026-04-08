import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/seo/registry", () => ({
  alternativesSeoRegistry: {
    "example-tool": {
      slug: "example-tool",
      anchorToolSlug: "example-tool",
      title: "Best alternatives to Example Tool",
      intro: "Compare stronger alternatives if Example Tool is not the right fit.",
      metaTitle: "Best alternatives to Example Tool | Shipboost",
      metaDescription: "Manual alternatives to Example Tool.",
      toolSlugs: ["tool-one", "tool-two"],
    },
  },
  bestTagSeoRegistry: {
    ai: {
      slug: "ai",
      title: "Best AI tools",
      intro: "Manual AI picks.",
      metaTitle: "Best AI tools | Shipboost",
      metaDescription: "Curated AI tools.",
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
  getBestTagSeoPage,
  hasAlternativesSeoPage,
} from "@/server/services/seo-service";

describe("seo-service", () => {
  it("returns null for missing alternatives registry entries", async () => {
    await expect(getAlternativesSeoPage("missing-tool")).resolves.toBeNull();
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

    expect(page?.entry.title).toBe(
      "Best SEO tools for bootstrapped SaaS founders",
    );
    expect(page?.entry.metaDescription).toBe(
      "Explore published SEO tools curated for bootstrapped SaaS founders on Shipboost.",
    );
  });

  it("exposes link helpers for configured alternatives pages", () => {
    expect(hasAlternativesSeoPage("example-tool")).toBe(true);
  });
});
