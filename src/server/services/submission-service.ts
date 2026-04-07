import { Prisma } from "@prisma/client";

import { deleteImageFromCloudinary } from "@/server/cloudinary";
import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import {
  sendFeaturedLaunchPaidEmailMessage,
  sendSubmissionApprovedEmailMessage,
  sendSubmissionReceivedEmailMessage,
  sendSubmissionRejectedEmailMessage,
} from "@/server/email/transactional";
import {
  getSubmissionById,
  getSubmissionByIdForFounder,
  listAdminSubmissions,
  listSubmissionsForFounder,
} from "@/server/repositories/submission-repository";
import {
  replaceToolCategories,
  replaceToolTags,
} from "@/server/repositories/tool-repository";
import { getEnv } from "@/server/env";
import { getPolarCheckoutUrls, getPolarClient } from "@/server/polar";
import { assertCatalogAssignments } from "@/server/services/catalog";
import {
  DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY,
  scheduleNextFreeLaunchDate,
} from "@/server/services/launch-scheduling";
import { createUniqueToolSlug } from "@/server/services/slug";
import { startOfDay } from "@/server/services/time";
import type {
  AdminSubmissionListQueryInput,
  FeaturedLaunchRescheduleInput,
  SubmissionCreateInput,
  SubmissionReviewInput,
} from "@/server/validators/submission";

type AuthenticatedFounder = {
  id: string;
};

type FeaturedOrderPaidPayload = {
  data: {
    id: string;
    checkoutId: string | null;
    metadata: Record<string, unknown>;
  };
};

type DraftSaveResult = {
  submissionId: string;
  replacedLogoPublicId: string | null;
  replacedScreenshotPublicIds: string[];
};

