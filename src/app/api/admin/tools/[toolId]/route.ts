import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { updateAdminTool } from "@/server/services/tool-service";
import { adminToolUpdateSchema } from "@/server/validators/tool";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(request);
    getEnv();

    const { toolId } = await context.params;
    const body = adminToolUpdateSchema.parse(await request.json());
    const tool = await updateAdminTool(toolId, body);
    revalidateAllPublicContent();

    return ok(tool);
  } catch (error) {
    return errorResponse(error);
  }
}
