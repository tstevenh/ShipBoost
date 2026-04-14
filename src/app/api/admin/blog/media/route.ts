import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";
import { uploadBlogImage } from "@/server/uploads/blog-media";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File)) {
      throw new AppError(400, "Image file is required.");
    }

    const uploadKind = kind === "blog-cover" ? "blog-cover" : "blog-inline";
    const uploaded = await uploadBlogImage(file, uploadKind);

    return ok({
      ...uploaded,
      markdown: `![${file.name}](${uploaded.url})`,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
