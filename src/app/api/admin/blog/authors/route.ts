import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listBlogAuthors } from "@/server/services/blog-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const authors = await listBlogAuthors();
    return ok(authors);
  } catch (error) {
    return errorResponse(error);
  }
}
