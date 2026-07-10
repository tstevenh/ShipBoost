import type { NextRequest } from "next/server";

import { getCachedLaunchBoard } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { launchesQuerySchema } from "@/server/validators/launch";

export async function GET(request: NextRequest) {
  try {
    getEnv();

    const query = launchesQuerySchema.parse({
      board: request.nextUrl.searchParams.get("board") ?? undefined,
    });

    const launches = await getCachedLaunchBoard(query.board);
    return ok(launches);
  } catch (error) {
    return errorResponse(error);
  }
}
