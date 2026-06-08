import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { publicLaunchCardSelect } from "@/server/db/public-selects";
import { sendLaunchLiveEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { buildLaunchKit } from "@/lib/distribution/launch-kit";
import {
  getLaunchBoardWindow,
  getLaunchpadGoLiveAtUtc,
  getLaunchWeekStart,
} from "@/server/services/launch-scheduling";
import {
  getPublicLaunchBoardWhere,
} from "@/server/services/public-tool-visibility";
import { addUtcDays, subDays } from "@/server/services/time";
import { listToolUpvoteCounts } from "@/server/services/upvote-service";

type PublicLaunchRecord = Prisma.LaunchGetPayload<{
  select: typeof publicLaunchCardSelect;
}>;

type RankedLaunchRecord = PublicLaunchRecord & {
  boardVoteCount: number;
};

function getLaunchTierOrder(launchType: RankedLaunchRecord["launchType"]) {
  if (launchType === "FEATURED") {
    return 0;
  }

  if (launchType === "FREE") {
    return 1;
  }

  return 2;
}

function compareLaunchPriority(
  left: RankedLaunchRecord,
  right: RankedLaunchRecord,
) {
  const launchTierDifference =
    getLaunchTierOrder(left.launchType) - getLaunchTierOrder(right.launchType);

  if (launchTierDifference !== 0) {
    return launchTierDifference;
  }

  const createdAtDifference =
    left.createdAt.getTime() - right.createdAt.getTime();

  if (createdAtDifference !== 0) {
    return createdAtDifference;
  }

  return left.launchDate.getTime() - right.launchDate.getTime();
}

export function rankLaunchBoardLaunches(launches: RankedLaunchRecord[]) {
  if (launches.length <= 1) {
    return launches;
  }

  const byVotes = [...launches].sort((left, right) => {
    const voteDifference = right.boardVoteCount - left.boardVoteCount;

    if (voteDifference !== 0) {
      return voteDifference;
    }

    return compareLaunchPriority(left, right);
  });
  const topLaunchIds = new Set(byVotes.slice(0, 3).map((launch) => launch.id));
  const remainingLaunches = launches
    .filter((launch) => !topLaunchIds.has(launch.id))
    .sort((left, right) => {
      const tierDifference =
        getLaunchTierOrder(left.launchType) -
        getLaunchTierOrder(right.launchType);

      if (tierDifference !== 0) {
        return tierDifference;
      }

      const voteDifference = right.boardVoteCount - left.boardVoteCount;

      if (voteDifference !== 0) {
        return voteDifference;
      }

      return compareLaunchPriority(left, right);
    });

  return [...byVotes.slice(0, 3), ...remainingLaunches];
}

async function listRankedLaunchesForWindow(input: {
  windowStart: Date;
  windowEnd: Date;
  now?: Date;
  includeWindowEnd?: boolean;
}) {
  const now = input.now ?? new Date();
  const launches = await prisma.launch.findMany({
    where: {
      launchDate: {
        gte: input.windowStart,
        ...(input.includeWindowEnd === false
          ? { lt: input.windowEnd }
          : { lte: input.windowEnd }),
      },
      ...getPublicLaunchBoardWhere(now),
    },
    select: publicLaunchCardSelect,
  });

  if (launches.length === 0) {
    return [];
  }

  const launchToolIds = launches.map((launch) => launch.toolId);
  const [boardVoteCounts, totalVoteCountByToolId] = await Promise.all([
    prisma.toolVote.groupBy({
      by: ["toolId"],
      where: {
        toolId: {
          in: launchToolIds,
        },
        createdAt: {
          gte: input.windowStart,
          ...(input.includeWindowEnd === false
            ? { lt: input.windowEnd }
            : { lte: input.windowEnd }),
        },
      },
      _sum: {
        weight: true,
      },
    }),
    listToolUpvoteCounts(launchToolIds),
  ]);
  const boardVoteCountByToolId = new Map(
    boardVoteCounts.map((voteCount) => [
      voteCount.toolId,
      voteCount._sum.weight ?? 0,
    ]),
  );
  const rankedLaunches = rankLaunchBoardLaunches(
    launches.map((launch) => ({
      ...launch,
      boardVoteCount: boardVoteCountByToolId.get(launch.toolId) ?? 0,
    })),
  );

  return rankedLaunches.map((launch) => {
    const { boardVoteCount, ...launchWithoutBoardVoteCount } = launch;
    void boardVoteCount;

    return {
      ...launchWithoutBoardVoteCount,
      tool: {
        ...launchWithoutBoardVoteCount.tool,
        upvoteCount: totalVoteCountByToolId.get(launch.toolId) ?? 0,
        hasUpvoted: false,
      },
    };
  });
}

export async function listLaunchBoard(
  board: "weekly" | "monthly" | "yearly",
) {
  const now = new Date();
  const { windowStart, windowEnd } = getLaunchBoardWindow(board, now);

  return listRankedLaunchesForWindow({ windowStart, windowEnd, now });
}

export async function listCurrentWeekBoardToolIds(
  now = new Date(),
): Promise<string[]> {
  const { windowStart, windowEnd } = getLaunchBoardWindow("weekly", now);

  const launches = await prisma.launch.findMany({
    where: {
      launchDate: { gte: windowStart, lte: windowEnd },
      ...getPublicLaunchBoardWhere(now),
    },
    select: { toolId: true },
  });

  return [...new Set(launches.map((launch) => launch.toolId))];
}

export async function getPreviousWeeklyTopWinner(now = new Date()) {
  const goLiveAt = getLaunchpadGoLiveAtUtc();
  const currentWeekStart = getLaunchWeekStart(now, { goLiveAt });
  const previousWeekStart = addUtcDays(currentWeekStart, -7);

  if (previousWeekStart.getTime() < goLiveAt.getTime()) {
    return null;
  }

  const previousWeekLaunches = await listRankedLaunchesForWindow({
    windowStart: previousWeekStart,
    windowEnd: currentWeekStart,
    now,
    includeWindowEnd: false,
  });

  return previousWeekLaunches[0] ?? null;
}

export async function listPastLaunches(options?: { limit?: number }) {
  const now = new Date();
  const windowEnd = subDays(now, 1); // Older than 24 hours

  const launches = await prisma.launch.findMany({
    where: {
      launchDate: {
        lte: windowEnd,
      },
      ...getPublicLaunchBoardWhere(now),
    },
    select: publicLaunchCardSelect,
    orderBy: [{ launchDate: "desc" }, { priorityWeight: "desc" }],
    take: options?.limit ?? 10,
  });

  const voteCountByToolId = await listToolUpvoteCounts(
    launches.map((launch) => launch.toolId),
  );

  return launches.map((launch) => ({
    ...launch,
    tool: {
      ...launch.tool,
      upvoteCount: voteCountByToolId.get(launch.toolId) ?? 0,
      hasUpvoted: false,
    },
  }));
}

export async function publishDueLaunches(now = new Date()) {
  const dueLaunches = await prisma.launch.findMany({
    where: {
      status: "APPROVED",
      launchDate: {
        lte: now,
      },
    },
    include: {
      tool: {
        include: {
          owner: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ priorityWeight: "desc" }, { launchDate: "asc" }],
  });

  if (dueLaunches.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const launch of dueLaunches) {
        await tx.launch.update({
          where: { id: launch.id },
          data: {
            status: "LIVE",
          },
        });

        await tx.tool.update({
          where: { id: launch.toolId },
          data: {
            moderationStatus: "APPROVED",
            publicationStatus: "PUBLISHED",
            currentLaunchType: launch.launchType,
          },
        });
      }
    });
  }

  // Send the "launch is live" email to every LIVE launch that hasn't been
  // emailed yet (the ones just flipped + any whose send previously failed).
  // Sequential + per-launch flag so a failed send is logged and retried on the
  // next run instead of being silently lost (the old allSettled burst dropped
  // sends when many launches went live on the same day).
  const emailedCount = await sendPendingLaunchLiveEmails(now);

  return {
    publishedCount: dueLaunches.length,
    emailedCount,
    launches: dueLaunches.map((launch) => ({
      id: launch.id,
      toolId: launch.toolId,
      toolName: launch.tool.name,
      toolSlug: launch.tool.slug,
      launchType: launch.launchType,
      launchDate: launch.launchDate.toISOString(),
    })),
    processedAt: now.toISOString(),
  };
}

