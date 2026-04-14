import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidatePublicBlogContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { updateAdminBlogTag } from "@/server/services/blog-service";
import { blogTagUpdateSchema } from "@/server/validators/blog";

type RouteContext = {
  params: Promise<{ tagId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { tagId } = await context.params;
    const body = blogTagUpdateSchema.parse(await request.json());
    const tag = await updateAdminBlogTag(tagId, body);
    revalidatePublicBlogContent({
      tagSlugs: [tag.slug],
    });

    return ok(tag);
  } catch (error) {
    return errorResponse(error);
  }
}
