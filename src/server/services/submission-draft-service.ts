import { Prisma } from "@prisma/client";

import { deleteImageFromCloudinary } from "@/server/cloudinary";
import { prisma } from "@/server/db/client";
import { toolDetailsInclude } from "@/server/db/includes";
import { sendSubmissionReceivedEmailMessage } from "@/server/email/transactional";
import { AppError } from "@/server/http/app-error";
import {
  getSubmissionById,
  getSubmissionByIdForFounder,
  listAdminSubmissions,
  listSubmissionSummariesForFounder,
} from "@/server/repositories/submission-repository";
import {
  replaceToolCategories,
  replaceToolTags,
} from "@/server/repositories/tool-repository";
import { capturePostHogEventSafely } from "@/server/posthog";
import { assertCatalogAssignments } from "@/server/services/catalog";
import { createUniqueToolSlug } from "@/server/services/slug";
import {
  buildDuplicateSubmissionDetails,
  findDuplicateToolByRootDomain,
} from "@/server/services/tool-domain";
import type {
  AdminSubmissionListQueryInput,
  SubmissionCreateInput,
} from "@/server/validators/submission";

import {
  type AuthenticatedFounder,
  type DeferredEmailTask,
  type DraftSaveResult,
  type SavedSubmissionDraft,
  formatLaunchDateForEmail,
  freeLaunchBadgePattern,
  getDashboardUrl,
} from "@/server/services/submission-service-shared";

function buildSavedSubmissionDraft(input: {
  id: string;
  submissionType: SubmissionCreateInput["submissionType"];
  paymentStatus: SavedSubmissionDraft["paymentStatus"];
  badgeVerification: SavedSubmissionDraft["badgeVerification"];
}): SavedSubmissionDraft {
  return {
    id: input.id,
    submissionType: input.submissionType,
    reviewStatus: "DRAFT",
    paymentStatus: input.paymentStatus,
    badgeVerification: input.badgeVerification,
  };
}

function orderedIdsMatch(currentIds: string[], nextIds: string[]) {
  return (
    currentIds.length === nextIds.length &&
    currentIds.every((value, index) => value === nextIds[index])
  );
}

function uploadedMediaMatches(
  current:
    | {
        url: string;
        publicId: string | null;
        format: string | null;
        width: number | null;
        height: number | null;
      }
    | null
    | undefined,
  next: SubmissionCreateInput["logo"],
) {
  if (!current) {
    return false;
  }

  return (
    current.url === next.url &&
    current.publicId === (next.publicId ?? null) &&
    current.format === (next.format ?? null) &&
    current.width === (next.width ?? null) &&
    current.height === (next.height ?? null)
  );
}

function screenshotsMatch(
  current: Array<{
    url: string;
    publicId: string | null;
    format: string | null;
    width: number | null;
    height: number | null;
    sortOrder: number;
  }>,
  next: SubmissionCreateInput["screenshots"],
) {
  return (
    current.length === next.length &&
    current.every((media, index) => {
      const nextMedia = next[index];

      if (!nextMedia) {
        return false;
      }

      return (
        media.sortOrder === index &&
        media.url === nextMedia.url &&
        media.publicId === (nextMedia.publicId ?? null) &&
        media.format === (nextMedia.format ?? null) &&
        media.width === (nextMedia.width ?? null) &&
        media.height === (nextMedia.height ?? null)
      );
    })
  );
}

async function assertNoDuplicateSubmissionDomain(
  websiteUrl: string,
  founderUserId: string,
  options?: { excludeToolId?: string },
) {
  const duplicate = await findDuplicateToolByRootDomain(prisma, websiteUrl, {
    excludeToolId: options?.excludeToolId,
  });

  if (!duplicate) {
    return;
  }

  throw new AppError(
    409,
    "This domain already exists on ShipBoost.",
    buildDuplicateSubmissionDetails(duplicate, founderUserId),
  );
}

