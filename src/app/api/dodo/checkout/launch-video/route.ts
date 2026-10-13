import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { createLaunchVideoCheckout } from "@/server/services/launch-video-checkout-service";
import { launchVideoCheckoutSchema } from "@/server/validators/launch-video-brief";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = launchVideoCheckoutSchema.parse(await request.json());

    return ok(
      await createLaunchVideoCheckout({
        submissionId: body.submissionId,
        founder: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
        },
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
