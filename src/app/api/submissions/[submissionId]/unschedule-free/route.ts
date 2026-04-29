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
import { unscheduleFreeSubmissionLaunch } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const timing = startRouteTiming("submission-unschedule-free");

  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const submission = await unscheduleFreeSubmissionLaunch(submissionId, {
      id: session.user.id,
    });
    revalidateAllPublicContent();

    return withRouteTiming(ok(submission), timing);
  } catch (error) {
    return withRouteTiming(errorResponse(error), timing);
  }
}
