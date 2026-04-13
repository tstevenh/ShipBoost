import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  assertCatalogAssignmentsMock,
  getSubmissionByIdForFounderMock,
  replaceToolCategoriesMock,
  replaceToolTagsMock,
} = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(),
    tool: {
      findMany: vi.fn(),
    },
  },
  assertCatalogAssignmentsMock: vi.fn(),
  getSubmissionByIdForFounderMock: vi.fn(),
  replaceToolCategoriesMock: vi.fn(),
  replaceToolTagsMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/services/catalog", () => ({
  assertCatalogAssignments: assertCatalogAssignmentsMock,
}));

vi.mock("@/server/repositories/submission-repository", () => ({
  getSubmissionByIdForFounder: getSubmissionByIdForFounderMock,
  getSubmissionById: vi.fn(),
  listAdminSubmissions: vi.fn(),
  listSubmissionSummariesForFounder: vi.fn(),
}));

vi.mock("@/server/repositories/tool-repository", () => ({
  replaceToolCategories: replaceToolCategoriesMock,
  replaceToolTags: replaceToolTagsMock,
}));

import { createSubmission } from "@/server/services/submission-draft-service";

describe("submission-draft-service update path", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.tool.findMany.mockResolvedValue([]);
    assertCatalogAssignmentsMock.mockResolvedValue(undefined);
    replaceToolCategoriesMock.mockResolvedValue(undefined);
    replaceToolTagsMock.mockResolvedValue(undefined);
  });

  it("skips media and taxonomy rewrites when unchanged draft assets and assignments are resubmitted", async () => {
    const tx = {
      tool: {
        update: vi.fn().mockResolvedValue(undefined),
      },
      toolMedia: {
        update: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockResolvedValue({ id: "logo_media_new" }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      submission: {
        update: vi.fn().mockResolvedValue(undefined),
      },
    };

    prismaMock.$transaction.mockImplementation(async (callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    );

    getSubmissionByIdForFounderMock.mockResolvedValue({
      id: "submission_1",
      toolId: "tool_1",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "DRAFT",
      badgeVerification: "VERIFIED",
      tool: {
        id: "tool_1",
        slug: "perf-free",
        websiteUrl: "https://perf-free.perfshipboostfree.com",
        logoMediaId: "logo_media_1",
        logoMedia: {
          id: "logo_media_1",
          url: "https://cdn.example.com/logo.webp",
          publicId: "logo_public_id",
          format: "webp",
          width: 2000,
          height: 2000,
        },
        media: [
          {
            id: "media_1",
            type: "SCREENSHOT",
            url: "https://cdn.example.com/screenshot-1.webp",
            publicId: "screenshot_public_id",
            format: "webp",
            width: 2000,
            height: 2000,
            sortOrder: 0,
          },
        ],
        toolCategories: [
          {
            categoryId: "category_1",
          },
        ],
        toolTags: [
          {
            tagId: "tag_1",
          },
          {
            tagId: "tag_2",
          },
        ],
      },
    });

    const result = await createSubmission(
      {
        submissionId: "submission_1",
        submissionType: "FREE_LAUNCH",
        requestedSlug: "perf-free",
        preferredLaunchDate: undefined,
        name: "Perf Free",
        tagline: "Measure JSON-only repeat saves after the first upload.",
        websiteUrl: "https://perf-free.perfshipboostfree.com",
        richDescription:
          "This submission keeps the same media and taxonomy assignments so the update path should avoid rewriting unchanged rows.",
        pricingModel: "PAID",
        categoryIds: ["category_1"],
        tagIds: ["tag_1", "tag_2"],
        logo: {
          url: "https://cdn.example.com/logo.webp",
          publicId: "logo_public_id",
          format: "webp",
          width: 2000,
          height: 2000,
        },
        screenshots: [
          {
            url: "https://cdn.example.com/screenshot-1.webp",
            publicId: "screenshot_public_id",
            format: "webp",
            width: 2000,
            height: 2000,
          },
        ],
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
    );

    expect(result).toEqual({
      id: "submission_1",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "DRAFT",
      paymentStatus: "NOT_REQUIRED",
      badgeVerification: "VERIFIED",
    });
    expect(tx.tool.update).toHaveBeenCalledTimes(1);
    expect(tx.toolMedia.update).not.toHaveBeenCalled();
    expect(tx.toolMedia.deleteMany).not.toHaveBeenCalled();
    expect(tx.toolMedia.createMany).not.toHaveBeenCalled();
    expect(replaceToolCategoriesMock).not.toHaveBeenCalled();
    expect(replaceToolTagsMock).not.toHaveBeenCalled();
    expect(tx.submission.update).toHaveBeenCalledTimes(1);
  });
});
