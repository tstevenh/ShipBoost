import { after } from "next/server";
import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import {
  errorResponse,
  ok,
  startRouteTiming,
  withRouteTiming,
} from "@/server/http/response";
import {
  scheduleFreeSubmissionLaunch,
} from "@/server/services/submission-service";
import { sendProductEmailSafely } from "@/server/services/submission-service-shared";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const timing = startRouteTiming("submission-schedule-free");

  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const result = await scheduleFreeSubmissionLaunch(submissionId, {
      id: session.user.id,
    });
    after(() => sendProductEmailSafely(result.emailTask));
    revalidateAllPublicContent();

    return withRouteTiming(
      ok({
        submission: result.submission,
        launch: result.launch,
      }),
      timing,
    );
  } catch (error) {
    return withRouteTiming(errorResponse(error), timing);
  }
}