async function cleanupDraftMedia(
  result: DraftSaveResult,
  input: SubmissionCreateInput,
) {
  const deletions: Promise<unknown>[] = [];

  if (
    result.replacedLogoPublicId &&
    result.replacedLogoPublicId !== input.logo.publicId
  ) {
    deletions.push(deleteImageFromCloudinary(result.replacedLogoPublicId));
  }

  result.replacedScreenshotPublicIds.forEach((publicId) => {
    if (!input.screenshots.some((item) => item.publicId === publicId)) {
      deletions.push(deleteImageFromCloudinary(publicId));
    }
  });

  if (deletions.length > 0) {
    await Promise.allSettled(deletions);
  }
}

export async function createSubmission(
  input: SubmissionCreateInput,
  founder: AuthenticatedFounder,
) {
  await assertCatalogAssignments(input.categoryIds, input.tagIds);

  if (!input.submissionId) {
    await assertNoDuplicateSubmissionDomain(input.websiteUrl, founder.id);
  }

  if (input.submissionId) {
    const existingSubmission = await getSubmissionByIdForFounder(
      prisma,
      input.submissionId,
      founder.id,
    );

    if (!existingSubmission) {
      throw new AppError(404, "Draft not found.");
    }

    if (
      existingSubmission.reviewStatus !== "DRAFT" &&
      existingSubmission.reviewStatus !== "REJECTED"
    ) {
      throw new AppError(
        409,
        "This launch is already in review or scheduled. Edit it from the dashboard instead.",
      );
    }

    await assertNoDuplicateSubmissionDomain(input.websiteUrl, founder.id, {
      excludeToolId: existingSubmission.toolId,
    });

    const result = await prisma.$transaction(
      async (tx) => {
        const nextSlug =
          input.requestedSlug && input.requestedSlug !== existingSubmission.tool.slug
            ? await createUniqueToolSlug(input.requestedSlug, tx)
            : undefined;
        const nextBadgeVerification =
          input.submissionType !== "FREE_LAUNCH"
            ? "NOT_REQUIRED"
            : existingSubmission.submissionType === "FREE_LAUNCH" &&
                existingSubmission.tool.websiteUrl === input.websiteUrl &&
                existingSubmission.badgeVerification === "VERIFIED"
              ? "VERIFIED"
              : "PENDING";
        const existingScreenshots = existingSubmission.tool.media.filter(
          (media) => media.type === "SCREENSHOT",
        );
        const logoChanged = !uploadedMediaMatches(
          existingSubmission.tool.logoMedia,
          input.logo,
        );
        const screenshotsChanged = !screenshotsMatch(
          existingScreenshots,
          input.screenshots,
        );
        const categoriesChanged = !orderedIdsMatch(
          existingSubmission.tool.toolCategories.map((item) => item.categoryId),
          input.categoryIds,
        );
        const tagsChanged = !orderedIdsMatch(
          existingSubmission.tool.toolTags.map((item) => item.tagId),
          input.tagIds,
        );

        await tx.tool.update({
          where: { id: existingSubmission.toolId },
          data: {
            slug: nextSlug,
            name: input.name,
            tagline: input.tagline,
            websiteUrl: input.websiteUrl,
            richDescription: input.richDescription,
            pricingModel: input.pricingModel,
            affiliateUrl: input.affiliateUrl,
            affiliateSource: input.affiliateSource,
            hasAffiliateProgram: input.hasAffiliateProgram,
            moderationStatus: "DRAFT",
            publicationStatus: "UNPUBLISHED",
            launchBadgeRequired: input.submissionType === "FREE_LAUNCH",
            badgeVerification: nextBadgeVerification,
            currentLaunchType: null,
            isFeatured: input.submissionType === "FEATURED_LAUNCH",
            founderXUrl: input.founderXUrl,
            founderGithubUrl: input.founderGithubUrl,
            founderLinkedinUrl: input.founderLinkedinUrl,
            founderFacebookUrl: input.founderFacebookUrl,
          },
        });

        if (existingSubmission.tool.logoMediaId && logoChanged) {
          await tx.toolMedia.update({
            where: { id: existingSubmission.tool.logoMediaId },
            data: input.logo,
          });
        } else if (!existingSubmission.tool.logoMediaId) {
          const logoMedia = await tx.toolMedia.create({
            data: {
              toolId: existingSubmission.toolId,
              type: "LOGO",
              sortOrder: 0,
              ...input.logo,
            },
          });

          await tx.tool.update({
            where: { id: existingSubmission.toolId },
            data: {
              logoMediaId: logoMedia.id,
            },
          });
        }

        if (screenshotsChanged) {
          await tx.toolMedia.deleteMany({
            where: {
              toolId: existingSubmission.toolId,
              type: "SCREENSHOT",
            },
          });

          if (input.screenshots.length > 0) {
            await tx.toolMedia.createMany({
              data: input.screenshots.map((screenshot, index) => ({
                toolId: existingSubmission.toolId,
                type: "SCREENSHOT",
                sortOrder: index,
                url: screenshot.url,
                publicId: screenshot.publicId,
                format: screenshot.format,
                width: screenshot.width,
                height: screenshot.height,
              })),
            });
          }
        }

        if (categoriesChanged) {
          await replaceToolCategories(tx, existingSubmission.toolId, input.categoryIds);
        }

        if (tagsChanged) {
          await replaceToolTags(tx, existingSubmission.toolId, input.tagIds);
        }

        await tx.submission.update({
          where: { id: existingSubmission.id },
          data: {
            submissionType: input.submissionType,
            requestedSlug: input.requestedSlug,
            preferredLaunchDate: input.preferredLaunchDate,
            paymentStatus:
              input.submissionType === "FEATURED_LAUNCH" ? "PENDING" : "NOT_REQUIRED",
            polarCheckoutId: input.submissionType === "FEATURED_LAUNCH" ? undefined : null,
            polarOrderId: input.submissionType === "FEATURED_LAUNCH" ? undefined : null,
            paidAt: input.submissionType === "FEATURED_LAUNCH" ? undefined : null,
            badgeFooterUrl:
              input.submissionType === "FREE_LAUNCH" ? input.websiteUrl : null,
            badgeVerification: nextBadgeVerification,
            reviewStatus: "DRAFT",
            founderVisibleNote: null,
            internalReviewNote: null,
          },
        });

        return {
          draft: buildSavedSubmissionDraft({
            id: existingSubmission.id,
            submissionType: input.submissionType,
            paymentStatus:
              input.submissionType === "FEATURED_LAUNCH"
                ? "PENDING"
                : "NOT_REQUIRED",
            badgeVerification: nextBadgeVerification,
          }),
          submissionId: existingSubmission.id,
          replacedLogoPublicId: logoChanged
            ? existingSubmission.tool.logoMedia?.publicId ?? null
            : null,
          replacedScreenshotPublicIds: screenshotsChanged
            ? existingScreenshots
                .map((media) => media.publicId)
                .filter((publicId): publicId is string => Boolean(publicId))
            : [],
        } satisfies DraftSaveResult & {
          draft: SavedSubmissionDraft;
        };
      },
      {
        maxWait: 15_000,
        timeout: 15_000,
      },
    );

    await cleanupDraftMedia(result, input);
    return result.draft;
  }

  let createdDraft: SavedSubmissionDraft | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      createdDraft = await prisma.$transaction(
        async (tx) => {
          const user = await tx.user.findUniqueOrThrow({
            where: {
              id: founder.id,
            },
          });

          const slug = await createUniqueToolSlug(
            input.requestedSlug ?? input.name,
            tx,
          );
          const requiresBadge = input.submissionType === "FREE_LAUNCH";
          const tool = await tx.tool.create({
            data: {
              ownerUserId: user.id,
              slug,
              name: input.name,
              tagline: input.tagline,
              websiteUrl: input.websiteUrl,
              richDescription: input.richDescription,
              pricingModel: input.pricingModel,
              affiliateUrl: input.affiliateUrl,
              affiliateSource: input.affiliateSource,
              hasAffiliateProgram: input.hasAffiliateProgram,
              moderationStatus: "DRAFT",
              publicationStatus: "UNPUBLISHED",
              launchBadgeRequired: requiresBadge,
              badgeVerification: requiresBadge ? "PENDING" : "NOT_REQUIRED",
              isFeatured: input.submissionType === "FEATURED_LAUNCH",
              founderXUrl: input.founderXUrl,
              founderGithubUrl: input.founderGithubUrl,
              founderLinkedinUrl: input.founderLinkedinUrl,
              founderFacebookUrl: input.founderFacebookUrl,
            },
          });

          const logoMedia = await tx.toolMedia.create({
            data: {
              toolId: tool.id,
              type: "LOGO",
              sortOrder: 0,
              ...input.logo,
            },
          });

          if (input.screenshots.length > 0) {
            await tx.toolMedia.createMany({
              data: input.screenshots.map((screenshot, index) => ({
                toolId: tool.id,
                type: "SCREENSHOT",
                sortOrder: index,
                url: screenshot.url,
                publicId: screenshot.publicId,
                format: screenshot.format,
                width: screenshot.width,
                height: screenshot.height,
              })),
            });
          }

          await tx.tool.update({
            where: { id: tool.id },
            data: {
              logoMediaId: logoMedia.id,
            },
          });

          await tx.toolCategory.createMany({
            data: input.categoryIds.map((categoryId, index) => ({
              toolId: tool.id,
              categoryId,
              sortOrder: index,
            })),
          });

          await tx.toolTag.createMany({
            data: input.tagIds.map((tagId, index) => ({
              toolId: tool.id,
              tagId,
              sortOrder: index,
            })),
          });

          const submission = await tx.submission.create({
            data: {
              userId: user.id,
              toolId: tool.id,
              submissionType: input.submissionType,
              requestedSlug: input.requestedSlug,
              preferredLaunchDate: input.preferredLaunchDate,
              paymentStatus:
                input.submissionType === "FEATURED_LAUNCH"
                  ? "PENDING"
                  : "NOT_REQUIRED",
              badgeFooterUrl: requiresBadge ? input.websiteUrl : undefined,
              badgeVerification: requiresBadge ? "PENDING" : "NOT_REQUIRED",
              reviewStatus: "DRAFT",
            },
          });

          return {
            id: submission.id,
            submissionType: submission.submissionType,
            reviewStatus: submission.reviewStatus,
            paymentStatus: submission.paymentStatus,
            badgeVerification: submission.badgeVerification,
          } satisfies SavedSubmissionDraft;
        },
        {
          maxWait: 15_000,
          timeout: 15_000,
        },
      );

      break;
    } catch (error) {
      const isSlugConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("slug");

      if (!isSlugConflict || attempt === 2) {
        throw error;
      }
    }
  }

  if (!createdDraft) {
    throw new AppError(500, "Submission could not be created.");
  }

  return createdDraft;
}