const freeLaunchBadgePattern =
  /data-shipboost-badge\s*=\s*["']free-launch["']/i;

function formatLaunchDateForEmail(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function getDashboardUrl() {
  const env = getEnv();
  return `${env.NEXT_PUBLIC_APP_URL}/dashboard`;
}

async function sendProductEmailSafely(task: Promise<void>) {
  try {
    await task;
  } catch (error) {
    console.error("[shipboost email:error]", error);
  }
}

function resolveLaunchType(
  submissionType:
    | SubmissionCreateInput["submissionType"]
    | "RELAUNCH",
) {
  if (submissionType === "RELAUNCH") {
    return "RELAUNCH" as const;
  }

  if (submissionType === "FEATURED_LAUNCH") {
    return "FEATURED" as const;
  }

  return "FREE" as const;
}

export async function createSubmission(
  input: SubmissionCreateInput,
  founder: AuthenticatedFounder,
) {
  await assertCatalogAssignments(input.categoryIds, input.tagIds);

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

    const result = await prisma.$transaction(async (tx) => {
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
      const removedScreenshots = existingSubmission.tool.media.filter(
        (media) => media.type === "SCREENSHOT",
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

      if (existingSubmission.tool.logoMediaId) {
        await tx.toolMedia.update({
          where: { id: existingSubmission.tool.logoMediaId },
          data: input.logo,
        });
      } else {
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

      await replaceToolCategories(tx, existingSubmission.toolId, input.categoryIds);
      await replaceToolTags(tx, existingSubmission.toolId, input.tagIds);

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
        submissionId: existingSubmission.id,
        replacedLogoPublicId: existingSubmission.tool.logoMedia?.publicId ?? null,
        replacedScreenshotPublicIds: removedScreenshots
          .map((media) => media.publicId)
          .filter((publicId): publicId is string => Boolean(publicId)),
      } satisfies DraftSaveResult;
    }, {
      maxWait: 15_000,
      timeout: 15_000,
    });

    await cleanupDraftMedia(result, input);

    const updatedSubmission = await getSubmissionById(prisma, result.submissionId);

    if (!updatedSubmission) {
      throw new AppError(500, "Draft saved but could not be reloaded.");
    }

    return updatedSubmission;
  }

  let submissionId: string | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      submissionId = await prisma.$transaction(async (tx) => {
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

        return submission.id;
      }, {
        maxWait: 15_000,
        timeout: 15_000,
      });

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

  if (!submissionId) {
    throw new AppError(500, "Submission could not be created.");
  }

  const createdSubmission = await getSubmissionById(prisma, submissionId);

  if (!createdSubmission) {
    throw new AppError(500, "Submission created but could not be reloaded.");
  }

  return createdSubmission;
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

export async function listFounderSubmissions(userId: string) {
  return listSubmissionsForFounder(prisma, userId);
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

export async function reviewSubmission(
  submissionId: string,
  input: SubmissionReviewInput,
  adminUserId: string,
) {
  const submission = await getSubmissionById(prisma, submissionId);

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.reviewStatus !== "PENDING") {
    throw new AppError(409, "Only pending submissions can be reviewed.");
  }

  const reviewedSubmission = await prisma.$transaction(async (tx) => {
    if (input.action === "REJECT") {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          reviewStatus: "REJECTED",
          founderVisibleNote: input.founderVisibleNote,
          internalReviewNote: input.internalReviewNote,
        },
      });

      await tx.tool.update({
        where: { id: submission.toolId },
        data: {
          moderationStatus: "REJECTED",
          publicationStatus: "UNPUBLISHED",
          internalNote: input.internalReviewNote,
        },
      });

      return getSubmissionById(tx, submissionId);
    }

    await tx.submission.update({
      where: { id: submissionId },
      data: {
        reviewStatus: "APPROVED",
        founderVisibleNote: input.founderVisibleNote,
        internalReviewNote: input.internalReviewNote,
      },
    });

    const shouldPublish = input.publishTool;
    const shouldLaunch = submission.submissionType !== "LISTING_ONLY";

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        moderationStatus: "APPROVED",
        publicationStatus: shouldPublish ? "PUBLISHED" : "UNPUBLISHED",
        currentLaunchType: shouldLaunch
          ? resolveLaunchType(submission.submissionType)
          : null,
        internalNote: input.internalReviewNote,
      },
    });

    if (shouldLaunch && input.goLiveNow) {
      const isFreeLaunch = submission.submissionType === "FREE_LAUNCH";
      const isFeaturedLaunch = submission.submissionType === "FEATURED_LAUNCH";
      const featuredLaunchDate = submission.preferredLaunchDate
        ? startOfDay(submission.preferredLaunchDate)
        : new Date();
      const launchDate = isFreeLaunch
        ? await scheduleNextFreeLaunchDate(tx, {
            dailySlots: DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY,
            fromDate: new Date(),
          })
        : isFeaturedLaunch
          ? featuredLaunchDate
          : new Date();
      const shouldGoLiveImmediately = launchDate <= new Date();

      await tx.launch.create({
        data: {
          toolId: submission.toolId,
          createdById: adminUserId,
          launchType:
            submission.submissionType === "FEATURED_LAUNCH"
              ? "FEATURED"
              : "FREE",
          status:
            isFreeLaunch || !shouldGoLiveImmediately ? "APPROVED" : "LIVE",
          launchDate,
          startAt: launchDate,
          priorityWeight:
            submission.submissionType === "FEATURED_LAUNCH" ? 100 : 0,
        },
      });
    }

    return getSubmissionById(tx, submissionId);
  });

  if (!reviewedSubmission) {
    throw new AppError(500, "Submission review completed but could not be reloaded.");
  }

  if (input.action === "REJECT") {
    await sendProductEmailSafely(
      sendSubmissionRejectedEmailMessage({
        to: reviewedSubmission.user.email,
        name: reviewedSubmission.user.name,
        dashboardUrl: getDashboardUrl(),
        toolName: reviewedSubmission.tool.name,
        founderVisibleNote: reviewedSubmission.founderVisibleNote,
      }),
    );
  } else {
    const launchDate = reviewedSubmission.tool.launches[0]?.launchDate;
    await sendProductEmailSafely(
      sendSubmissionApprovedEmailMessage({
        to: reviewedSubmission.user.email,
        name: reviewedSubmission.user.name,
        dashboardUrl: getDashboardUrl(),
        toolName: reviewedSubmission.tool.name,
        launchDate: launchDate ? formatLaunchDateForEmail(launchDate) : null,
      }),
    );
  }

  return reviewedSubmission;
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
    throw new AppError(400, "Featured launches must go through checkout.");
  }

  if (
    submission.submissionType === "FREE_LAUNCH" &&
    submission.badgeVerification !== "VERIFIED"
  ) {
    throw new AppError(
      400,
      "Verify the Shipboost badge on your website before submitting the free launch.",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        reviewStatus: "PENDING",
      },
    });

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        moderationStatus: "PENDING",
        publicationStatus: "UNPUBLISHED",
      },
    });
  });

  const submitted = await getSubmissionById(prisma, submissionId);

  if (!submitted) {
    throw new AppError(500, "Submission sent but could not be reloaded.");
  }

  await sendProductEmailSafely(
    sendSubmissionReceivedEmailMessage({
      to: submitted.user.email,
      name: submitted.user.name,
      dashboardUrl: getDashboardUrl(),
      toolName: submitted.tool.name,
      submissionType: submitted.submissionType,
      preferredLaunchDate: submitted.preferredLaunchDate
        ? formatLaunchDateForEmail(submitted.preferredLaunchDate)
        : null,
    }),
  );

  return submitted;
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
        "user-agent": "ShipboostBadgeVerifier/1.0 (+https://shipboost.io)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    const html = await response.text();
    verified = freeLaunchBadgePattern.test(html);
  } catch (error) {
    message =
      error instanceof Error
        ? `Shipboost could not verify the badge automatically: ${error.message}`
        : "Shipboost could not verify the badge automatically.";
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

export async function createFeaturedLaunchCheckout(
  submissionId: string,
  founder: { id: string; email: string; name?: string | null },
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.submissionType !== "FEATURED_LAUNCH") {
    throw new AppError(400, "Only featured launch submissions can be paid.");
  }

  if (!submission.preferredLaunchDate) {
    throw new AppError(400, "Featured launch date is missing.");
  }

  if (submission.paymentStatus === "PAID") {
    throw new AppError(409, "This featured launch has already been paid.");
  }

  if (submission.reviewStatus !== "DRAFT") {
    throw new AppError(
      409,
      "This featured launch is already processing. Check your dashboard instead.",
    );
  }

  const env = getEnv();

  if (!env.POLAR_FEATURED_LAUNCH_PRODUCT_ID) {
    throw new AppError(500, "Polar featured launch product is not configured.");
  }

  const polar = getPolarClient();
  const { successUrl, returnUrl } = getPolarCheckoutUrls();

  const checkout = await polar.checkouts.create({
    products: [env.POLAR_FEATURED_LAUNCH_PRODUCT_ID],
    successUrl,
    returnUrl,
    customerEmail: founder.email,
    customerName: founder.name ?? undefined,
    metadata: {
      shipboostSubmissionId: submission.id,
      shipboostToolId: submission.toolId,
      shipboostSubmissionType: submission.submissionType,
      shipboostPreferredLaunchDate:
        submission.preferredLaunchDate.toISOString(),
    },
  });

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      polarCheckoutId: checkout.id,
      paymentStatus: "PENDING",
    },
  });

  return {
    checkoutUrl: checkout.url,
    checkoutId: checkout.id,
  };
}

