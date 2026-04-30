import type { NextRequest } from "next/server";

import { requireRole } from "@/server/auth/session";
import { revalidatePublicSponsorPlacements } from "@/server/cache/public-content";
import { errorResponse, ok } from "@/server/http/response";
import { disableSponsorPlacement } from "@/server/services/sponsor-placement-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  try {
    await requireRole(request, "ADMIN");
    const { placementId } = await params;
    const placement = await disableSponsorPlacement(placementId);
    revalidatePublicSponsorPlacements();
    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
