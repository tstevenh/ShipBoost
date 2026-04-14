import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidatePublicBlogContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import {
  createAdminBlogArticle,
  listAdminBlogArticles,
} from "@/server/services/blog-service";
import {
  blogArticleCreateSchema,
  blogArticleListQuerySchema,
} from "@/server/validators/blog";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const query = blogArticleListQuerySchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      categoryId: request.nextUrl.searchParams.get("categoryId") ?? undefined,
    });

    const articles = await listAdminBlogArticles(query);
    return ok(articles);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const body = blogArticleCreateSchema.parse(await request.json());
    const article = await createAdminBlogArticle(body);

    revalidatePublicBlogContent({
      articleSlug: article.status === "PUBLISHED" ? article.slug : undefined,
      categorySlug:
        article.status === "PUBLISHED" ? article.primaryCategory.slug : undefined,
      tagSlugs:
        article.status === "PUBLISHED"
          ? article.articleTags.map((item) => item.tag.slug)
          : undefined,
    });

    return created(article);
  } catch (error) {
    return errorResponse(error);
  }
}
