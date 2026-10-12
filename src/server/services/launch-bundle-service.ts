import { prisma } from "@/server/db/client";
import { getDodoClient } from "@/server/dodo";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { getSubmissionByIdForFounder } from "@/server/repositories/submission-repository";
import {
  createPendingSponsorPlacements,
  handleSponsorPlacementPaymentSucceeded,
} from "@/server/services/sponsor-placement-service";
import { getSponsorSlotConfig } from "@/server/services/sponsor-pricing";
import { scheduleFreeSubmissionLaunch } from "@/server/services/submission-service";
import { applyPremiumLaunchPaymentSucceeded } from "@/server/services/submission-payment-service";
import {
  attachLaunchVideoCheckoutSession,
  cancelPendingLaunchVideoOrder,
  createPendingLaunchVideoOrder,
  handleLaunchVideoPaymentSucceeded,
} from "@/server/services/launch-video-service";
import type { SponsorSlot } from "@prisma/client";

type FounderLike = { id: string; email: string; name?: string | null };

function getBundleReturnUrl(opts: {
  submissionId: string;
  placementIds: string[];
  launchType: "FREE" | "FEATURED";
}) {
  const env = getEnv();
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = new URL(`${base}/api/dodo/return/launch-bundle`);
  url.searchParams.set("submission_id", opts.submissionId);
  url.searchParams.set("type", opts.launchType);
  if (opts.placementIds.length > 0) {
    url.searchParams.set("placement_ids", opts.placementIds.join(","));
  }
  return url.toString();
}

export async function createLaunchBundleCheckout(input: {
  submissionId: string;
  launchType: "FREE" | "FEATURED";
  preferredLaunchDate?: string;
  sponsorSlots: SponsorSlot[];
  launchVideo?: { focusNote?: string };
  founder: FounderLike;
}) {
  const {
    submissionId,
    launchType,
    preferredLaunchDate,
    sponsorSlots,
    launchVideo,
    founder,
  } = input;

  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );
  if (!submission) throw new AppError(404, "Submission not found.");
  if (!submission.toolId) throw new AppError(400, "Submission has no associated tool.");

  const placements = await createPendingSponsorPlacements(
    submission.toolId,
    founder.id,
    sponsorSlots,
  );

  if (launchType === "FREE") {
    // Create the video order first so a fully booked week fails before the
    // free launch is scheduled.
    const videoOrder = launchVideo
      ? await createPendingLaunchVideoOrder({
          mode: "standalone",
          submissionId,
          focusNote: launchVideo.focusNote,
        })
      : null;

    let freeResult: Awaited<ReturnType<typeof scheduleFreeSubmissionLaunch>>;
    try {
      freeResult = await scheduleFreeSubmissionLaunch(submissionId, {
        id: founder.id,
      });
    } catch (error) {
      if (videoOrder) await cancelPendingLaunchVideoOrder(videoOrder.order.id);
      throw error;
    }

    if (placements.length === 0 && !videoOrder) {
      return {
        checkoutUrl: null as null,
        launchScheduled: true,
        scheduledLaunch: freeResult.launch,
        submission: freeResult.submission,
      };
    }

    const checkoutUrl = await createFreeLaunchAddOnCheckout({
      founder,
      placements,
      submissionId,
      videoOrder,
    });
    return {
      checkoutUrl,
      launchScheduled: true,
      scheduledLaunch: freeResult.launch,
      submission: freeResult.submission,
    };
  }

  // FEATURED
  if (!preferredLaunchDate) {
    throw new AppError(400, "Preferred launch date is required for premium launches.");
  }

  const checkoutUrl = await createPremiumBundleCheckout({
    submissionId,
    preferredLaunchDate,
    founder,
    placements,
    launchVideo,
  });

  return {
    checkoutUrl,
    launchScheduled: false,
    scheduledLaunch: null,
    submission: null,
  };
}

type PendingLaunchVideoOrder = Awaited<ReturnType<typeof createPendingLaunchVideoOrder>>;

