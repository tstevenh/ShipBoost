import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listAdminListingClaims } from "@/server/services/listing-claim-service";
import { listingClaimListQuerySchema } from "@/server/validators/listing-claim";

function serializeClaim(
  claim: Awaited<ReturnType<typeof listAdminListingClaims>>[number],
) {
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

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const query = listingClaimListQuerySchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
    });
    const claims = await listAdminListingClaims(query);

    return ok(claims.map(serializeClaim));
  } catch (error) {
    return errorResponse(error);
  }
}
