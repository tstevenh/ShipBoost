import type { NextRequest } from "next/server";

import { requireRole } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { listAdminSponsorPlacements } from "@/server/services/sponsor-placement-service";

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");
    return ok(await listAdminSponsorPlacements());
  } catch (error) {
    return errorResponse(error);
  }
}
