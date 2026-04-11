import { after } from "next/server";
import type { NextRequest } from "next/server";

import { requireAdminUserId } from "@/server/auth/request-context";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import {
  errorResponse,
  ok,
  startRouteTiming,
  withRouteTiming,
} from "@/server/http/response";
import { sendProductEmailSafely } from "@/server/services/submission-service-shared";
import { reviewSubmission } from "@/server/services/submission-service";
import { submissionReviewSchema } from "@/server/validators/submission";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const timing = startRouteTiming("admin-submission-review");

  try {
    const adminUserId = await requireAdminUserId(request);
    getEnv();

    const { submissionId } = await context.params;
    const body = submissionReviewSchema.parse(await request.json());
    const result = await reviewSubmission(
      submissionId,
      body,
      adminUserId,
    );
    after(() => sendProductEmailSafely(result.emailTask));

    revalidateAllPublicContent();

    return withRouteTiming(
      ok({
        submission: result.submission,
        tool: result.tool,
      }),
      timing,
    );
  } catch (error) {
    return withRouteTiming(errorResponse(error), timing);
  }
}
