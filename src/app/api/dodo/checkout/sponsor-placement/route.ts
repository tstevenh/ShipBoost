import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { createSponsorPlacementCheckout } from "@/server/services/sponsor-placement-service";
import { sponsorPlacementCheckoutSchema } from "@/server/validators/sponsor-placement";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = sponsorPlacementCheckoutSchema.parse(await request.json());

    const checkout = await createSponsorPlacementCheckout(body.toolId, {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    return ok(checkout);
  } catch (error) {
    return errorResponse(error);
  }
}
