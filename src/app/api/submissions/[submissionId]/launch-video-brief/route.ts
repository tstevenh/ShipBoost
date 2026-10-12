import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import {
  getFounderLaunchVideoBrief,
  saveFounderLaunchVideoBrief,
} from "@/server/services/launch-video-brief-service";
import { launchVideoBriefSchema } from "@/server/validators/launch-video-brief";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { submissionId } = await context.params;

    return ok(await getFounderLaunchVideoBrief(submissionId, { id: session.user.id }));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const body = launchVideoBriefSchema.parse(await request.json());

    return ok(
      await saveFounderLaunchVideoBrief(submissionId, { id: session.user.id }, body),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
