import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, assertCatalogAssignmentsMock } = vi.hoisted(() => ({
  prismaMock: {
    tool: {
      findMany: vi.fn(),
    },
  },
  assertCatalogAssignmentsMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/services/catalog", () => ({
  assertCatalogAssignments: assertCatalogAssignmentsMock,
}));

import { createSubmission } from "@/server/services/submission-draft-service";

describe("submission-draft-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertCatalogAssignmentsMock.mockResolvedValue(undefined);
  });

  it("blocks duplicate submissions by root domain and returns CTA metadata", async () => {
    prismaMock.tool.findMany.mockResolvedValueOnce([
      {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        ownerUserId: "founder_1",
        websiteUrl: "https://www.acme.com",
      },
    ]);

    await expect(
      createSubmission(
        {
          submissionType: "FREE_LAUNCH",
          requestedSlug: "acme-2",
          preferredLaunchDate: undefined,
          name: "Acme",
          tagline: "Launch your SaaS faster with Acme.",
          websiteUrl: "https://app.acme.com",
          richDescription:
            "Acme helps founders launch products faster with a focused workflow that keeps teams aligned.",
          pricingModel: "FREEMIUM",
          categoryIds: ["cm1234567890123456789012"],
          tagIds: ["cm1234567890123456789013"],
          logo: {
            url: "https://example.com/logo.png",
          },
          screenshots: [],
          affiliateUrl: undefined,
          affiliateSource: undefined,
          hasAffiliateProgram: false,
          founderXUrl: undefined,
          founderGithubUrl: undefined,
          founderLinkedinUrl: undefined,
          founderFacebookUrl: undefined,
        },
        {
          id: "founder_1",
        },
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "This domain already exists on ShipBoost.",
      details: {
        duplicateTool: {
          id: "tool_1",
          slug: "acme",
          name: "Acme",
          ownedByYou: true,
          ctaHref: "/dashboard/tools/tool_1",
          ctaLabel: "Manage existing listing",
        },
      },
    });
  });
});