export async function handleFeaturedLaunchOrderPaid(
  payload: FeaturedOrderPaidPayload,
) {
  const submissionId = String(
    payload.data.metadata.shipboostSubmissionId ?? "",
  ).trim();

  if (!submissionId) {
    return;
  }

  const updatedSubmission = await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: { id: submissionId },
      include: {
        tool: {
          include: {
            launches: true,
          },
        },
      },
    });

    if (!submission || submission.submissionType !== "FEATURED_LAUNCH") {
      return null;
    }

    if (
      submission.paymentStatus === "PAID" &&
      submission.polarOrderId === payload.data.id
    ) {
      return null;
    }

    const launchDate = submission.preferredLaunchDate
      ? startOfDay(submission.preferredLaunchDate)
      : startOfDay(new Date());
    const now = new Date();
    const shouldGoLiveImmediately = launchDate <= now;

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        paymentStatus: "PAID",
        polarOrderId: payload.data.id,
        polarCheckoutId: payload.data.checkoutId ?? submission.polarCheckoutId,
        paidAt: now,
        reviewStatus: "APPROVED",
      },
    });

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        currentLaunchType: "FEATURED",
      },
    });

    const existingFeaturedLaunch = submission.tool.launches.find(
      (launch) =>
        launch.launchType === "FEATURED" &&
        launch.launchDate.getTime() === launchDate.getTime(),
    );

    if (!existingFeaturedLaunch) {
      await tx.launch.create({
        data: {
          toolId: submission.toolId,
          createdById: submission.userId,
          launchType: "FEATURED",
          status: shouldGoLiveImmediately ? "LIVE" : "APPROVED",
          launchDate,
          startAt: launchDate,
          priorityWeight: 100,
        },
      });
    }
    return tx.submission.findUnique({
      where: { id: submission.id },
      include: {
        user: true,
        tool: {
          include: {
            launches: {
              orderBy: {
                launchDate: "desc",
              },
            },
          },
        },
      },
    });
  });

  if (!updatedSubmission) {
    return;
  }

  const featuredLaunch = updatedSubmission.tool.launches.find(
    (launch) => launch.launchType === "FEATURED",
  );

  await sendProductEmailSafely(
    sendFeaturedLaunchPaidEmailMessage({
      to: updatedSubmission.user.email,
      name: updatedSubmission.user.name,
      dashboardUrl: getDashboardUrl(),
      toolName: updatedSubmission.tool.name,
      launchDate: formatLaunchDateForEmail(
        featuredLaunch?.launchDate ?? updatedSubmission.preferredLaunchDate ?? new Date(),
      ),
    }),
  );
}

