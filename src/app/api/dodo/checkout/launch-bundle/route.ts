import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { createLaunchBundleCheckout } from "@/server/services/launch-bundle-service";
import { launchBundleCheckoutSchema } from "@/server/validators/launch-bundle";
import { premiumLaunchAvailable, premiumLaunchUnavailableMessage } from "@/lib/premium-launch";
import { AppError } from "@/server/http/app-error";

export async function POST(request: NextRequest) {
  try {
    getEnv();

    const session = await requireSession(request);
    const body = launchBundleCheckoutSchema.parse(await request.json());

    if (body.launchType === "FEATURED" && !premiumLaunchAvailable) {
      throw new AppError(503, premiumLaunchUnavailableMessage);
    }

    const result = await createLaunchBundleCheckout({
      submissionId: body.submissionId,
      launchType: body.launchType,
      preferredLaunchDate: body.preferredLaunchDate,
      sponsorSlots: body.sponsorSlots,
      launchVideo: body.launchVideo,
      founder: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    });

    if (result.launchScheduled) {
      revalidateAllPublicContent();
    }

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
