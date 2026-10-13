import { unstable_cache } from "next/cache";

import {
  LAUNCH_VIDEO_DEMO_POSTER_SECONDS,
  LAUNCH_VIDEO_LATER_PRICE_USD,
  LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT,
  LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS,
  type LaunchVideoDemo,
  type LaunchVideoMode,
  type LaunchVideoOffer,
} from "@/lib/launch-video";
import { prisma } from "@/server/db/client";
import { getDodoClient } from "@/server/dodo";
import {
  sendLaunchVideoBookedEmailMessage,
  sendLaunchVideoOrderAdminEmailMessage,
} from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { capturePostHogEventSafely } from "@/server/posthog";
import { readDodoProductPriceCents } from "@/server/services/dodo-product-service";
import { getLaunchWeekStart } from "@/server/services/launch-scheduling";
import { getLaunchVideoBriefUrl } from "@/server/services/launch-video-brief-service";
import { sendProductEmailSafely } from "@/server/services/submission-service-shared";
import { startOfUtcDay } from "@/server/services/time";

const FALLBACK_PRICE_CENTS: Record<LaunchVideoMode, number> = {
  premium: 9900,
  standalone: 12900,
};
const SOLD_STATUSES = ["PAID", "DELIVERED"] as const;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

function getLaunchVideoProductId(mode: LaunchVideoMode) {
  const env = getEnv();
  return mode === "premium"
    ? env.DODO_LAUNCH_VIDEO_PRODUCT_ID
    : env.DODO_LAUNCH_VIDEO_STANDALONE_PRODUCT_ID;
}

async function loadProductPriceCents(mode: LaunchVideoMode, productId: string | undefined) {
  if (!productId) {
    return null;
  }

  try {
    const product = await getDodoClient().products.retrieve(productId);
    return readDodoProductPriceCents(product) ?? FALLBACK_PRICE_CENTS[mode];
  } catch (error) {
    console.error(`[shipboost dodo] failed to load ${mode} launch video price`, error);
    return FALLBACK_PRICE_CENTS[mode];
  }
}

export async function loadLaunchVideoPriceCents(mode: LaunchVideoMode) {
  return loadProductPriceCents(mode, getLaunchVideoProductId(mode));
}

// The product ids are arguments, so they are part of the cache key: changing
// either env var never serves a price cached for the old (or missing) product.
const getCachedLaunchVideoPrices = unstable_cache(
  async (premiumProductId: string | undefined, standaloneProductId: string | undefined) => ({
    premium: await loadProductPriceCents("premium", premiumProductId),
    standalone: await loadProductPriceCents("standalone", standaloneProductId),
  }),
  ["dodo-launch-video-prices", "v3"],
  { revalidate: 900 },
);

