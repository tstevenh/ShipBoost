import type { NextRequest } from "next/server";
import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { errorResponse, ok } from "@/server/http/response";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const rewards = await prisma.streakReward.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
    });
    return ok(
      rewards.map((r) => ({
        id: r.id,
        code: r.code,
        percentOff: r.percentOff,
        productScope: r.productScope,
        source: r.source,
        unlockedAt: r.unlockedAt.toISOString(),
        redeemedAt: r.redeemedAt?.toISOString() ?? null,
      })),
    );
  } catch (err) {
    return errorResponse(err);
  }
}
