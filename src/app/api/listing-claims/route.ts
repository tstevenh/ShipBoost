import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import {
  createListingClaim,
  listFounderListingClaims,
} from "@/server/services/listing-claim-service";
import { listingClaimCreateSchema } from "@/server/validators/listing-claim";

function serializeClaim(claim: Awaited<ReturnType<typeof createListingClaim>>) {
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
    tool: {
      id: claim.tool.id,
      slug: claim.tool.slug,
      name: claim.tool.name,
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
    getEnv();
    const session = await requireSession(request);
    const claims = await listFounderListingClaims(session.user.id);

    return ok(claims.map(serializeClaim));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    getEnv();
    const session = await requireSession(request);
    const body = listingClaimCreateSchema.parse(await request.json());
    const claim = await createListingClaim({
      toolId: body.toolId,
      claimantUserId: session.user.id,
      claimantEmail: session.user.email,
    });

    return created(serializeClaim(claim));
  } catch (error) {
    return errorResponse(error);
  }
}
