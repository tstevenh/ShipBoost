import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { rescheduleFeaturedLaunch } from "@/server/services/submission-service";
import { featuredLaunchRescheduleSchema } from "@/server/validators/submission";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

function serializeSubmission(submission: Awaited<ReturnType<typeof rescheduleFeaturedLaunch>>) {
  return {
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    paidAt: submission.paidAt?.toISOString() ?? null,
    tool: {
      ...submission.tool,
      launches: submission.tool.launches.map((launch) => ({
        ...launch,
        launchDate: launch.launchDate.toISOString(),
      })),
    },
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const body = featuredLaunchRescheduleSchema.parse(await request.json());
    const submission = await rescheduleFeaturedLaunch(submissionId, body, {
      id: session.user.id,
    });

    return ok(serializeSubmission(submission));
  } catch (error) {
    return errorResponse(error);
  }
}
