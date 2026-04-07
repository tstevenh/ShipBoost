import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listFounderTools } from "@/server/services/tool-service";

export async function GET(request: NextRequest) {
  try {
    getEnv();
    const session = await requireSession(request);

    const tools = await listFounderTools(session.user.id);
    return ok(tools);
  } catch (error) {
    return errorResponse(error);
  }
}
