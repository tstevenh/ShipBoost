import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { toggleToolUpvote } from "@/server/services/upvote-service";
import { toolVoteRouteParamsSchema } from "@/server/validators/upvote";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { toolId } = toolVoteRouteParamsSchema.parse(await context.params);
    const result = await toggleToolUpvote(toolId, session.user.id);

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
