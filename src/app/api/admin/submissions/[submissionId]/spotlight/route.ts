import type { NextRequest } from "next/server";

import { requireRole } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import { linkPublishedSpotlightArticle } from "@/server/services/submission-spotlight-service";
import { adminSpotlightLinkSchema } from "@/server/validators/submission";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireRole(request, "ADMIN");
    const { submissionId } = await context.params;
    const body = adminSpotlightLinkSchema.parse(await request.json());

    return ok(
      await linkPublishedSpotlightArticle({
        submissionId,
        articleSlug: body.articleSlug,
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
