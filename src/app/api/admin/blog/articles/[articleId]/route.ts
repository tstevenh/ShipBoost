import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidatePublicBlogContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import {
  getAdminBlogArticleById,
  updateAdminBlogArticle,
} from "@/server/services/blog-service";
import { blogArticleUpdateSchema } from "@/server/validators/blog";

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { articleId } = await context.params;
    const article = await getAdminBlogArticleById(articleId);

    return ok(article);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { articleId } = await context.params;
    const body = blogArticleUpdateSchema.parse(await request.json());
    const article = await updateAdminBlogArticle(articleId, body);

    revalidatePublicBlogContent({
      articleSlug: article.status === "PUBLISHED" ? article.slug : undefined,
      categorySlug:
        article.status === "PUBLISHED" ? article.primaryCategory.slug : undefined,
      tagSlugs:
        article.status === "PUBLISHED"
          ? article.articleTags.map((item) => item.tag.slug)
          : undefined,
    });

    return ok(article);
  } catch (error) {
    return errorResponse(error);
  }
}
