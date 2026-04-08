import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    tool: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db/client";
import { searchPublishedTools } from "@/server/services/tool-service";

describe("searchPublishedTools", () => {
  it("returns only published approved tools", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_1",
        slug: "calm-sea",
        name: "Calm Sea",
        tagline: "Finance clarity for founders",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [],
      },
    ] as never);

    const results = await searchPublishedTools("sea");

    expect(prisma.tool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          publicationStatus: "PUBLISHED",
          moderationStatus: "APPROVED",
        }),
      }),
    );
    expect(results).toHaveLength(1);
  });

  it("keeps exact and prefix name matches ahead of tag-only matches", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_2",
        slug: "ocean-mail",
        name: "OceanMail",
        tagline: "Ship warmer outbound email",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [{ tag: { id: "tag_1", slug: "sea", name: "Sea" } }],
      },
      {
        id: "tool_1",
        slug: "sea-notes",
        name: "Sea Notes",
        tagline: "Capture product research fast",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [],
      },
    ] as never);

    const results = await searchPublishedTools("sea");

    expect(results.map((item) => item.slug)).toEqual([
      "sea-notes",
      "ocean-mail",
    ]);
  });
});
