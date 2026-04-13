import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { CATALOG_CACHE_TAGS } from "@/server/cache/catalog-options";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import {
  deleteCategory,
  updateCategory,
} from "@/server/services/catalog-service";
import { categoryUpdateSchema } from "@/server/validators/catalog";

type RouteContext = {
  params: Promise<{ categoryId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { categoryId } = await context.params;
    const body = categoryUpdateSchema.parse(await request.json());
    const category = await updateCategory(categoryId, body);
    revalidateTag(CATALOG_CACHE_TAGS.categories, "max");
    revalidateAllPublicContent();

    return ok(category);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { categoryId } = await context.params;
    await deleteCategory(categoryId);
    revalidateTag(CATALOG_CACHE_TAGS.categories, "max");
    revalidateAllPublicContent();

    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
