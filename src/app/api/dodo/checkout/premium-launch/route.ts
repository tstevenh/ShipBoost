import type { NextRequest } from "next/server";

import { premiumLaunchAvailable, premiumLaunchUnavailableMessage } from "@/lib/premium-launch";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";
import { createPremiumLaunchCheckout } from "@/server/services/submission-service";
import { premiumLaunchCheckoutSchema } from "@/server/validators/submission";

export async function POST(request: NextRequest) {
  try {
    getEnv();

    if (!premiumLaunchAvailable) {
      throw new AppError(503, premiumLaunchUnavailableMessage);
    }

    const session = await requireSession(request);
    const body = premiumLaunchCheckoutSchema.parse(await request.json());

    const checkout = await createPremiumLaunchCheckout(body.submissionId, {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      preferredLaunchDate: body.preferredLaunchDate,
    });

    return ok(checkout);
  } catch (error) {
    return errorResponse(error);
  }
}