export async function listFounderSubmissions(userId: string) {
  return listSubmissionSummariesForFounder(prisma, userId);
}

export async function getFounderSubmissionDraft(
  submissionId: string,
  founder: AuthenticatedFounder,
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.reviewStatus !== "DRAFT") {
    throw new AppError(409, "This submission can no longer be resumed.");
  }

  return submission;
}

export async function getAdminSubmissionDetail(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      spotlightBrief: {
        select: {
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
      user: true,
      tool: {
        include: toolDetailsInclude,
      },
    },
  });

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  return submission;
}

export async function listAdminSubmissionQueue(
  filters: AdminSubmissionListQueryInput,
) {
  return listAdminSubmissions(prisma, {
    reviewStatus: filters.reviewStatus,
    OR: filters.search
      ? [
          { user: { email: { contains: filters.search, mode: "insensitive" } } },
          { user: { name: { contains: filters.search, mode: "insensitive" } } },
          { tool: { name: { contains: filters.search, mode: "insensitive" } } },
          { tool: { slug: { contains: filters.search, mode: "insensitive" } } },
        ]
      : undefined,
  });
}

export async function submitSubmissionDraft(
  submissionId: string,
  founder: AuthenticatedFounder,
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.reviewStatus !== "DRAFT") {
    throw new AppError(409, "This submission is already in review.");
  }

  if (submission.submissionType === "FEATURED_LAUNCH") {
    throw new AppError(400, "Premium launches must go through checkout.");
  }

  if (
    submission.submissionType === "FREE_LAUNCH" &&
    submission.badgeVerification !== "VERIFIED"
  ) {
    throw new AppError(
      400,
      "Verify the ShipBoost badge on your website before submitting the free launch.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        reviewStatus: "PENDING",
      },
    });

    if (submission.submissionType !== "RELAUNCH") {
      await tx.tool.update({
        where: { id: submission.toolId },
        data: {
          moderationStatus: "PENDING",
          publicationStatus: "UNPUBLISHED",
        },
      });
    }
  });
  const submitted = {
    id: submission.id,
    submissionType: submission.submissionType,
    reviewStatus: "PENDING" as const,
    preferredLaunchDate: submission.preferredLaunchDate,
    paymentStatus: submission.paymentStatus,
    badgeVerification: submission.badgeVerification,
    tool: {
      id: submission.tool.id,
      slug: submission.tool.slug,
      name: submission.tool.name,
      websiteUrl: submission.tool.websiteUrl,
      logoMedia: submission.tool.logoMedia
        ? {
            url: submission.tool.logoMedia.url,
          }
        : null,
      launches: submission.tool.launches.map((launch) => ({
        id: launch.id,
        launchType: launch.launchType,
        status: launch.status,
        launchDate: launch.launchDate,
      })),
    },
  };

  const emailTask: DeferredEmailTask = () =>
    sendSubmissionReceivedEmailMessage({
      to: submission.user.email,
      name: submission.user.name,
      dashboardUrl: getDashboardUrl(),
      toolName: submitted.tool.name,
      submissionType: submitted.submissionType,
      preferredLaunchDate: submitted.preferredLaunchDate
        ? formatLaunchDateForEmail(submitted.preferredLaunchDate)
        : null,
    });

  await capturePostHogEventSafely(
    {
      distinctId: submission.userId,
      event: "tool_submission_completed",
      properties: {
        submission_id: submission.id,
        submission_type: submission.submissionType,
        tool_id: submission.tool.id,
        tool_slug: submission.tool.slug,
        tool_name: submission.tool.name,
        has_affiliate_url: Boolean(submission.tool.affiliateUrl),
        category_count: submission.tool.toolCategories.length,
        tag_count: submission.tool.toolTags.length,
      },
    },
    "submitSubmissionDraft",
  );

  return {
    submission: submitted,
    emailTask,
  };
}