async function createFreeLaunchAddOnCheckout(opts: {
  founder: FounderLike;
  placements: Array<{ slot: SponsorSlot; placementId: string }>;
  submissionId: string;
  videoOrder: PendingLaunchVideoOrder | null;
}): Promise<string> {
  const { videoOrder } = opts;
  const productCart = [
    ...opts.placements.map(({ slot }) => ({
      product_id: getSponsorSlotConfig(slot).dodoProductId!,
      quantity: 1 as const,
    })),
    ...(videoOrder ? [{ product_id: videoOrder.productId, quantity: 1 as const }] : []),
  ];

  const returnUrl = getBundleReturnUrl({
    submissionId: opts.submissionId,
    placementIds: opts.placements.map((p) => p.placementId),
    launchType: "FREE",
  });

  let checkout: Awaited<ReturnType<ReturnType<typeof getDodoClient>["checkoutSessions"]["create"]>>;

  try {
    checkout = await getDodoClient().checkoutSessions.create({
      product_cart: productCart,
      customer: { email: opts.founder.email, name: opts.founder.name ?? undefined },
      return_url: returnUrl,
      metadata: {
        shipboostProduct: "launch_bundle",
        shipboostLaunchType: "FREE",
        shipboostSubmissionId: opts.submissionId,
        shipboostSponsorPlacementIds: opts.placements.map((p) => p.placementId).join(","),
        ...(videoOrder ? { shipboostLaunchVideoOrderId: videoOrder.order.id } : {}),
      },
    });

    if (!checkout.checkout_url || !checkout.session_id) {
      throw new AppError(500, "Dodo checkout url or session id is missing.");
    }
  } catch (error) {
    if (videoOrder) {
      await cancelPendingLaunchVideoOrder(videoOrder.order.id);
    }
    for (const { placementId } of opts.placements) {
      await prisma.sponsorPlacement.update({
        where: { id: placementId },
        data: { status: "DISABLED", disabledAt: new Date() },
      });
    }
    throw error;
  }

  if (videoOrder) {
    await attachLaunchVideoCheckoutSession(videoOrder.order.id, checkout.session_id);
  }

  return checkout.checkout_url;
}

async function createPremiumBundleCheckout(opts: {
  submissionId: string;
  preferredLaunchDate: string;
  founder: FounderLike;
  placements: Array<{ slot: SponsorSlot; placementId: string }>;
  launchVideo?: { focusNote?: string };
}): Promise<string> {
  const env = getEnv();

  if (!env.DODO_PREMIUM_LAUNCH_PRODUCT_ID) {
    throw new AppError(500, "Dodo premium launch product is not configured.");
  }

  const preferredDate = new Date(opts.preferredLaunchDate);
  if (isNaN(preferredDate.getTime()) || preferredDate <= new Date()) {
    throw new AppError(400, "Choose a future launch week.");
  }

  const videoOrder = opts.launchVideo
    ? await createPendingLaunchVideoOrder({
        mode: "premium",
        submissionId: opts.submissionId,
        launchWeekStart: preferredDate,
        focusNote: opts.launchVideo.focusNote,
      })
    : null;

  await prisma.submission.update({
    where: { id: opts.submissionId },
    data: {
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: preferredDate,
      paymentStatus: "PENDING",
    },
  });

  const productCart: Array<{ product_id: string; quantity: 1 }> = [
    { product_id: env.DODO_PREMIUM_LAUNCH_PRODUCT_ID, quantity: 1 },
    ...opts.placements.map(({ slot }) => ({
      product_id: getSponsorSlotConfig(slot).dodoProductId!,
      quantity: 1 as const,
    })),
    ...(videoOrder ? [{ product_id: videoOrder.productId, quantity: 1 as const }] : []),
  ];

  const returnUrl = getBundleReturnUrl({
    submissionId: opts.submissionId,
    placementIds: opts.placements.map((p) => p.placementId),
    launchType: "FEATURED",
  });

  let checkout: Awaited<
    ReturnType<ReturnType<typeof getDodoClient>["checkoutSessions"]["create"]>
  >;

  try {
    checkout = await getDodoClient().checkoutSessions.create({
      product_cart: productCart,
      customer: { email: opts.founder.email, name: opts.founder.name ?? undefined },
      return_url: returnUrl,
      metadata: {
        shipboostProduct: "launch_bundle",
        shipboostLaunchType: "FEATURED",
        shipboostSubmissionId: opts.submissionId,
        shipboostPreferredLaunchDate: preferredDate.toISOString(),
        shipboostSponsorPlacementIds: opts.placements.map((p) => p.placementId).join(","),
        ...(videoOrder ? { shipboostLaunchVideoOrderId: videoOrder.order.id } : {}),
      },
    });

    if (!checkout.checkout_url || !checkout.session_id) {
      throw new AppError(500, "Dodo checkout url or session id is missing.");
    }
  } catch (error) {
    if (videoOrder) {
      await cancelPendingLaunchVideoOrder(videoOrder.order.id);
    }
    await prisma.submission.update({
      where: { id: opts.submissionId },
      data: { paymentStatus: "NOT_REQUIRED", submissionType: "LISTING_ONLY" },
    });
    for (const { placementId } of opts.placements) {
      await prisma.sponsorPlacement.update({
        where: { id: placementId },
        data: { status: "DISABLED", disabledAt: new Date() },
      });
    }
    throw error;
  }

  await prisma.submission.update({
    where: { id: opts.submissionId },
    data: { polarCheckoutId: checkout.session_id },
  });

  if (videoOrder) {
    await attachLaunchVideoCheckoutSession(videoOrder.order.id, checkout.session_id);
  }

  return checkout.checkout_url;
}

