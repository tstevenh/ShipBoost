import { getLaunchVideoAddOn, type LaunchVideoAddOn } from "@/lib/launch-video";
import { prisma } from "@/server/db/client";
import { getDodoClient } from "@/server/dodo";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import {
  attachLaunchVideoCheckoutSession,
  cancelPendingLaunchVideoOrder,
  createPendingLaunchVideoOrder,
  getLaunchVideoOffer,
  handleLaunchVideoPaymentSucceeded,
} from "@/server/services/launch-video-service";

// A launch video bought on its own, after the launch is already scheduled:
// from the dashboard, or from the link in the launch video offer email.

type FounderLike = { id: string; email: string; name?: string | null };

const SOLD_STATUSES = ["PAID", "DELIVERED"] as const;

const ADD_ON_ERRORS: Record<Exclude<LaunchVideoAddOn, { ok: true }>["reason"], string> = {
  unavailable: "Launch videos are not available right now.",
  has_video: "This launch already has a launch video.",
  no_launch: "A launch video can be added once your launch is scheduled.",
};

async function findSubmissionForAddOn(submissionId: string, founderId: string) {
  return prisma.submission.findFirst({
    where: { id: submissionId, userId: founderId },
    select: {
      id: true,
      submissionType: true,
      paymentStatus: true,
      launchVideoOrders: {
        where: { status: { in: [...SOLD_STATUSES] } },
        select: { id: true },
        take: 1,
      },
      tool: {
        select: {
          name: true,
          launches: { select: { launchType: true, status: true, launchDate: true } },
        },
      },
    },
  });
}

/** The add-on as the founder can buy it right now, or why they cannot. */
export async function getFounderLaunchVideoAddOn(
  submissionId: string,
  founderId: string,
  now = new Date(),
) {
  const submission = await findSubmissionForAddOn(submissionId, founderId);

  if (!submission) {
    return null;
  }

  const offer = await getLaunchVideoOffer();
  const addOn = getLaunchVideoAddOn(
    {
      submissionType: submission.submissionType,
      paymentStatus: submission.paymentStatus,
      hasVideo: submission.launchVideoOrders.length > 0,
      launches: submission.tool.launches,
    },
    offer,
    now,
  );

  return { submissionId: submission.id, toolName: submission.tool.name, addOn, offer };
}

export async function createLaunchVideoCheckout(input: {
  submissionId: string;
  founder: FounderLike;
}) {
  const found = await getFounderLaunchVideoAddOn(input.submissionId, input.founder.id);

  if (!found) {
    throw new AppError(404, "Submission not found.");
  }

  const { addOn } = found;

  if (!addOn.ok) {
    throw new AppError(409, ADD_ON_ERRORS[addOn.reason]);
  }

  // A founder who abandons a checkout and starts again keeps one open order.
  await prisma.launchVideoOrder.updateMany({
    where: { submissionId: found.submissionId, status: "PENDING" },
    data: { status: "CANCELED" },
  });

  const videoOrder = await createPendingLaunchVideoOrder({
    mode: addOn.mode,
    delivery: addOn.delivery,
    submissionId: found.submissionId,
    launchWeekStart: addOn.delivery === "launch_week" ? new Date(addOn.launchWeekStart) : undefined,
  });

  const base = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const returnUrl = new URL(`${base}/api/dodo/return/launch-video`);
  returnUrl.searchParams.set("order_id", videoOrder.order.id);

  let checkout: Awaited<ReturnType<ReturnType<typeof getDodoClient>["checkoutSessions"]["create"]>>;

  try {
    checkout = await getDodoClient().checkoutSessions.create({
      product_cart: [{ product_id: videoOrder.productId, quantity: 1 }],
      customer: { email: input.founder.email, name: input.founder.name ?? undefined },
      return_url: returnUrl.toString(),
      metadata: {
        shipboostProduct: "launch_video",
        shipboostSubmissionId: found.submissionId,
        shipboostLaunchVideoOrderId: videoOrder.order.id,
      },
    });

    if (!checkout.checkout_url || !checkout.session_id) {
      throw new AppError(500, "Dodo checkout url or session id is missing.");
    }
  } catch (error) {
    await cancelPendingLaunchVideoOrder(videoOrder.order.id);
    throw error;
  }

  await attachLaunchVideoCheckoutSession(videoOrder.order.id, checkout.session_id);

  return { checkoutUrl: checkout.checkout_url };
}

/**
 * Confirms a video-only payment when the founder returns from checkout, so the
 * brief page works before the webhook lands. Returns the order's submission id
 * once the order is paid, or null.
 */
export async function reconcileLaunchVideoPayment(input: {
  orderId: string;
  paymentId: string;
  founderUserId: string;
}) {
  const order = await prisma.launchVideoOrder.findFirst({
    where: { id: input.orderId, submission: { userId: input.founderUserId } },
    select: { submissionId: true, status: true },
  });

  if (!order) {
    return null;
  }

  if (order.status === "PAID" || order.status === "DELIVERED") {
    return order.submissionId;
  }

  const payment = await getDodoClient().payments.retrieve(input.paymentId);

  if (
    payment.status !== "succeeded" ||
    payment.metadata?.shipboostLaunchVideoOrderId !== input.orderId
  ) {
    return null;
  }

  await handleLaunchVideoPaymentSucceeded({
    orderId: input.orderId,
    paymentId: payment.payment_id,
  });

  return order.submissionId;
}
