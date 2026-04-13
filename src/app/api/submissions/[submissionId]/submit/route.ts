import { after } from "next/server";
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import {
  errorResponse,
  ok,
  startRouteTiming,
  withRouteTiming,
} from "@/server/http/response";
import { sendProductEmailSafely } from "@/server/services/submission-service-shared";
import { submitSubmissionDraft } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const timing = startRouteTiming("submission-submit");

  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const result = await submitSubmissionDraft(submissionId, {
      id: session.user.id,
    });
    after(() => sendProductEmailSafely(result.emailTask));

    return withRouteTiming(ok(result.submission), timing);
  } catch (error) {
    return withRouteTiming(errorResponse(error), timing);
  }
}
