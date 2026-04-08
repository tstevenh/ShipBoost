import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { searchPublishedTools } from "@/server/services/tool-service";
import { publicToolSearchQuerySchema } from "@/server/validators/public-search";

export async function GET(request: NextRequest) {
  try {
    getEnv();

    const query = publicToolSearchQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });

    const results = await searchPublishedTools(query.q);
    return ok(results);
  } catch (error) {
    return errorResponse(error);
  }
}
