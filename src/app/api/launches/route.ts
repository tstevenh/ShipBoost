import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { listLaunchBoard } from "@/server/services/launch-service";
import { launchesQuerySchema } from "@/server/validators/launch";

export async function GET(request: NextRequest) {
  try {
    getEnv();

    const query = launchesQuerySchema.parse({
      board: request.nextUrl.searchParams.get("board") ?? undefined,
    });

    const launches = await listLaunchBoard(query.board);
    return ok(launches);
  } catch (error) {
    return errorResponse(error);
  }
}
