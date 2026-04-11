import { prisma } from "@/server/db/client";
import {
  sendSubmissionApprovedEmailMessage,
  sendSubmissionRejectedEmailMessage,
} from "@/server/email/transactional";
import { AppError } from "@/server/http/app-error";
import { getSubmissionById } from "@/server/repositories/submission-repository";
import {
  DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY,
  scheduleNextFreeLaunchDate,
} from "@/server/services/launch-scheduling";
import { startOfDay } from "@/server/services/time";
import type { SubmissionReviewInput } from "@/server/validators/submission";

import {
  type DeferredEmailTask,
  formatLaunchDateForEmail,
  getDashboardUrl,
  resolveLaunchType,
} from "@/server/services/submission-service-shared";

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

  const founderVisibleNote = input.founderVisibleNote ?? null;
  const internalReviewNote = input.internalReviewNote ?? null;
  let createdLaunch:
    | {
        id: string;
        launchType: "FREE" | "FEATURED" | "RELAUNCH";
        status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
        launchDate: Date;
      }
    | null = null;

  if (input.action === "REJECT") {
    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          reviewStatus: "REJECTED",
          founderVisibleNote,
          internalReviewNote,
        },
      });

      await tx.tool.update({
        where: { id: submission.toolId },
        data:
          submission.submissionType === "RELAUNCH"
            ? {
                internalNote: internalReviewNote,
              }
            : {
                moderationStatus: "REJECTED",
                publicationStatus: "UNPUBLISHED",
                internalNote: internalReviewNote,
              },
      });
    });
  } else {
    const shouldPublish =
      submission.submissionType === "RELAUNCH"
        ? submission.tool.publicationStatus === "PUBLISHED"
        : input.publishTool;
    const shouldLaunch = submission.submissionType !== "LISTING_ONLY";
    const shouldUpdateToolState = submission.submissionType !== "RELAUNCH";

    await prisma.$transaction(async (tx) => {
      await tx.submission.update({
        where: { id: submissionId },
        data: {
          reviewStatus: "APPROVED",
          founderVisibleNote,
          internalReviewNote,
        },
      });

      await tx.tool.update({
        where: { id: submission.toolId },
        data: {
          moderationStatus: shouldUpdateToolState
            ? "APPROVED"
            : submission.tool.moderationStatus,
          publicationStatus: shouldUpdateToolState
            ? shouldPublish
              ? "PUBLISHED"
              : "UNPUBLISHED"
            : submission.tool.publicationStatus,
          currentLaunchType: shouldLaunch
            ? resolveLaunchType(submission.submissionType)
            : null,
          internalNote: internalReviewNote,
        },
      });

      if (shouldLaunch && input.goLiveNow) {
        const isFreeLaunch = submission.submissionType === "FREE_LAUNCH";
        const isFeaturedLaunch =
          submission.submissionType === "FEATURED_LAUNCH";
        const launchType = resolveLaunchType(submission.submissionType);
        const preferredLaunchDate = submission.preferredLaunchDate
          ? startOfDay(submission.preferredLaunchDate)
          : new Date();
        const launchDate = isFreeLaunch
          ? await scheduleNextFreeLaunchDate(tx, {
              dailySlots: DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY,
              fromDate: new Date(),
            })
          : preferredLaunchDate;
        const shouldGoLiveImmediately = launchDate <= new Date();

        createdLaunch = await tx.launch.create({
          data: {
            toolId: submission.toolId,
            createdById: adminUserId,
            launchType,
            status:
              isFreeLaunch || !shouldGoLiveImmediately ? "APPROVED" : "LIVE",
            launchDate,
            startAt: launchDate,
            priorityWeight: isFeaturedLaunch ? 100 : 0,
          },
          select: {
            id: true,
            launchType: true,
            status: true,
            launchDate: true,
          },
        });
      }
    });
  }

  const nextToolModerationStatus =
    input.action === "REJECT"
      ? submission.submissionType === "RELAUNCH"
        ? submission.tool.moderationStatus
        : "REJECTED"
      : submission.submissionType === "RELAUNCH"
        ? submission.tool.moderationStatus
        : "APPROVED";
  const nextToolPublicationStatus =
    input.action === "REJECT"
      ? submission.submissionType === "RELAUNCH"
        ? submission.tool.publicationStatus
        : "UNPUBLISHED"
      : submission.submissionType === "RELAUNCH"
        ? submission.tool.publicationStatus
        : input.publishTool
          ? "PUBLISHED"
          : "UNPUBLISHED";
  const reviewedLaunches: Array<{
    id: string;
    launchType: string;
    status: string;
    launchDate: Date;
  }> = [
    ...(createdLaunch ? [createdLaunch] : []),
    ...submission.tool.launches.map((launch) => ({
      id: launch.id,
      launchType: launch.launchType,
      status: launch.status,
      launchDate: launch.launchDate,
    })),
  ];
  const reviewedSubmission = {
    id: submission.id,
    submissionType: submission.submissionType,
    reviewStatus: input.action === "REJECT" ? "REJECTED" : "APPROVED",
    preferredLaunchDate: submission.preferredLaunchDate,
    paymentStatus: submission.paymentStatus,
    badgeFooterUrl: submission.badgeFooterUrl,
    badgeVerification: submission.badgeVerification,
    founderVisibleNote,
    internalReviewNote,
    createdAt: submission.createdAt,
    user: {
      id: submission.user.id,
      name: submission.user.name,
      email: submission.user.email,
    },
    tool: {
      id: submission.tool.id,
      slug: submission.tool.slug,
      name: submission.tool.name,
      tagline: submission.tool.tagline,
      websiteUrl: submission.tool.websiteUrl,
      logoMedia: submission.tool.logoMedia
        ? {
            url: submission.tool.logoMedia.url,
          }
        : null,
      launches: reviewedLaunches,
    },
  };

  const emailTask: DeferredEmailTask =
    input.action === "REJECT"
      ? () =>
          sendSubmissionRejectedEmailMessage({
            to: reviewedSubmission.user.email,
            name: reviewedSubmission.user.name,
            dashboardUrl: getDashboardUrl(),
            toolName: reviewedSubmission.tool.name,
            founderVisibleNote: reviewedSubmission.founderVisibleNote,
          })
      : () => {
          const launchDate = reviewedLaunches[0]?.launchDate ?? null;

          return sendSubmissionApprovedEmailMessage({
            to: reviewedSubmission.user.email,
            name: reviewedSubmission.user.name,
            dashboardUrl: getDashboardUrl(),
            toolName: reviewedSubmission.tool.name,
            launchDate: launchDate ? formatLaunchDateForEmail(launchDate) : null,
          });
        };

  return {
    submission: reviewedSubmission,
    tool: {
      id: submission.tool.id,
      moderationStatus: nextToolModerationStatus,
      publicationStatus: nextToolPublicationStatus,
    },
    emailTask,
  };
}
