import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { castLaunchRequirementVote } from "@/server/services/free-launch-requirements";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const body = (await request.json()) as { toolId?: unknown };
    if (typeof body.toolId !== "string" || body.toolId.length === 0) {
      return errorResponse(new Error("toolId is required"));
    }
    const result = await castLaunchRequirementVote(submissionId, body.toolId, {
      id: session.user.id,
    });
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
