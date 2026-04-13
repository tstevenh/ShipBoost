import type { NextRequest } from "next/server";

import { AppError } from "@/server/http/app-error";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { uploadSubmissionMedia } from "@/server/uploads/submission-media";

export async function POST(request: NextRequest) {
  try {
    getEnv();
    await requireSession(request);

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
