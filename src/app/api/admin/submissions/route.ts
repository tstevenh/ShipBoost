import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listAdminSubmissionQueue } from "@/server/services/submission-service";
import { adminSubmissionListQuerySchema } from "@/server/validators/submission";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const query = adminSubmissionListQuerySchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      reviewStatus: request.nextUrl.searchParams.get("reviewStatus") ?? undefined,
    });

    const submissions = await listAdminSubmissionQueue(query);
    return ok(submissions);
  } catch (error) {
    return errorResponse(error);
  }
}
