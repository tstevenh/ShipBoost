import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { AppError } from "@/server/http/app-error";
import { getFounderToolEditorById } from "@/server/services/tool-service";
import { uploadSubmissionMedia } from "@/server/uploads/submission-media";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { toolId } = await context.params;

    const tool = await getFounderToolEditorById(session.user.id, toolId);

    if (!tool) {
      throw new AppError(404, "Tool not found.");
    }

    const formData = await request.formData();
    const logoValue = formData.get("logo");
    const screenshotValues = formData.getAll("screenshots");

    if (logoValue !== null && !(logoValue instanceof File)) {
      throw new AppError(400, "Invalid logo upload.");
    }

    if (screenshotValues.some((file) => !(file instanceof File))) {
      throw new AppError(400, "Invalid screenshot upload.");
    }

    const uploaded = await uploadSubmissionMedia({
      logoFile: logoValue instanceof File ? logoValue : null,
      screenshotFiles: screenshotValues as File[],
    });

    return ok(uploaded);
  } catch (error) {
    return errorResponse(error);
  }
}
