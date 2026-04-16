import { ZodError } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    submission: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    submissionSpotlightBrief: {
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    blogArticle: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  linkPublishedSpotlightArticle,
  saveFounderSpotlightBrief,
} from "@/server/services/submission-spotlight-service";

describe("submission-spotlight-service", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-16T03:00:00.000Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("rejects non-premium submissions", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "submission_1",
      userId: "founder_1",
      submissionType: "FREE_LAUNCH",
      paymentStatus: "NOT_REQUIRED",
      preferredLaunchDate: null,
      tool: {
        name: "Acme",
        websiteUrl: "https://acme.com",
      },
      spotlightBrief: null,
    });

    await expect(
      saveFounderSpotlightBrief("submission_1", { id: "founder_1" }, {
        audience: "Bootstrap founders",
      }),
    ).rejects.toThrow("Only premium launches include a spotlight brief.");
  });

  it("rejects unpaid premium submissions", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "submission_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PENDING",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      tool: {
        name: "Acme",
        websiteUrl: "https://acme.com",
      },
      spotlightBrief: null,
    });

    await expect(
      saveFounderSpotlightBrief("submission_1", { id: "founder_1" }, {
        audience: "Bootstrap founders",
      }),
    ).rejects.toThrow(
      "Pay for the premium launch before editing the spotlight brief.",
    );
  });

  it("marks the first partial save as in progress", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "submission_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      tool: {
        name: "Acme",
        websiteUrl: "https://acme.com",
      },
      spotlightBrief: {
        id: "brief_1",
        status: "NOT_STARTED",
        audience: null,
        problem: null,
        differentiator: null,
        emphasis: null,
        primaryCtaUrl: null,
        founderQuote: null,
        wordingToAvoid: null,
        firstTouchedAt: null,
        completedAt: null,
        publishedAt: null,
        updatedAt: new Date("2026-04-16T02:00:00.000Z"),
        publishedArticle: null,
      },
    });
    prismaMock.submissionSpotlightBrief.update.mockResolvedValueOnce({
      id: "brief_1",
      status: "IN_PROGRESS",
      audience: "Bootstrap founders",
      problem: null,
      differentiator: null,
      emphasis: null,
      primaryCtaUrl: null,
      founderQuote: null,
      wordingToAvoid: null,
      firstTouchedAt: new Date("2026-04-16T03:00:00.000Z"),
      completedAt: null,
      publishedAt: null,
      updatedAt: new Date("2026-04-16T03:00:00.000Z"),
      publishedArticle: null,
    });

    const result = await saveFounderSpotlightBrief(
      "submission_1",
      { id: "founder_1" },
      { audience: "Bootstrap founders" },
    );

    expect(prismaMock.submissionSpotlightBrief.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { submissionId: "submission_1" },
        data: expect.objectContaining({
          status: "IN_PROGRESS",
          audience: "Bootstrap founders",
          firstTouchedAt: new Date("2026-04-16T03:00:00.000Z"),
          completedAt: null,
        }),
      }),
    );
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("marks a complete brief as ready", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "submission_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      tool: {
        name: "Acme",
        websiteUrl: "https://acme.com",
      },
      spotlightBrief: {
        id: "brief_1",
        status: "IN_PROGRESS",
        audience: "Bootstrap founders",
        problem: null,
        differentiator: null,
        emphasis: null,
        primaryCtaUrl: null,
        founderQuote: null,
        wordingToAvoid: null,
        firstTouchedAt: new Date("2026-04-16T01:00:00.000Z"),
        completedAt: null,
        publishedAt: null,
        updatedAt: new Date("2026-04-16T02:00:00.000Z"),
        publishedArticle: null,
      },
    });
    prismaMock.submissionSpotlightBrief.update.mockResolvedValueOnce({
      id: "brief_1",
      status: "READY",
      audience: "Bootstrap founders",
      problem: "Helps founders keep launch distribution organized.",
      differentiator: "Built for weekly launch visibility.",
      emphasis: "Focus on long-tail discovery.",
      primaryCtaUrl: "https://acme.com/signup",
      founderQuote: null,
      wordingToAvoid: null,
      firstTouchedAt: new Date("2026-04-16T01:00:00.000Z"),
      completedAt: new Date("2026-04-16T03:00:00.000Z"),
      publishedAt: null,
      updatedAt: new Date("2026-04-16T03:00:00.000Z"),
      publishedArticle: null,
    });

    const result = await saveFounderSpotlightBrief(
      "submission_1",
      { id: "founder_1" },
      {
        audience: "Bootstrap founders",
        problem: "Helps founders keep launch distribution organized.",
        differentiator: "Built for weekly launch visibility.",
        emphasis: "Focus on long-tail discovery.",
        primaryCtaUrl: "https://acme.com/signup",
      },
    );

    expect(prismaMock.submissionSpotlightBrief.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "READY",
          completedAt: new Date("2026-04-16T03:00:00.000Z"),
        }),
      }),
    );
    expect(result.status).toBe("READY");
  });

  it("rejects malformed CTA urls", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "submission_1",
      userId: "founder_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
      tool: {
        name: "Acme",
        websiteUrl: "https://acme.com",
      },
      spotlightBrief: {
        id: "brief_1",
        status: "NOT_STARTED",
        audience: null,
        problem: null,
        differentiator: null,
        emphasis: null,
        primaryCtaUrl: null,
        founderQuote: null,
        wordingToAvoid: null,
        firstTouchedAt: null,
        completedAt: null,
        publishedAt: null,
        updatedAt: new Date("2026-04-16T02:00:00.000Z"),
        publishedArticle: null,
      },
    });

    await expect(
      saveFounderSpotlightBrief("submission_1", { id: "founder_1" }, {
        primaryCtaUrl: "not-a-valid-url",
      }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("rejects unpublished spotlight articles", async () => {
    prismaMock.submission.findUnique.mockResolvedValueOnce({
      id: "submission_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
    });
    prismaMock.blogArticle.findUnique.mockResolvedValueOnce({
      id: "article_1",
      slug: "launch-week-feature-acme",
      status: "DRAFT",
      primaryCategory: {
        slug: "launch-spotlights",
      },
    });

    await expect(
      linkPublishedSpotlightArticle({
        submissionId: "submission_1",
        articleSlug: "launch-week-feature-acme",
      }),
    ).rejects.toThrow("Select a published spotlight article.");
  });

  it("rejects spotlight articles in the wrong category", async () => {
    prismaMock.submission.findUnique.mockResolvedValueOnce({
      id: "submission_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
    });
    prismaMock.blogArticle.findUnique.mockResolvedValueOnce({
      id: "article_1",
      slug: "launch-week-feature-acme",
      status: "PUBLISHED",
      primaryCategory: {
        slug: "news",
      },
    });

    await expect(
      linkPublishedSpotlightArticle({
        submissionId: "submission_1",
        articleSlug: "launch-week-feature-acme",
      }),
    ).rejects.toThrow("Spotlight articles must use the Launch Spotlights category.");
  });

  it("marks the spotlight published when a valid article slug is linked", async () => {
    prismaMock.submission.findUnique.mockResolvedValueOnce({
      id: "submission_1",
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
    });
    prismaMock.blogArticle.findUnique.mockResolvedValueOnce({
      id: "article_1",
      slug: "launch-week-feature-acme",
      status: "PUBLISHED",
      primaryCategory: {
        slug: "launch-spotlights",
      },
    });
    prismaMock.submissionSpotlightBrief.upsert.mockResolvedValueOnce({
      status: "PUBLISHED",
      updatedAt: new Date("2026-04-16T03:00:00.000Z"),
      publishedAt: new Date("2026-04-16T03:00:00.000Z"),
      publishedArticle: {
        slug: "launch-week-feature-acme",
        title: "Acme launch spotlight",
      },
    });

    const result = await linkPublishedSpotlightArticle({
      submissionId: "submission_1",
      articleSlug: "launch-week-feature-acme",
    });

    expect(prismaMock.submissionSpotlightBrief.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { submissionId: "submission_1" },
        update: expect.objectContaining({
          status: "PUBLISHED",
          publishedArticleId: "article_1",
        }),
      }),
    );
    expect(result.status).toBe("PUBLISHED");
  });
});
