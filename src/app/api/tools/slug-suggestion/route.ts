import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { createUniqueToolSlug } from "@/server/services/slug";

export async function GET(request: NextRequest) {
  try {
    getEnv();

    const value = request.nextUrl.searchParams.get("value")?.trim() ?? "";
    const slug = await createUniqueToolSlug(value || "tool");

    return ok({ slug });
  } catch (error) {
    return errorResponse(error);
  }
}
