import { prisma } from "@/server/db/client";
import { getLaunchWeekStart, UTC_WEEK_IN_DAYS } from "@/server/services/launch-scheduling";
import { addUtcDays, startOfUtcDay } from "@/server/services/time";

type LaunchStatus = "PENDING" | "APPROVED" | "LIVE" | "ENDED";

function compareLaunchStatus(left: LaunchStatus, right: LaunchStatus) {
  const statusOrder: Record<LaunchStatus, number> = {
    LIVE: 0,
    APPROVED: 1,
    PENDING: 2,
    ENDED: 3,
  };

  return statusOrder[left] - statusOrder[right];
}

function getUtcMonthStart(value: Date) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1));
}

function addUtcMonths(value: Date, amount: number) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1),
  );
}

export async function listAdminLaunchMonths() {
  const launches = await prisma.launch.findMany({
    where: {
      status: {
        in: ["PENDING", "APPROVED", "LIVE", "ENDED"],
      },
    },
    include: {
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          logoMedia: {
            select: {
              url: true,
            },
          },
          submissions: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              submissionType: true,
              reviewStatus: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ launchDate: "asc" }, { priorityWeight: "desc" }, { createdAt: "asc" }],
  });

  const groupedMonths = new Map<
    string,
    {
      monthStart: string;
      monthEnd: string;
      weeks: Map<
        string,
        {
          weekStart: string;
          weekEnd: string;
          entries: Array<{
            id: string;
            toolId: string;
            toolSlug: string;
            toolName: string;
            toolLogoUrl: string | null;
            launchType: "FREE" | "FEATURED" | "RELAUNCH";
            status: LaunchStatus;
            launchDate: string;
            priorityWeight: number;
            latestSubmission: {
              id: string;
              submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
              reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
              founderName: string | null;
              founderEmail: string;
            } | null;
          }>;
        }
      >;
    }
  >();

  for (const launch of launches) {
    const monthStart = getUtcMonthStart(launch.launchDate);
    const monthStartKey = monthStart.toISOString();
    const existingMonth = groupedMonths.get(monthStartKey) ?? {
      monthStart: monthStartKey,
      monthEnd: addUtcMonths(monthStart, 1).toISOString(),
      weeks: new Map(),
    };
    const weekStart = getLaunchWeekStart(launch.launchDate);
    const weekStartKey = weekStart.toISOString();
    const existingWeek = existingMonth.weeks.get(weekStartKey) ?? {
      weekStart: weekStartKey,
      weekEnd: addUtcDays(weekStart, UTC_WEEK_IN_DAYS).toISOString(),
      entries: [],
    };
    const latestSubmission = launch.tool.submissions[0] ?? null;

    existingWeek.entries.push({
      id: launch.id,
      toolId: launch.tool.id,
      toolSlug: launch.tool.slug,
      toolName: launch.tool.name,
      toolLogoUrl: launch.tool.logoMedia?.url ?? null,
      launchType: launch.launchType,
      status: launch.status as LaunchStatus,
      launchDate: launch.launchDate.toISOString(),
      priorityWeight: launch.priorityWeight,
      latestSubmission: latestSubmission
        ? {
            id: latestSubmission.id,
            submissionType: latestSubmission.submissionType,
            reviewStatus: latestSubmission.reviewStatus,
            founderName: latestSubmission.user.name,
            founderEmail: latestSubmission.user.email,
          }
        : null,
    });

    existingMonth.weeks.set(weekStartKey, existingWeek);
    groupedMonths.set(monthStartKey, existingMonth);
  }

  return [...groupedMonths.values()]
    .sort((left, right) => right.monthStart.localeCompare(left.monthStart))
    .map((month) => {
      const weeks = [...month.weeks.values()]
        .sort((left, right) => left.weekStart.localeCompare(right.weekStart))
        .map((week) => {
          const groupedDays = new Map<
            string,
            {
              date: string;
              entries: typeof week.entries;
            }
          >();

          const sortedEntries = [...week.entries].sort((left, right) => {
            const dateDifference =
              new Date(left.launchDate).getTime() - new Date(right.launchDate).getTime();

            if (dateDifference !== 0) {
              return dateDifference;
            }

            const statusDifference = compareLaunchStatus(left.status, right.status);

            if (statusDifference !== 0) {
              return statusDifference;
            }

            if (left.priorityWeight !== right.priorityWeight) {
              return right.priorityWeight - left.priorityWeight;
            }

            return left.toolName.localeCompare(right.toolName);
          });

          for (const entry of sortedEntries) {
            const dayKey = startOfUtcDay(new Date(entry.launchDate)).toISOString();
            const existingDay = groupedDays.get(dayKey) ?? {
              date: dayKey,
              entries: [],
            };

            existingDay.entries.push(entry);
            groupedDays.set(dayKey, existingDay);
          }

          return {
            weekStart: week.weekStart,
            weekEnd: week.weekEnd,
            launchCount: sortedEntries.length,
            days: [...groupedDays.values()].sort((left, right) =>
              left.date.localeCompare(right.date),
            ),
          };
        });

      return {
        monthStart: month.monthStart,
        monthEnd: month.monthEnd,
        launchCount: weeks.reduce((total, week) => total + week.launchCount, 0),
        weeks,
      };
    });
}
