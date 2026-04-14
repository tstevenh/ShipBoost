import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { revalidatePublicBlogContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import {
  createAdminBlogTag,
  listAdminBlogTags,
} from "@/server/services/blog-service";
import { blogTagCreateSchema } from "@/server/validators/blog";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const tags = await listAdminBlogTags();
    return ok(tags);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const body = blogTagCreateSchema.parse(await request.json());
    const tag = await createAdminBlogTag(body);
    revalidatePublicBlogContent();

    return created(tag);
  } catch (error) {
    return errorResponse(error);
  }
}
