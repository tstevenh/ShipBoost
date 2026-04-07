import type { NextRequest } from "next/server";

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

    return ok({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
