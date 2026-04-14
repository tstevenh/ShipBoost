import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidatePublicBlogContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import {
  createAdminBlogCategory,
  listAdminBlogCategories,
} from "@/server/services/blog-service";
import { blogCategoryCreateSchema } from "@/server/validators/blog";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const categories = await listAdminBlogCategories();
    return ok(categories);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const body = blogCategoryCreateSchema.parse(await request.json());
    const category = await createAdminBlogCategory(body);
    revalidatePublicBlogContent();

    return created(category);
  } catch (error) {
    return errorResponse(error);
  }
}
