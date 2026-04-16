import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import {
  getFounderSpotlightBrief,
  saveFounderSpotlightBrief,
} from "@/server/services/submission-spotlight-service";
import { spotlightBriefSchema } from "@/server/validators/submission";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { submissionId } = await context.params;

    return ok(await getFounderSpotlightBrief(submissionId, { id: session.user.id }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const body = spotlightBriefSchema.parse(await request.json());

    return ok(
      await saveFounderSpotlightBrief(submissionId, { id: session.user.id }, body),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
