import type { NextRequest } from "next/server";

import { getSessionFromRequest } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { getListingClaimState } from "@/server/services/listing-claim-service";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

function serializeClaimState(
  claimState: Awaited<ReturnType<typeof getListingClaimState>>,
) {
  if ("reviewedAt" in claimState) {
    return {
      ...claimState,
      reviewedAt: claimState.reviewedAt?.toISOString() ?? null,
    };
  }

  return claimState;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionFromRequest(request);
    const { toolId } = await context.params;
    const claimState = await getListingClaimState(toolId, {
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
    });

    return ok(
      {
        claimState: serializeClaimState(claimState),
        viewerEmail: session?.user.email ?? null,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
