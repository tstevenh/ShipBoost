import type { NextRequest } from "next/server";
import { requireSession } from "@/server/auth/session";
import { getStreakSnapshot } from "@/server/services/streak-service";
import { prisma } from "@/server/db/client";
import { startOfUtcDay } from "@/server/services/time";
import { errorResponse, ok } from "@/server/http/response";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const snapshot = await getStreakSnapshot(session.user.id);

    const todayRoll = snapshot.lotteryUnlocked
      ? await prisma.lotteryRoll.findUnique({
          where: {
            userId_rollDate: {
              userId: session.user.id,
              rollDate: startOfUtcDay(new Date()),
            },
          },
          include: { reward: true },
        })
      : null;

    return ok({
      ...snapshot,
      todayRoll: todayRoll
        ? {
            outcome: todayRoll.outcome,
            reward: todayRoll.reward
              ? {
                  id: todayRoll.reward.id,
                  code: todayRoll.reward.code,
                  percentOff: todayRoll.reward.percentOff,
                  productScope: todayRoll.reward.productScope,
                }
              : null,
          }
        : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
