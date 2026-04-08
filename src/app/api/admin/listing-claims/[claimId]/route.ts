import type { NextRequest } from "next/server";

import { requireAdminUserId } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { reviewListingClaim } from "@/server/services/listing-claim-service";
import { listingClaimReviewSchema } from "@/server/validators/listing-claim";

type RouteContext = {
  params: Promise<{ claimId: string }>;
};

function serializeClaim(claim: Awaited<ReturnType<typeof reviewListingClaim>>) {
  return {
    id: claim.id,
    status: claim.status,
    claimEmail: claim.claimEmail,
    claimDomain: claim.claimDomain,
    websiteDomain: claim.websiteDomain,
    founderVisibleNote: claim.founderVisibleNote,
    internalAdminNote: claim.internalAdminNote,
    reviewedAt: claim.reviewedAt?.toISOString() ?? null,
    createdAt: claim.createdAt.toISOString(),
    claimantUser: claim.claimantUser,
    reviewedBy: claim.reviewedBy,
    tool: {
      id: claim.tool.id,
      slug: claim.tool.slug,
      name: claim.tool.name,
      tagline: claim.tool.tagline,
      websiteUrl: claim.tool.websiteUrl,
      ownerUserId: claim.tool.ownerUserId,
      logoMedia: claim.tool.logoMedia
        ? {
            url: claim.tool.logoMedia.url,
          }
        : null,
    },
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const adminUserId = await requireAdminUserId(request);
    getEnv();

    const { claimId } = await context.params;
    const body = listingClaimReviewSchema.parse(await request.json());
    const claim = await reviewListingClaim(claimId, body, adminUserId);

    return ok(serializeClaim(claim));
  } catch (error) {
    return errorResponse(error);
  }
}