export function buildLaunchVideoDemo(): LaunchVideoDemo | null {
  const env = getEnv();
  const publicId = env.LAUNCH_VIDEO_DEMO_CLOUDINARY_ID;

  if (!publicId || !env.CLOUDINARY_CLOUD_NAME) {
    return null;
  }

  const base = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/video/upload`;
  const source = (id: string, width: number) => ({
    videoUrl: `${base}/q_auto,vc_auto,w_${width}/${id}.mp4`,
    posterUrl: `${base}/so_${LAUNCH_VIDEO_DEMO_POSTER_SECONDS},q_auto,w_${width}/${id}.jpg`,
  });
  const portraitId = env.LAUNCH_VIDEO_DEMO_PORTRAIT_CLOUDINARY_ID;

  return {
    ...source(publicId, 1280),
    portrait: portraitId ? source(portraitId, 720) : null,
  };
}

/** A standalone video is due 7 days after the order; it is filed under the week it is due in. */
export function getStandaloneDeliveryWindow(now: Date) {
  const deliverBy = new Date(now.getTime() + LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS * DAY_IN_MS);
  return { deliverBy, deliveryWeekStart: getLaunchWeekStart(deliverBy) };
}

function getPremiumDeliverBy(launchWeekStart: Date) {
  return new Date(launchWeekStart.getTime() + 7 * DAY_IN_MS);
}

async function countLaunchPriceOrdersSold() {
  return prisma.launchVideoOrder.count({
    where: { status: { in: [...SOLD_STATUSES] } },
  });
}

export async function getLaunchVideoOffer(): Promise<LaunchVideoOffer> {
  const prices = await getCachedLaunchVideoPrices(
    getLaunchVideoProductId("premium"),
    getLaunchVideoProductId("standalone"),
  );
  const unavailable: LaunchVideoOffer = {
    available: false,
    priceUsd: {
      premium: FALLBACK_PRICE_CENTS.premium / 100,
      standalone: FALLBACK_PRICE_CENTS.standalone / 100,
    },
    launchPriceSpotsLeft: 0,
    demo: null,
  };

  // Both products are needed: the add-on is shown to Premium and free launches alike.
  if (prices.premium === null || prices.standalone === null) {
    return unavailable;
  }

  try {
    const soldCount = await countLaunchPriceOrdersSold();

    return {
      available: true,
      priceUsd: { premium: prices.premium / 100, standalone: prices.standalone / 100 },
      launchPriceSpotsLeft: Math.max(0, LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT - soldCount),
      demo: buildLaunchVideoDemo(),
    };
  } catch (error) {
    console.error("[shipboost] failed to load launch video offer", error);
    return unavailable;
  }
}

export async function createPendingLaunchVideoOrder(input: {
  mode: LaunchVideoMode;
  submissionId: string;
  /** Required for Premium orders: the reserved launch week. */
  launchWeekStart?: Date;
  focusNote?: string;
  now?: Date;
}) {
  const productId = getLaunchVideoProductId(input.mode);

  if (!productId) {
    throw new AppError(500, "Dodo launch video product is not configured.");
  }

  const now = input.now ?? new Date();
  let launchWeekStart: Date;
  let deliverBy: Date;

  if (input.mode === "premium") {
    if (!input.launchWeekStart) {
      throw new AppError(400, "Premium launch week is missing.");
    }
    launchWeekStart = startOfUtcDay(input.launchWeekStart);
    deliverBy = getPremiumDeliverBy(launchWeekStart);
  } else {
    const window = getStandaloneDeliveryWindow(now);
    launchWeekStart = startOfUtcDay(window.deliveryWeekStart);
    deliverBy = window.deliverBy;
  }

  const priceCents = (await loadLaunchVideoPriceCents(input.mode)) ?? FALLBACK_PRICE_CENTS[input.mode];
  const focusNote = input.focusNote?.trim();
  const order = await prisma.launchVideoOrder.create({
    data: {
      submissionId: input.submissionId,
      standalone: input.mode === "standalone",
      launchWeekStart,
      deliverBy,
      focusNote: focusNote ? focusNote : null,
      priceCents,
    },
  });

  return { order, productId };
}

export async function attachLaunchVideoCheckoutSession(orderId: string, checkoutSessionId: string) {
  await prisma.launchVideoOrder.update({
    where: { id: orderId },
    data: { checkoutSessionId },
  });
}

export async function cancelPendingLaunchVideoOrder(orderId: string) {
  await prisma.launchVideoOrder.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { status: "CANCELED" },
  });
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

export async function handleLaunchVideoPaymentSucceeded(input: {
  orderId: string;
  paymentId: string;
}) {
  const paidAt = new Date();
  const pending = await prisma.launchVideoOrder.findUnique({
    where: { id: input.orderId },
    select: { standalone: true, deliverBy: true },
  });

  if (!pending) {
    return null;
  }

  // Standalone videos are due 7 days after payment, not after checkout started.
  const deliverBy = pending.standalone
    ? getStandaloneDeliveryWindow(paidAt).deliverBy
    : pending.deliverBy;

  // Only a PENDING order can move to PAID, so the webhook and the return-route
  // reconciliation can both call this without double-sending emails.
  const transition = await prisma.launchVideoOrder.updateMany({
    where: { id: input.orderId, status: "PENDING" },
    data: { status: "PAID", paymentId: input.paymentId, paidAt, deliverBy },
  });

  if (transition.count === 0) {
    return null;
  }

  const order = await prisma.launchVideoOrder.findUnique({
    where: { id: input.orderId },
    include: { submission: { include: { user: true, tool: true } } },
  });

  if (!order) {
    return null;
  }

  const env = getEnv();
  const { tool, user } = order.submission;
  const delivery = order.standalone
    ? { kind: "standalone" as const, deliverBy: formatDate(order.deliverBy ?? paidAt) }
    : { kind: "premium" as const, launchWeek: formatDate(order.launchWeekStart) };
  const soldCount = await countLaunchPriceOrdersSold();
  const adminEmail = env.ADMIN_EMAIL ?? env.RESEND_REPLY_TO_TRANSACTIONAL;

  await sendProductEmailSafely(
    sendLaunchVideoBookedEmailMessage({
      to: user.email,
      name: user.name,
      briefUrl: getLaunchVideoBriefUrl(order.submissionId),
      toolName: tool.name,
      delivery,
    }),
  );

  if (adminEmail) {
    await sendProductEmailSafely(
      sendLaunchVideoOrderAdminEmailMessage({
        to: adminEmail,
        toolName: tool.name,
        toolUrl: tool.websiteUrl,
        listingUrl: `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/tools/${tool.slug}`,
        founderEmail: user.email,
        orderType: order.standalone ? "Free launch (standalone)" : "Premium Launch add-on",
        deliverBy: formatDate(order.deliverBy ?? paidAt),
        focusNote: order.focusNote,
        amountPaid: `$${(order.priceCents / 100).toFixed(0)}`,
        launchPriceSpotsLeft: Math.max(0, LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT - soldCount),
        laterPrices: `$${LAUNCH_VIDEO_LATER_PRICE_USD.premium} (with Premium) and $${LAUNCH_VIDEO_LATER_PRICE_USD.standalone} (standalone)`,
      }),
    );
  }

  await capturePostHogEventSafely(
    {
      distinctId: user.id,
      event: "launch_video_paid",
      properties: {
        launch_video_order_id: order.id,
        submission_id: order.submissionId,
        tool_id: tool.id,
        tool_slug: tool.slug,
        payment_id: input.paymentId,
        price_cents: order.priceCents,
        standalone: order.standalone,
        deliver_by: order.deliverBy?.toISOString() ?? null,
      },
    },
    "handleLaunchVideoPaymentSucceeded",
  );

  return order;
}

/**
 * Marks the launch video on a refunded payment as refunded. A partial refund on
 * a payment that includes a video is treated as a video-only refund. Returns
 * true when the refund should not touch the Premium Launch on that payment.
 */
export async function handleLaunchVideoRefundSucceeded(input: {
  paymentId: string;
  isPartial: boolean;
}) {
  const result = await prisma.launchVideoOrder.updateMany({
    where: { paymentId: input.paymentId, status: { in: [...SOLD_STATUSES] } },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });

  return result.count > 0 && input.isPartial;
}

/** Moves a paid Premium video to the launch's new week when the founder reschedules. */
export async function moveLaunchVideoOrderToWeek(submissionId: string, nextWeekStart: Date) {
  const order = await prisma.launchVideoOrder.findFirst({
    where: { submissionId, standalone: false, status: "PAID" },
    select: { id: true, launchWeekStart: true },
  });
  const launchWeekStart = startOfUtcDay(nextWeekStart);

  if (!order || order.launchWeekStart.getTime() === launchWeekStart.getTime()) {
    return;
  }

  await prisma.launchVideoOrder.update({
    where: { id: order.id },
    data: { launchWeekStart, deliverBy: getPremiumDeliverBy(launchWeekStart) },
  });
}
