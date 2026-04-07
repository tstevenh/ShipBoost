import type { NextRequest } from "next/server";

import { requireAdmin } from "@/server/auth/request-context";
import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import {
  createCategory,
  listCategories,
} from "@/server/services/catalog-service";
import { categoryCreateSchema } from "@/server/validators/catalog";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const categories = await listCategories();
    return ok(categories);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    getEnv();

    const body = categoryCreateSchema.parse(await request.json());
    const category = await createCategory(body);

    return created(category);
  } catch (error) {
    return errorResponse(error);
  }
}