export async function handleFeaturedLaunchRefund(orderId: string) {
  if (!orderId) {
    return;
  }

  await prisma.submission.updateMany({
    where: { polarOrderId: orderId },
    data: {
      paymentStatus: "REFUNDED",
    },
  });
}

export async function rescheduleFeaturedLaunch(
  submissionId: string,
  input: FeaturedLaunchRescheduleInput,
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

  if (submission.submissionType !== "FEATURED_LAUNCH") {
    throw new AppError(400, "Only featured launches can be rescheduled.");
  }

  if (submission.paymentStatus !== "PAID") {
    throw new AppError(400, "Pay for the featured launch before rescheduling it.");
  }

  const existingFeaturedLaunch = submission.tool.launches.find(
    (launch) => launch.launchType === "FEATURED",
  );

  if (!existingFeaturedLaunch) {
    throw new AppError(400, "Featured launch is not scheduled yet.");
  }

  const now = new Date();

  if (
    existingFeaturedLaunch.status === "LIVE" ||
    existingFeaturedLaunch.status === "ENDED" ||
    existingFeaturedLaunch.launchDate <= now
  ) {
    throw new AppError(
      400,
      "This launch is already live and can no longer be rescheduled.",
    );
  }

  const nextLaunchDate = startOfDay(input.preferredLaunchDate);

  if (nextLaunchDate <= now) {
    throw new AppError(400, "Choose a future launch date.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        preferredLaunchDate: nextLaunchDate,
      },
    });

    await tx.launch.update({
      where: { id: existingFeaturedLaunch.id },
      data: {
        launchDate: nextLaunchDate,
        startAt: nextLaunchDate,
        status: "APPROVED",
      },
    });
  });

  const updatedSubmission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!updatedSubmission) {
    throw new AppError(500, "Launch rescheduled but could not be reloaded.");
  }

  return updatedSubmission;
}
