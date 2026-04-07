import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { verifyFreeLaunchBadge } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{
    submissionId: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const result = await verifyFreeLaunchBadge(submissionId, {
      id: session.user.id,
    });

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
