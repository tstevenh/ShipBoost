import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { errorResponse, ok } from "@/server/http/response";

const Body = z.object({ hideFromLeaderboard: z.boolean() });

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = Body.parse(await request.json());
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hideFromLeaderboard: body.hideFromLeaderboard },
    });
    return ok({ updated: true });
  } catch (err) {
    return errorResponse(err);
  }
}