export async function verifyFreeLaunchBadge(
  submissionId: string,
  founder: AuthenticatedFounder,
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.submissionType !== "FREE_LAUNCH") {
    throw new AppError(400, "Badge verification only applies to free launches.");
  }

  if (submission.reviewStatus !== "DRAFT") {
    throw new AppError(409, "This submission is already in review.");
  }

  let verified = false;
  let message = "Badge not found on your homepage yet. Add it and try again.";

  try {
    const response = await fetch(submission.tool.websiteUrl, {
      headers: {
        "user-agent": "ShipBoostBadgeVerifier/1.0 (+https://shipboost.io)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    const html = await response.text();
    verified = freeLaunchBadgePattern.test(html);
  } catch (error) {
    message =
      error instanceof Error
        ? `ShipBoost could not verify the badge automatically: ${error.message}`
        : "ShipBoost could not verify the badge automatically.";
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        badgeFooterUrl: submission.tool.websiteUrl,
        badgeVerification: verified ? "VERIFIED" : "FAILED",
      },
    });

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        badgeVerification: verified ? "VERIFIED" : "FAILED",
      },
    });
  });

  const updated = await getSubmissionById(prisma, submission.id);

  if (!updated) {
    throw new AppError(500, "Badge verification completed but could not be reloaded.");
  }

  return {
    verified,
    message: verified
      ? "Badge verified. You can submit your free launch now."
      : message,
    submission: updated,
  };
}
