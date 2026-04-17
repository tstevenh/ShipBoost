import { prisma } from "@/server/db/client";
import { sendPremiumLaunchPaidEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import {
  getSubmissionById,
  getSubmissionByIdForFounder,
} from "@/server/repositories/submission-repository";
import { getDodoClient, getDodoDashboardReturnUrl } from "@/server/dodo";
import { capturePostHogEventSafely } from "@/server/posthog";
import {
  getLaunchpadGoLiveAtUtc,
  isAnchoredLaunchWeekStart,
} from "@/server/services/launch-scheduling";
import { startOfUtcDay } from "@/server/services/time";
import type { PremiumLaunchRescheduleInput } from "@/server/validators/submission";

import {
  type AuthenticatedFounder,
  formatLaunchDateForEmail,
  getDashboardUrl,
  sendProductEmailSafely,
} from "@/server/services/submission-service-shared";

type PremiumLaunchPaymentLike = {
  id: string;
  checkoutSessionId: string | null;
  metadata: Record<string, unknown>;
};

function readSubmissionIdFromPayment(payment: PremiumLaunchPaymentLike) {
  const value = payment.metadata.shipboostSubmissionId;

  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

function assertValidPremiumLaunchWeekStart(date: Date) {
  const goLiveFloor = getLaunchpadGoLiveAtUtc();
  const launchWeekStart = startOfUtcDay(date);

  if (launchWeekStart < goLiveFloor) {
    throw new AppError(400, "Choose May 4, 2026 UTC or later.");
  }

  if (!isAnchoredLaunchWeekStart(launchWeekStart, { goLiveAt: goLiveFloor })) {
    throw new AppError(400, "Choose one of the available weekly launch windows.");
  }

  return launchWeekStart;
}

async function applyPremiumLaunchPaymentSucceeded(
  payment: PremiumLaunchPaymentLike,
) {
  const updatedSubmissionId = await prisma.$transaction(async (tx) => {
    const submissionId = readSubmissionIdFromPayment(payment);
    const submission = submissionId
      ? await tx.submission.findUnique({
          where: { id: submissionId },
          include: {
            tool: {
              include: {
                launches: true,
              },
            },
          },
        })
      : payment.checkoutSessionId
        ? await tx.submission.findFirst({
            where: {
              polarCheckoutId: payment.checkoutSessionId,
            },
            include: {
              tool: {
                include: {
                  launches: true,
                },
              },
            },
          })
        : null;

    if (!submission || submission.submissionType !== "FEATURED_LAUNCH") {
      return null;
    }

    if (
      submission.paymentStatus === "PAID" &&
      submission.polarOrderId === payment.id
    ) {
      return null;
    }

    const preferredLaunchDate = submission.preferredLaunchDate
      ? assertValidPremiumLaunchWeekStart(submission.preferredLaunchDate)
      : getLaunchpadGoLiveAtUtc();
    const launchDate = preferredLaunchDate;
    const now = new Date();
    const shouldGoLiveImmediately = launchDate <= now;

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        paymentStatus: "PAID",
        polarOrderId: payment.id,
        polarCheckoutId:
          payment.checkoutSessionId ?? submission.polarCheckoutId,
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

    const existingPremiumLaunch = submission.tool.launches.find(
      (launch) =>
        launch.launchType === "FEATURED" &&
        launch.launchDate.getTime() === launchDate.getTime(),
    );

    if (!existingPremiumLaunch) {
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

    await tx.submissionSpotlightBrief.upsert({
      where: { submissionId: submission.id },
      update: {},
      create: {
        submissionId: submission.id,
        status: "NOT_STARTED",
      },
    });

    return submission.id;
  });

  if (!updatedSubmissionId) {
    return null;
  }

  const updatedSubmission = await getSubmissionById(prisma, updatedSubmissionId);

  if (!updatedSubmission) {
    return null;
  }

  const premiumLaunch = updatedSubmission.tool.launches.find(
    (launch) => launch.launchType === "FEATURED",
  );

  await sendProductEmailSafely(
    sendPremiumLaunchPaidEmailMessage({
      to: updatedSubmission.user.email,
      name: updatedSubmission.user.name,
      dashboardUrl: getDashboardUrl(),
      spotlightBriefUrl: `${getDashboardUrl()}?tab=submissions`,
      toolName: updatedSubmission.tool.name,
      launchDate: formatLaunchDateForEmail(
        premiumLaunch?.launchDate ??
          updatedSubmission.preferredLaunchDate ??
          new Date(),
      ),
    }),
  );

  await capturePostHogEventSafely(
    {
      distinctId: updatedSubmission.user.id,
      event: "premium_launch_paid",
      properties: {
        submission_id: updatedSubmission.id,
        tool_id: updatedSubmission.tool.id,
        tool_slug: updatedSubmission.tool.slug,
        tool_name: updatedSubmission.tool.name,
        payment_id: payment.id,
        checkout_session_id:
          payment.checkoutSessionId ?? updatedSubmission.polarCheckoutId ?? null,
        launch_date:
          premiumLaunch?.launchDate.toISOString() ??
          updatedSubmission.preferredLaunchDate?.toISOString() ??
          null,
      },
    },
    "handlePremiumLaunchPaymentSucceeded",
  );

  return updatedSubmission;
}

export async function createPremiumLaunchCheckout(
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
    throw new AppError(400, "Only premium launch submissions can be paid.");
  }

  if (!submission.preferredLaunchDate) {
    throw new AppError(400, "Premium launch week is missing.");
  }

  if (submission.paymentStatus === "PAID") {
    throw new AppError(409, "This premium launch has already been paid.");
  }

  if (submission.reviewStatus !== "DRAFT") {
    throw new AppError(
      409,
      "This premium launch is already processing. Check your dashboard instead.",
    );
  }

  const preferredLaunchWeek = assertValidPremiumLaunchWeekStart(
    submission.preferredLaunchDate,
  );

  if (preferredLaunchWeek <= new Date()) {
    throw new AppError(400, "Choose a future launch week.");
  }

  const env = getEnv();

  if (!env.DODO_PREMIUM_LAUNCH_PRODUCT_ID) {
    throw new AppError(500, "Dodo premium launch product is not configured.");
  }

  const dodo = getDodoClient();
  const checkout = await dodo.checkoutSessions.create({
    product_cart: [
      {
        product_id: env.DODO_PREMIUM_LAUNCH_PRODUCT_ID,
        quantity: 1,
      },
    ],
    customer: {
      email: founder.email,
      name: founder.name ?? undefined,
    },
    return_url: getDodoDashboardReturnUrl(submission.id),
    metadata: {
      shipboostSubmissionId: String(submission.id),
      shipboostToolId: String(submission.toolId),
      shipboostSubmissionType: String(submission.submissionType),
      shipboostPreferredLaunchDate: preferredLaunchWeek.toISOString(),
    },
  });

  if (!checkout.checkout_url) {
    throw new AppError(500, "Dodo checkout url is missing from the session response.");
  }

  await prisma.submission.update({
    where: { id: submission.id },
    data: {
      polarCheckoutId: checkout.session_id,
      paymentStatus: "PENDING",
    },
  });

  return {
    checkoutUrl: checkout.checkout_url,
    checkoutId: checkout.session_id,
  };
}

export async function handlePremiumLaunchPaymentSucceeded(input: {
  paymentId: string;
  checkoutSessionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const payment = {
    id: input.paymentId,
    checkoutSessionId: input.checkoutSessionId ?? null,
    metadata: input.metadata ?? {},
  };
  const updatedSubmission = await applyPremiumLaunchPaymentSucceeded(payment);

  if (!updatedSubmission) {
    console.warn(
      "[shipboost dodo] payment.succeeded did not match a premium submission",
      {
        paymentId: input.paymentId,
        checkoutSessionId: input.checkoutSessionId,
        submissionId: readSubmissionIdFromPayment(payment),
      },
    );
  }
}

export async function handlePremiumLaunchRefundSucceeded(input: {
  paymentId: string;
}) {
  if (!input.paymentId) {
    return;
  }

  await prisma.submission.updateMany({
    where: { polarOrderId: input.paymentId },
    data: {
      paymentStatus: "REFUNDED",
    },
  });
}

export async function reschedulePremiumLaunch(
  submissionId: string,
  input: PremiumLaunchRescheduleInput,
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
    throw new AppError(400, "Only premium launches can be rescheduled.");
  }

  if (submission.paymentStatus !== "PAID") {
    throw new AppError(400, "Pay for the premium launch before rescheduling it.");
  }

  const existingPremiumLaunch = submission.tool.launches.find(
    (launch) => launch.launchType === "FEATURED",
  );

  if (!existingPremiumLaunch) {
    throw new AppError(400, "Premium launch is not scheduled yet.");
  }

  const now = new Date();

  if (
    existingPremiumLaunch.status === "LIVE" ||
    existingPremiumLaunch.status === "ENDED" ||
    existingPremiumLaunch.launchDate <= now
  ) {
    throw new AppError(
      400,
      "This launch is already live and can no longer be rescheduled.",
    );
  }

  const nextLaunchDate = assertValidPremiumLaunchWeekStart(
    input.preferredLaunchDate,
  );
  const goLiveFloor = getLaunchpadGoLiveAtUtc();

  if (nextLaunchDate < goLiveFloor) {
    throw new AppError(400, "Choose May 4, 2026 UTC or later.");
  }

  if (nextLaunchDate <= now) {
    throw new AppError(400, "Choose a future launch week.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.submission.update({
      where: { id: submission.id },
      data: {
        preferredLaunchDate: nextLaunchDate,
      },
    });

    await tx.launch.update({
      where: { id: existingPremiumLaunch.id },
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

export async function reconcilePremiumLaunchPayment(input: {
  submissionId: string;
  paymentId: string;
}) {
  const normalizedSubmissionId = input.submissionId.trim();
  const normalizedPaymentId = input.paymentId.trim();

  if (!normalizedSubmissionId || !normalizedPaymentId) {
    return null;
  }

  const existingSubmission = await prisma.submission.findUnique({
    where: {
      id: normalizedSubmissionId,
    },
    select: {
      id: true,
      submissionType: true,
      paymentStatus: true,
      polarOrderId: true,
    },
  });

  if (
    !existingSubmission ||
    existingSubmission.submissionType !== "FEATURED_LAUNCH"
  ) {
    return null;
  }

  if (existingSubmission.paymentStatus === "PAID") {
    return getSubmissionById(prisma, existingSubmission.id);
  }

  const dodo = getDodoClient();
  const payment = await dodo.payments.retrieve(normalizedPaymentId);

  if (payment.status !== "succeeded") {
    return getSubmissionById(prisma, existingSubmission.id);
  }

  const metadataSubmissionId = payment.metadata?.shipboostSubmissionId;

  if (
    typeof metadataSubmissionId === "string" &&
    metadataSubmissionId !== existingSubmission.id
  ) {
    throw new AppError(
      409,
      "This payment does not belong to the current submission.",
    );
  }

  return applyPremiumLaunchPaymentSucceeded({
    id: payment.payment_id,
    checkoutSessionId: payment.checkout_session_id ?? null,
    metadata: payment.metadata ?? {},
  });
}
