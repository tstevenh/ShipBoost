import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listAdminUpcomingLaunchWeeks } from "@/server/services/admin-launch-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const launches = await listAdminUpcomingLaunchWeeks();
    return ok(launches);
  } catch (error) {
    return errorResponse(error);
  }
}
