import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { reschedulePremiumLaunch } from "@/server/services/submission-service";
import { premiumLaunchRescheduleSchema } from "@/server/validators/submission";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

function serializeSubmission(
  submission: Awaited<ReturnType<typeof reschedulePremiumLaunch>>,
) {
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
    const body = premiumLaunchRescheduleSchema.parse(await request.json());
    const submission = await reschedulePremiumLaunch(submissionId, body, {
      id: session.user.id,
    });
    revalidateAllPublicContent();

    return ok(serializeSubmission(submission));
  } catch (error) {
    return errorResponse(error);
  }
}
