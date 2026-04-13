import { getEnv } from "@/server/env";
import { prisma } from "@/server/db/client";
import { addUtcDays, startOfUtcDay, subDays } from "@/server/services/time";

type LaunchSchedulingClient = {
  launch: {
    count: typeof prisma.launch.count;
  };
};

export const UTC_WEEK_IN_DAYS = 7;
export const UTC_WEEK_IN_MS = UTC_WEEK_IN_DAYS * 24 * 60 * 60 * 1000;

export const DEFAULT_FREE_LAUNCH_SLOTS_PER_WEEK = 10;
export const DEFAULT_PREMIUM_LAUNCH_WEEKS_AHEAD = 12;

export function getLaunchpadGoLiveAtUtc() {
  return startOfUtcDay(new Date(getEnv().LAUNCHPAD_GO_LIVE_AT));
}

export function getLaunchWeekStart(
  date: Date,
  options?: {
    goLiveAt?: Date;
  },
) {
  const goLiveAt = startOfUtcDay(options?.goLiveAt ?? getLaunchpadGoLiveAtUtc());

  if (date.getTime() <= goLiveAt.getTime()) {
    return goLiveAt;
  }

  const cursor = startOfUtcDay(date);
  const elapsedWeeks = Math.floor(
    (cursor.getTime() - goLiveAt.getTime()) / UTC_WEEK_IN_MS,
  );

  return addUtcDays(goLiveAt, Math.max(0, elapsedWeeks) * UTC_WEEK_IN_DAYS);
}

export function getNextSelectableLaunchWeekStart(
  date: Date,
  options?: {
    goLiveAt?: Date;
  },
) {
  const weekStart = getLaunchWeekStart(date, options);

  if (weekStart.getTime() < date.getTime()) {
    return addUtcDays(weekStart, UTC_WEEK_IN_DAYS);
  }

  return weekStart;
}

export function isAnchoredLaunchWeekStart(
  date: Date,
  options?: {
    goLiveAt?: Date;
  },
) {
  const goLiveAt = startOfUtcDay(options?.goLiveAt ?? getLaunchpadGoLiveAtUtc());
  const normalized = startOfUtcDay(date);

  return (
    normalized.getTime() >= goLiveAt.getTime() &&
    (normalized.getTime() - goLiveAt.getTime()) % UTC_WEEK_IN_MS === 0
  );
}

export function listSelectableLaunchWeeks(options?: {
  count?: number;
  fromDate?: Date;
  goLiveAt?: Date;
}) {
  const count = options?.count ?? DEFAULT_PREMIUM_LAUNCH_WEEKS_AHEAD;
  const firstWeekStart = getNextSelectableLaunchWeekStart(
    options?.fromDate ?? new Date(),
    options,
  );

  return Array.from({ length: count }, (_, index) =>
    addUtcDays(firstWeekStart, index * UTC_WEEK_IN_DAYS),
  );
}

export function getLaunchBoardWindow(
  board: "weekly" | "monthly" | "yearly",
  now = new Date(),
  options?: {
    goLiveAt?: Date;
  },
) {
  if (board === "weekly") {
    return {
      windowStart: getLaunchWeekStart(now, options),
      windowEnd: now,
    };
  }

  return {
    windowStart: board === "monthly" ? subDays(now, 30) : subDays(now, 365),
    windowEnd: now,
  };
}

export async function scheduleNextFreeLaunchDate(
  db: LaunchSchedulingClient = prisma,
  options?: {
    weeklySlots?: number;
    fromDate?: Date;
    goLiveAt?: Date;
  },
) {
  const weeklySlots =
    options?.weeklySlots ?? getEnv().FREE_LAUNCH_SLOTS_PER_WEEK ?? DEFAULT_FREE_LAUNCH_SLOTS_PER_WEEK;
  const goLiveAt = startOfUtcDay(options?.goLiveAt ?? getLaunchpadGoLiveAtUtc());
  const cursor = startOfUtcDay(
    new Date(Math.max((options?.fromDate ?? new Date()).getTime(), goLiveAt.getTime())),
  );
  const elapsedWeeks = Math.floor(
    (cursor.getTime() - goLiveAt.getTime()) / UTC_WEEK_IN_MS,
  );
  const firstWeekStart = addUtcDays(goLiveAt, elapsedWeeks * UTC_WEEK_IN_DAYS);

  for (let weekOffset = 0; weekOffset < 104; weekOffset += 1) {
    const weekStart = addUtcDays(
      firstWeekStart,
      weekOffset * UTC_WEEK_IN_DAYS,
    );
    const weekEnd = addUtcDays(weekStart, UTC_WEEK_IN_DAYS);
    const scheduledCount = await db.launch.count({
      where: {
        launchType: "FREE",
        status: {
          in: ["APPROVED", "LIVE"],
        },
        launchDate: {
          gte: weekStart,
          lt: weekEnd,
        },
      },
    });

    if (scheduledCount < weeklySlots) {
      return weekStart;
    }
  }

  throw new Error("Unable to find a free launch week within the next two years.");
}
