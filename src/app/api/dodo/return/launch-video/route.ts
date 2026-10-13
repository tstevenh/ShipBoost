import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { reconcileLaunchVideoPayment } from "@/server/services/launch-video-checkout-service";

export async function GET(request: NextRequest) {
  const base = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id") ?? "";
  const paymentId = url.searchParams.get("payment_id") ?? "";
  const status = url.searchParams.get("status") ?? "";

  const dashboardUrl = new URL(`${base}/dashboard`);
  dashboardUrl.searchParams.set("checkout", "success");
  dashboardUrl.searchParams.set("status", status && status !== "succeeded" ? status : "processing");

  try {
    const session = await getServerSession();

    if (session && orderId && paymentId) {
      const submissionId = await reconcileLaunchVideoPayment({
        orderId,
        paymentId,
        founderUserId: session.user.id,
      });

      // Paid: straight to the brief, which is the next thing to do.
      if (submissionId) {
        return NextResponse.redirect(`${base}/dashboard/submissions/${submissionId}/launch-video`);
      }
    }
  } catch (error) {
    console.error("[shipboost] launch video return reconciliation failed", error);
  }

  return NextResponse.redirect(dashboardUrl);
}