export async function reconcileLaunchBundlePayment(input: {
  submissionId: string;
  placementIds: string[];
  launchType: "FREE" | "FEATURED";
  paymentId: string;
  founderUserId: string;
}) {
  const dodo = getDodoClient();
  const payment = await dodo.payments.retrieve(input.paymentId);

  if (payment.status !== "succeeded") {
    return null;
  }

  if (input.launchType === "FEATURED" && input.submissionId) {
    try {
      const existing = await prisma.submission.findUnique({
        where: { id: input.submissionId },
        select: { paymentStatus: true },
      });

      if (existing && existing.paymentStatus !== "PAID") {
        await applyPremiumLaunchPaymentSucceeded({
          id: payment.payment_id,
          checkoutSessionId: payment.checkout_session_id ?? null,
          metadata: {
            ...(payment.metadata ?? {}),
            shipboostSubmissionId: input.submissionId,
          },
        });
      }
    } catch (error) {
      console.error("[shipboost] premium launch reconciliation failed", error);
    }
  }

  const launchVideoOrderId = payment.metadata?.shipboostLaunchVideoOrderId;

  if (typeof launchVideoOrderId === "string" && launchVideoOrderId.length > 0) {
    try {
      await handleLaunchVideoPaymentSucceeded({
        orderId: launchVideoOrderId,
        paymentId: payment.payment_id,
      });
    } catch (error) {
      console.error("[shipboost] launch video reconciliation failed", error);
    }
  }

  for (const placementId of input.placementIds) {
    try {
      const placement = await prisma.sponsorPlacement.findUnique({
        where: { id: placementId },
        select: { tool: { select: { ownerUserId: true } } },
      });
      if (!placement || placement.tool?.ownerUserId !== input.founderUserId) continue;

      await handleSponsorPlacementPaymentSucceeded({
        paymentId: payment.payment_id,
        // Bundles share one Dodo session across multiple placements; the
        // SponsorPlacement.checkoutSessionId column is unique, so we must
        // not write the shared session id to each placement.
        checkoutSessionId: null,
        metadata: { shipboostSponsorPlacementId: placementId },
      });
    } catch (error) {
      console.error("[shipboost] sponsor placement reconciliation failed", error);
    }
  }
}