async function sendPendingLaunchLiveEmails(now: Date) {
  const pending = await prisma.launch.findMany({
    where: { status: "LIVE", liveEmailSentAt: null },
    include: {
      tool: {
        include: { owner: { select: { email: true, name: true } } },
      },
    },
    orderBy: [{ launchDate: "asc" }],
  });

  if (pending.length === 0) {
    return 0;
  }

  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const dashboardUrl = `${appUrl}/dashboard`;
  let emailed = 0;

  for (const launch of pending) {
    const email = launch.tool.owner?.email;
    if (!email) {
      continue;
    }

    try {
      const kit = buildLaunchKit({
        appUrl,
        slug: launch.tool.slug,
        toolId: launch.toolId,
        name: launch.tool.name,
        tagline: launch.tool.tagline ?? "",
      });

      await sendLaunchLiveEmailMessage({
        to: email,
        name: launch.tool.owner?.name,
        dashboardUrl,
        toolName: launch.tool.name,
        launchDate: new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(launch.launchDate),
        launchKit: {
          listingUrl: kit.listingUrl,
          twitterShareUrl: kit.shareUrls.twitter,
          linkedinShareUrl: kit.shareUrls.linkedin,
          launchKitUrl: `${appUrl}/dashboard/tools/${launch.toolId}`,
        },
      });
    } catch (error) {
      console.error("[shipboost launch live email:error]", {
        launchId: launch.id,
        toolId: launch.toolId,
        error: error instanceof Error ? error.message : String(error),
      });
      continue; // leave liveEmailSentAt null so the next run retries this one
    }

    await prisma.launch.update({
      where: { id: launch.id },
      data: { liveEmailSentAt: now },
    });
    emailed += 1;
  }

  return emailed;
}

export type LaunchBoardEntry = Awaited<ReturnType<typeof listLaunchBoard>>[number];
export type PreviousWeeklyTopWinner = NonNullable<
  Awaited<ReturnType<typeof getPreviousWeeklyTopWinner>>
>;
