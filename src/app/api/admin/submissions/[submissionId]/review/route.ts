import type { NextRequest } from "next/server";

import { requireAdminUserId } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { reviewSubmission } from "@/server/services/submission-service";
import { submissionReviewSchema } from "@/server/validators/submission";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const adminUserId = await requireAdminUserId(request);
    getEnv();

    const { submissionId } = await context.params;
    const body = submissionReviewSchema.parse(await request.json());
    const submission = await reviewSubmission(
      submissionId,
      body,
      adminUserId,
    );

    return ok(submission);
  } catch (error) {
    return errorResponse(error);
  }
}
