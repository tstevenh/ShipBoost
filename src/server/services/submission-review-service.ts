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
  formatLaunchDateForEmail,
  getDashboardUrl,
  resolveLaunchType,
  sendProductEmailSafely,
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
        data:
          submission.submissionType === "RELAUNCH"
            ? {
                internalNote: input.internalReviewNote,
              }
            : {
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

    const shouldPublish =
      submission.submissionType === "RELAUNCH"
        ? submission.tool.publicationStatus === "PUBLISHED"
        : input.publishTool;
    const shouldLaunch = submission.submissionType !== "LISTING_ONLY";
    const shouldUpdateToolState = submission.submissionType !== "RELAUNCH";

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
        internalNote: input.internalReviewNote,
      },
    });

    if (shouldLaunch && input.goLiveNow) {
      const isFreeLaunch = submission.submissionType === "FREE_LAUNCH";
      const isFeaturedLaunch = submission.submissionType === "FEATURED_LAUNCH";
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

      await tx.launch.create({
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
