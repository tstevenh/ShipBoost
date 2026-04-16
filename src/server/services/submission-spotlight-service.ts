import type { SubmissionSpotlightStatus } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import {
  spotlightBriefSchema,
  type SpotlightBriefInput,
} from "@/server/validators/submission";

type FounderSpotlightArticleSummary = {
  slug: string;
  title: string;
};

type FounderSpotlightBriefRecord = {
  id: string;
  status: SubmissionSpotlightStatus;
  audience: string | null;
  problem: string | null;
  differentiator: string | null;
  emphasis: string | null;
  primaryCtaUrl: string | null;
  founderQuote: string | null;
  wordingToAvoid: string | null;
  firstTouchedAt: Date | null;
  completedAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date;
  publishedArticle: FounderSpotlightArticleSummary | null;
};

type FounderPremiumSubmission = {
  id: string;
  userId: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  preferredLaunchDate: Date | null;
  tool: {
    name: string;
    websiteUrl: string;
  };
  spotlightBrief: FounderSpotlightBriefRecord | null;
};

function normalizeOptionalString(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSpotlightDraft(input: SpotlightBriefInput) {
  return {
    audience: normalizeOptionalString(input.audience),
    problem: normalizeOptionalString(input.problem),
    differentiator: normalizeOptionalString(input.differentiator),
    emphasis: normalizeOptionalString(input.emphasis),
    primaryCtaUrl: normalizeOptionalString(input.primaryCtaUrl),
    founderQuote: normalizeOptionalString(input.founderQuote),
    wordingToAvoid: normalizeOptionalString(input.wordingToAvoid),
  };
}

export function getSpotlightStatus(input: SpotlightBriefInput): SubmissionSpotlightStatus {
  const normalized = normalizeSpotlightDraft(input);
  const required = [
    normalized.audience,
    normalized.problem,
    normalized.differentiator,
    normalized.emphasis,
    normalized.primaryCtaUrl,
  ];

  if (required.every((value) => !value)) {
    return "NOT_STARTED";
  }

  if (required.every((value) => value)) {
    return "READY";
  }

  return "IN_PROGRESS";
}

function serializeFounderSpotlightBrief(
  submission: FounderPremiumSubmission,
  brief: FounderSpotlightBriefRecord,
) {
  return {
    submissionId: submission.id,
    toolName: submission.tool.name,
    launchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    status: brief.status,
    audience: brief.audience,
    problem: brief.problem,
    differentiator: brief.differentiator,
    emphasis: brief.emphasis,
    primaryCtaUrl: brief.primaryCtaUrl,
    founderQuote: brief.founderQuote,
    wordingToAvoid: brief.wordingToAvoid,
    firstTouchedAt: brief.firstTouchedAt?.toISOString() ?? null,
    completedAt: brief.completedAt?.toISOString() ?? null,
    publishedAt: brief.publishedAt?.toISOString() ?? null,
    updatedAt: brief.updatedAt.toISOString(),
    publishedArticle: brief.publishedArticle,
  };
}

async function getFounderPremiumSubmission(
  submissionId: string,
  founderId: string,
): Promise<FounderPremiumSubmission> {
  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      userId: founderId,
    },
    select: {
      id: true,
      userId: true,
      submissionType: true,
      paymentStatus: true,
      preferredLaunchDate: true,
      tool: {
        select: {
          name: true,
          websiteUrl: true,
        },
      },
      spotlightBrief: {
        select: {
          id: true,
          status: true,
          audience: true,
          problem: true,
          differentiator: true,
          emphasis: true,
          primaryCtaUrl: true,
          founderQuote: true,
          wordingToAvoid: true,
          firstTouchedAt: true,
          completedAt: true,
          publishedAt: true,
          updatedAt: true,
          publishedArticle: {
            select: {
              slug: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.submissionType !== "FEATURED_LAUNCH") {
    throw new AppError(400, "Only premium launches include a spotlight brief.");
  }

  if (submission.paymentStatus !== "PAID") {
    throw new AppError(400, "Pay for the premium launch before editing the spotlight brief.");
  }

  return submission;
}

async function ensureSpotlightBrief(
  submission: FounderPremiumSubmission,
): Promise<FounderSpotlightBriefRecord> {
  if (submission.spotlightBrief) {
    return submission.spotlightBrief;
  }

  const created = await prisma.submissionSpotlightBrief.create({
    data: {
      submissionId: submission.id,
      status: "NOT_STARTED",
    },
    select: {
      id: true,
      status: true,
      audience: true,
      problem: true,
      differentiator: true,
      emphasis: true,
      primaryCtaUrl: true,
      founderQuote: true,
      wordingToAvoid: true,
      firstTouchedAt: true,
      completedAt: true,
      publishedAt: true,
      updatedAt: true,
      publishedArticle: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });

  return created;
}

export async function getFounderSpotlightBrief(
  submissionId: string,
  founder: { id: string },
) {
  const submission = await getFounderPremiumSubmission(submissionId, founder.id);
  const brief = await ensureSpotlightBrief(submission);

  return serializeFounderSpotlightBrief(submission, brief);
}

export async function saveFounderSpotlightBrief(
  submissionId: string,
  founder: { id: string },
  input: SpotlightBriefInput,
) {
  const validatedInput = spotlightBriefSchema.parse(input);
  const submission = await getFounderPremiumSubmission(submissionId, founder.id);
  const brief = await ensureSpotlightBrief(submission);

  if (brief.status === "PUBLISHED") {
    throw new AppError(
      409,
      "This spotlight brief is already published and can no longer be edited.",
    );
  }

  const normalized = normalizeSpotlightDraft(validatedInput);
  const nextStatus = getSpotlightStatus(normalized);
  const now = new Date();

  const updatedBrief = await prisma.submissionSpotlightBrief.update({
    where: {
      submissionId: submission.id,
    },
    select: {
      id: true,
      status: true,
      audience: true,
      problem: true,
      differentiator: true,
      emphasis: true,
      primaryCtaUrl: true,
      founderQuote: true,
      wordingToAvoid: true,
      firstTouchedAt: true,
      completedAt: true,
      publishedAt: true,
      updatedAt: true,
      publishedArticle: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
    data: {
      ...normalized,
      status: nextStatus,
      firstTouchedAt:
        !brief.firstTouchedAt && nextStatus !== "NOT_STARTED"
          ? now
          : brief.firstTouchedAt,
      completedAt: nextStatus === "READY" ? now : null,
    },
  });

  return serializeFounderSpotlightBrief(submission, updatedBrief);
}

export async function linkPublishedSpotlightArticle(input: {
  submissionId: string;
  articleSlug: string;
}) {
  const [submission, article] = await Promise.all([
    prisma.submission.findUnique({
      where: { id: input.submissionId },
      select: {
        id: true,
        submissionType: true,
        paymentStatus: true,
      },
    }),
    prisma.blogArticle.findUnique({
      where: { slug: input.articleSlug.trim() },
      include: {
        primaryCategory: true,
      },
    }),
  ]);

  if (!submission || submission.submissionType !== "FEATURED_LAUNCH") {
    throw new AppError(400, "Only paid premium launches can publish a spotlight.");
  }

  if (submission.paymentStatus !== "PAID") {
    throw new AppError(400, "Only paid premium launches can publish a spotlight.");
  }

  if (!article || article.status !== "PUBLISHED") {
    throw new AppError(400, "Select a published spotlight article.");
  }

  if (article.primaryCategory.slug !== "launch-spotlights") {
    throw new AppError(
      400,
      "Spotlight articles must use the Launch Spotlights category.",
    );
  }

  return prisma.submissionSpotlightBrief.upsert({
    where: {
      submissionId: input.submissionId,
    },
    update: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedArticleId: article.id,
    },
    create: {
      submissionId: input.submissionId,
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedArticleId: article.id,
    },
    select: {
      status: true,
      updatedAt: true,
      publishedAt: true,
      publishedArticle: {
        select: {
          slug: true,
          title: true,
        },
      },
    },
  });
}
