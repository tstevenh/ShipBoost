import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { reconcileLaunchBundlePayment } from "@/server/services/launch-bundle-service";
import { revalidateAllPublicContent } from "@/server/cache/public-content";

export async function GET(request: NextRequest) {
  const env = getEnv();
  const url = new URL(request.url);

  const submissionId = url.searchParams.get("submission_id") ?? "";
  const launchType = (url.searchParams.get("type") ?? "FREE") as "FREE" | "FEATURED";
  const rawPlacementIds = url.searchParams.get("placement_ids") ?? "";
  const paymentId = url.searchParams.get("payment_id") ?? "";

  const placementIds = rawPlacementIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const dashboardBase = `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/dashboard`;
  const successUrl = new URL(dashboardBase);
  successUrl.searchParams.set("checkout", "success");
  if (submissionId) successUrl.searchParams.set("submission_id", submissionId);
  if (paymentId) successUrl.searchParams.set("payment_id", paymentId);

  const errorUrl = new URL(dashboardBase);
  errorUrl.searchParams.set("checkout", "error");

  try {
    const session = await getServerSession();

    if (session && paymentId) {
      await reconcileLaunchBundlePayment({
        submissionId,
        placementIds,
        launchType,
        paymentId,
        founderUserId: session.user.id,
      });
      revalidateAllPublicContent();
    }
  } catch {
    return NextResponse.redirect(errorUrl);
  }

  return NextResponse.redirect(successUrl);
}
