import { headers } from "next/headers";
import { Webhook } from "standardwebhooks";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import {
  handlePremiumLaunchPaymentSucceeded,
  handlePremiumLaunchRefundSucceeded,
} from "@/server/services/submission-service";

type DodoWebhookPayload = {
  type: string;
  data: {
    payment_id?: string;
    checkout_session_id?: string | null;
    status?: string | null;
    metadata?: Record<string, unknown>;
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
      await handlePremiumLaunchPaymentSucceeded({
        paymentId: payload.data.payment_id,
        checkoutSessionId: payload.data.checkout_session_id ?? null,
        metadata: payload.data.metadata ?? {},
      });
      revalidateAllPublicContent();
    }

    if (
      payload.type === "refund.succeeded" &&
      payload.data.payment_id &&
      (!payload.data.status || payload.data.status === "succeeded")
    ) {
      await handlePremiumLaunchRefundSucceeded({
        paymentId: payload.data.payment_id,
      });
      revalidateAllPublicContent();
    }
  } catch (error) {
    console.error("[shipboost dodo] webhook processing error", error);
  }

  return new Response("OK", { status: 200 });
}
