import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { cancelPendingSponsorPlacement } from "@/server/services/sponsor-placement-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ placementId: string }> },
) {
  try {
    const session = await requireSession(request);
    const { placementId } = await params;
    const placement = await cancelPendingSponsorPlacement(
      placementId,
      session.user.id,
    );
    return ok(placement);
  } catch (error) {
    return errorResponse(error);
  }
}
