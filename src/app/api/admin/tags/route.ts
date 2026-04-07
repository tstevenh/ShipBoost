import type { NextRequest } from "next/server";

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

    return created(tag);
  } catch (error) {
    return errorResponse(error);
  }
}
