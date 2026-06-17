import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { errorResponse, ok } from "@/server/http/response";
import {
  getDailyVotesRemaining,
  listToolUpvoteCounts,
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
    // Role is already on the session — pass it so getDailyVotesRemaining skips
    // its own `user` lookup on this per-page-load endpoint.
    const role = session.user.role === "ADMIN" ? "ADMIN" : "FOUNDER";
    const [dailyVotesRemaining, upvotedToolIds, upvoteCountByToolId] =
      await Promise.all([
        getDailyVotesRemaining(session.user.id, undefined, role),
        listUserUpvotedToolIds(toolIds, session.user.id),
        listToolUpvoteCounts(toolIds),
      ]);

    return ok({
      dailyVotesRemaining,
      upvotedToolIds: Array.from(upvotedToolIds),
      upvoteCountByToolId: Object.fromEntries(upvoteCountByToolId),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
