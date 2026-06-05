import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { getFreeLaunchRequirements } from "@/server/services/free-launch-requirements";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const result = await getFreeLaunchRequirements(submissionId, {
      id: session.user.id,
    });
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
