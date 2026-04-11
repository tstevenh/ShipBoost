import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";

import { CATALOG_CACHE_TAGS } from "@/server/cache/catalog-options";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import { createTag, listTags } from "@/server/services/catalog-service";
import { tagCreateSchema } from "@/server/validators/catalog";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const tags = await listTags();
    return ok(tags);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const body = tagCreateSchema.parse(await request.json());
    const tag = await createTag(body);
    revalidateTag(CATALOG_CACHE_TAGS.tags, "max");
    revalidateAllPublicContent();

    return created(tag);
  } catch (error) {
    return errorResponse(error);
  }
}
