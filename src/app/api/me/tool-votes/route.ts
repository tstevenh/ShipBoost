import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import {
  getDailyVotesRemaining,
  listUserUpvotedToolIds,
} from "@/server/services/upvote-service";

function getRequestedToolIds(request: NextRequest) {
  const rawToolIds = [
    ...request.nextUrl.searchParams.getAll("toolId"),
    ...(request.nextUrl.searchParams.get("toolIds")?.split(",") ?? []),
  ];

  return Array.from(
    new Set(
      rawToolIds
        .map((toolId) => toolId.trim())
        .filter(Boolean),
    ),
  );
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const toolIds = getRequestedToolIds(request);
    const [dailyVotesRemaining, upvotedToolIds] = await Promise.all([
      getDailyVotesRemaining(session.user.id),
      listUserUpvotedToolIds(toolIds, session.user.id),
    ]);

    return ok({
      dailyVotesRemaining,
      upvotedToolIds: Array.from(upvotedToolIds),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
