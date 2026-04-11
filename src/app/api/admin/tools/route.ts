import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import {
  createAdminTool,
  listAdminTools,
} from "@/server/services/tool-service";
import {
  adminToolCreateSchema,
  adminToolListQuerySchema,
} from "@/server/validators/tool";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const query = adminToolListQuerySchema.parse({
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      moderationStatus:
        request.nextUrl.searchParams.get("moderationStatus") ?? undefined,
      publicationStatus:
        request.nextUrl.searchParams.get("publicationStatus") ?? undefined,
    });

    const tools = await listAdminTools(query);
    return ok(tools);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const body = adminToolCreateSchema.parse(await request.json());
    const tool = await createAdminTool(body);
    revalidateAllPublicContent();

    return created(tool);
  } catch (error) {
    return errorResponse(error);
  }
}
