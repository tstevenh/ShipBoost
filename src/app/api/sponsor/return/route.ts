import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getServerSession } from "@/server/auth/session";
import { reconcileSponsorPlacementPayment } from "@/server/services/sponsor-placement-service";

/**
 * Dodo redirects here after sponsor-placement checkout.
 * We reconcile the payment server-side, then redirect the founder back to the
 * homepage with `?sponsor=success` so the SponsorAdvertiseModal can render
 * the success state.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const placementId = url.searchParams.get("sponsor_placement_id") ?? undefined;
  const paymentId = url.searchParams.get("payment_id") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const origin = url.origin;
  const redirectUrl = new URL(`${origin}/`);
  redirectUrl.searchParams.set("sponsor", "success");
  if (status) {
    redirectUrl.searchParams.set("status", status);
  }

  try {
    const session = await getServerSession();
    if (session && paymentId) {
      const reconciled = await reconcileSponsorPlacementPayment({
        placementId,
        paymentId,
        founderUserId: session.user.id,
      });
      if (reconciled?.status) {
        redirectUrl.searchParams.set("placement_status", reconciled.status);
      }
    }
  } catch {
    redirectUrl.searchParams.set("sponsor", "error");
  }

  return NextResponse.redirect(redirectUrl);
}
