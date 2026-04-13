import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { CATALOG_CACHE_TAGS } from "@/server/cache/catalog-options";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { deleteTag, updateTag } from "@/server/services/catalog-service";
import { tagUpdateSchema } from "@/server/validators/catalog";

type RouteContext = {
  params: Promise<{ tagId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { tagId } = await context.params;
    const body = tagUpdateSchema.parse(await request.json());
    const tag = await updateTag(tagId, body);
    revalidateTag(CATALOG_CACHE_TAGS.tags, "max");
    revalidateAllPublicContent();

    return ok(tag);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { tagId } = await context.params;
    await deleteTag(tagId);
    revalidateTag(CATALOG_CACHE_TAGS.tags, "max");
    revalidateAllPublicContent();

    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
