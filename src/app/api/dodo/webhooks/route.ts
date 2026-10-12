import { headers } from "next/headers";
import { Webhook } from "standardwebhooks";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";
import {
  handlePremiumLaunchPaymentSucceeded,
  handlePremiumLaunchRefundSucceeded,
} from "@/server/services/submission-service";
import {
  handleLaunchVideoPaymentSucceeded,
  handleLaunchVideoRefundSucceeded,
} from "@/server/services/launch-video-service";
import { handleSponsorPlacementPaymentSucceeded } from "@/server/services/sponsor-placement-service";

type DodoWebhookPayload = {
  type: string;
  data: {
    payment_id?: string;
    checkout_session_id?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
    discount_id?: string | null;
    discount_code?: string | null;
    total_amount?: number | null;
    is_partial?: boolean | null;
  };
};

export async function POST(request: Request) {
  const env = getEnv();
  const rawBody = await request.text();
  const headersList = await headers();
  const verifier = new Webhook(
    env.DODO_PAYMENTS_WEBHOOK_SECRET ?? "dodo_webhook_secret_missing",
  );

  try {
    verifier.verify(rawBody, {
      "webhook-id": headersList.get("webhook-id") ?? "",
      "webhook-signature": headersList.get("webhook-signature") ?? "",
      "webhook-timestamp": headersList.get("webhook-timestamp") ?? "",
    });
  } catch (error) {
    console.error("[shipboost dodo] invalid webhook signature", error);
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as DodoWebhookPayload;

  try {
    if (payload.type === "payment.succeeded" && payload.data.payment_id) {
      const paymentId = payload.data.payment_id;
      const shipboostProduct = payload.data.metadata?.shipboostProduct;

      if (shipboostProduct === "sponsor_placement") {
        await handleSponsorPlacementPaymentSucceeded({
          paymentId,
          checkoutSessionId: payload.data.checkout_session_id ?? null,
          metadata: payload.data.metadata ?? {},
        });
      } else if (shipboostProduct === "launch_bundle") {
        const launchType = payload.data.metadata?.shipboostLaunchType;
        const placementIdsRaw =
          payload.data.metadata?.shipboostSponsorPlacementIds;
        const placementIds =
          typeof placementIdsRaw === "string" && placementIdsRaw.length > 0
            ? placementIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
            : [];

        const placementHandlers = placementIds.map((placementId) =>
          handleSponsorPlacementPaymentSucceeded({
            paymentId,
            // Bundles share one Dodo session id across placements; SponsorPlacement.checkoutSessionId is unique.
            checkoutSessionId: null,
            metadata: {
              ...(payload.data.metadata ?? {}),
              shipboostSponsorPlacementId: placementId,
            },
          }),
        );

        const launchVideoOrderId =
          payload.data.metadata?.shipboostLaunchVideoOrderId;
        const launchVideoHandlers =
          typeof launchVideoOrderId === "string" && launchVideoOrderId.length > 0
            ? [handleLaunchVideoPaymentSucceeded({ orderId: launchVideoOrderId, paymentId })]
            : [];

        if (launchType === "FEATURED") {
          await Promise.all([
            handlePremiumLaunchPaymentSucceeded({
              paymentId,
              checkoutSessionId: payload.data.checkout_session_id ?? null,
              metadata: payload.data.metadata ?? {},
              amountCents: payload.data.total_amount ?? null,
              discountCode: payload.data.discount_code ?? null,
            }),
            ...placementHandlers,
            ...launchVideoHandlers,
          ]);
        } else {
          await Promise.all([...placementHandlers, ...launchVideoHandlers]);
        }
      } else {
        await handlePremiumLaunchPaymentSucceeded({
          paymentId,
          checkoutSessionId: payload.data.checkout_session_id ?? null,
          metadata: payload.data.metadata ?? {},
          amountCents: payload.data.total_amount ?? null,
          discountCode: payload.data.discount_code ?? null,
        });
      }

      // Mark any applied streak reward as redeemed
      const discountCode = payload.data.discount_code;
      const discountId = payload.data.discount_id;
      if (discountCode || discountId) {
        await prisma.streakReward.updateMany({
          where: {
            redeemedAt: null,
            OR: [
              ...(discountCode ? [{ code: discountCode }] : []),
              ...(discountId ? [{ dodoDiscountId: discountId }] : []),
            ],
          },
          data: { redeemedAt: new Date() },
        });
      }

      revalidateAllPublicContent();
    }

    if (
      payload.type === "refund.succeeded" &&
      payload.data.payment_id &&
      (!payload.data.status || payload.data.status === "succeeded")
    ) {
      const launchVideoOnlyRefund = await handleLaunchVideoRefundSucceeded({
        paymentId: payload.data.payment_id,
        isPartial: payload.data.is_partial === true,
      });

      if (!launchVideoOnlyRefund) {
        await handlePremiumLaunchRefundSucceeded({
          paymentId: payload.data.payment_id,
        });
      }
      revalidateAllPublicContent();
    }
  } catch (error) {
    console.error("[shipboost dodo] webhook processing error", error);
  }

  return new Response("OK", { status: 200 });
}
