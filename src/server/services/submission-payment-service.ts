import { prisma } from "@/server/db/client";
import { sendFeaturedLaunchPaidEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import {
  getSubmissionById,
  getSubmissionByIdForFounder,
} from "@/server/repositories/submission-repository";
import { getPolarCheckoutUrls, getPolarClient } from "@/server/polar";
import { startOfDay } from "@/server/services/time";
import type { FeaturedLaunchRescheduleInput } from "@/server/validators/submission";

import {
  type AuthenticatedFounder,
  type FeaturedOrderPaidPayload,
  formatLaunchDateForEmail,
  getDashboardUrl,
  sendProductEmailSafely,
} from "@/server/services/submission-service-shared";

type PaidOrderLike = {
  id: string;
  checkoutId: string | null;
  metadata: Record<string, unknown>;
};

function readSubmissionIdFromOrder(order: PaidOrderLike) {
  const value = order.metadata.shipboostSubmissionId;

  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  return null;
}

async function applyFeaturedLaunchOrderPaid(order: PaidOrderLike) {
  const updatedSubmissionId = await prisma.$transaction(async (tx) => {
    const submissionId = readSubmissionIdFromOrder(order);
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
      : await tx.submission.findFirst({
          where: {
            polarCheckoutId: order.checkoutId ?? undefined,
          },
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
      submission.polarOrderId === order.id
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
        polarOrderId: order.id,
        polarCheckoutId: order.checkoutId ?? submission.polarCheckoutId,
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

    return submission.id;
  });

  if (!updatedSubmissionId) {
    return null;
  }

  const updatedSubmission = await getSubmissionById(prisma, updatedSubmissionId);

  if (!updatedSubmission) {
    return null;
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
        featuredLaunch?.launchDate ??
          updatedSubmission.preferredLaunchDate ??
          new Date(),
      ),
    }),
  );

  return updatedSubmission;
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
  const updatedSubmission = await applyFeaturedLaunchOrderPaid(payload.data);

  if (!updatedSubmission) {
    console.warn("[shipboost polar] order.paid did not match a featured submission", {
      orderId: payload.data.id,
      checkoutId: payload.data.checkoutId,
      submissionId: readSubmissionIdFromOrder(payload.data),
    });
  }
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

export async function reconcileFeaturedLaunchCheckout(checkoutId: string) {
  const normalizedCheckoutId = checkoutId.trim();

  if (!normalizedCheckoutId) {
    return null;
  }

  const existingSubmission = await prisma.submission.findFirst({
    where: {
      polarCheckoutId: normalizedCheckoutId,
      submissionType: "FEATURED_LAUNCH",
    },
    select: {
      id: true,
      paymentStatus: true,
      polarOrderId: true,
    },
  });

  if (!existingSubmission) {
    return null;
  }

  if (existingSubmission.paymentStatus === "PAID") {
    return getSubmissionById(prisma, existingSubmission.id);
  }

  const polar = getPolarClient();
  const orderPages = await polar.orders.list({
    checkoutId: normalizedCheckoutId,
    limit: 1,
  });
  const order = orderPages.result.items[0];

  if (!order?.paid) {
    return getSubmissionById(prisma, existingSubmission.id);
  }

  return applyFeaturedLaunchOrderPaid(order);
}
