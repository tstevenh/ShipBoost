import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { publicLaunchCardSelect } from "@/server/db/public-selects";
import { sendLaunchLiveEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { getLaunchBoardWindow } from "@/server/services/launch-scheduling";
import { getPublicLaunchWhere } from "@/server/services/public-tool-visibility";
import { subDays } from "@/server/services/time";

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

  const leaderboard = [...launches].sort((left, right) => {
    const voteDifference = right.boardVoteCount - left.boardVoteCount;

    if (voteDifference !== 0) {
      return voteDifference;
    }

    return compareLaunchPriority(left, right);
  });
  const topLaunchIds = new Set(leaderboard.slice(0, 3).map((launch) => launch.id));
  const remainingLaunches = launches
    .filter((launch) => !topLaunchIds.has(launch.id))
    .sort(compareLaunchPriority);

  return [...leaderboard.slice(0, 3), ...remainingLaunches];
}

export async function listLaunchBoard(
  board: "weekly" | "monthly" | "yearly",
) {
  const now = new Date();
  const { windowStart, windowEnd } = getLaunchBoardWindow(board, now);

  const launches = await prisma.launch.findMany({
    where: {
      launchDate: {
        gte: windowStart,
        lte: windowEnd,
      },
      ...getPublicLaunchWhere(now),
    },
    select: publicLaunchCardSelect,
  });

  if (launches.length === 0) {
    return [];
  }

  const boardVoteCounts = await prisma.toolVote.groupBy({
    by: ["toolId"],
    where: {
      toolId: {
        in: launches.map((launch) => launch.toolId),
      },
      createdAt: {
        gte: windowStart,
        lte: windowEnd,
      },
    },
    _count: {
      _all: true,
    },
  });
  const boardVoteCountByToolId = new Map(
    boardVoteCounts.map((voteCount) => [voteCount.toolId, voteCount._count._all]),
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
        upvoteCount: launchWithoutBoardVoteCount.tool._count.toolVotes,
        hasUpvoted: false,
      },
    };
  });
}

export async function listPastLaunches(options?: { limit?: number }) {
  const now = new Date();
  const windowEnd = subDays(now, 1); // Older than 24 hours

  const launches = await prisma.launch.findMany({
    where: {
      launchDate: {
        lte: windowEnd,
      },
      ...getPublicLaunchWhere(now),
    },
    select: publicLaunchCardSelect,
    orderBy: [{ launchDate: "desc" }, { priorityWeight: "desc" }],
    take: options?.limit ?? 10,
  });

  return launches.map((launch) => ({
    ...launch,
    tool: {
      ...launch.tool,
      upvoteCount: launch.tool._count.toolVotes,
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

  if (dueLaunches.length === 0) {
    return {
      publishedCount: 0,
      launches: [],
      processedAt: now.toISOString(),
    };
  }

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

  const dashboardUrl = `${getEnv().NEXT_PUBLIC_APP_URL}/dashboard`;

  await Promise.allSettled(
    dueLaunches.map(async (launch) => {
      if (!launch.tool.owner?.email) {
        return;
      }

      await sendLaunchLiveEmailMessage({
        to: launch.tool.owner.email,
        name: launch.tool.owner.name,
        dashboardUrl,
        toolName: launch.tool.name,
        launchDate: new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(launch.launchDate),
      });
    }),
  );

  return {
    publishedCount: dueLaunches.length,
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

export type LaunchBoardEntry = Awaited<ReturnType<typeof listLaunchBoard>>[number];
