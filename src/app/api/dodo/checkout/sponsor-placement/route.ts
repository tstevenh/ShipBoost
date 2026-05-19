import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import {
  createPendingSponsorPlacementCheckout,
  createSponsorPlacementCheckout,
} from "@/server/services/sponsor-placement-service";
import { sponsorPlacementCheckoutSchema } from "@/server/validators/sponsor-placement";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = sponsorPlacementCheckoutSchema.parse(await request.json());

    const founder = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
    const checkout = body.placementId
      ? await createPendingSponsorPlacementCheckout(body.placementId, founder)
      : await createSponsorPlacementCheckout(body.toolId!, founder, body.slot);

    return ok(checkout);
  } catch (error) {
    return errorResponse(error);
  }
}
