import { prisma } from "@/server/db/client";
import { addDays, startOfDay } from "@/server/services/time";

type LaunchSchedulingClient = {
  launch: {
    count: typeof prisma.launch.count;
  };
};

export const DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY = 5;

export async function scheduleNextFreeLaunchDate(
  db: LaunchSchedulingClient = prisma,
  options?: {
    dailySlots?: number;
    fromDate?: Date;
  },
) {
  const dailySlots = options?.dailySlots ?? DEFAULT_FREE_LAUNCH_SLOTS_PER_DAY;
  let cursor = startOfDay(options?.fromDate ?? new Date());

  for (let dayOffset = 0; dayOffset < 365; dayOffset += 1) {
    const nextDay = addDays(cursor, 1);
    const scheduledCount = await db.launch.count({
      where: {
        launchType: "FREE",
        status: {
          in: ["APPROVED", "LIVE"],
        },
        launchDate: {
          gte: cursor,
          lt: nextDay,
        },
      },
    });

    if (scheduledCount < dailySlots) {
      return cursor;
    }

    cursor = nextDay;
  }

  throw new Error("Unable to find a free launch slot within the next year.");
}
