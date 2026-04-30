import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listFounderSponsorPlacements } from "@/server/services/sponsor-placement-service";

export async function GET(request: NextRequest) {
  try {
    getEnv();
    const session = await requireSession(request);

    const placements = await listFounderSponsorPlacements(session.user.id);
    return ok(placements);
  } catch (error) {
    return errorResponse(error);
  }
}
