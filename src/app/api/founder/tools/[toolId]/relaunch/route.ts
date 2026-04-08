import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { createRelaunchSubmission } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { toolId } = await context.params;
    const submission = await createRelaunchSubmission(toolId, {
      id: session.user.id,
    });
    return ok(submission);
  } catch (error) {
    return errorResponse(error);
  }
}
