import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidatePublicBlogContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { updateAdminBlogCategory } from "@/server/services/blog-service";
import { blogCategoryUpdateSchema } from "@/server/validators/blog";

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { categoryId } = await context.params;
    const body = blogCategoryUpdateSchema.parse(await request.json());
    const category = await updateAdminBlogCategory(categoryId, body);
    revalidatePublicBlogContent({
      categorySlug: category.slug,
    });

    return ok(category);
  } catch (error) {
    return errorResponse(error);
  }
}
