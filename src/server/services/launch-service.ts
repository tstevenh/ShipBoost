import { subDays } from "@/server/services/time";
import { prisma } from "@/server/db/client";
import { sendLaunchLiveEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { getPublicLaunchWhere } from "@/server/services/public-tool-visibility";

export async function listLaunchBoard(
  board: "daily" | "weekly" | "monthly",
  options?: { viewerUserId?: string | null },
) {
  const now = new Date();
  const windowStart =
    board === "daily"
      ? subDays(now, 1)
      : board === "weekly"
        ? subDays(now, 7)
        : subDays(now, 30);

  const launches = await prisma.launch.findMany({
    where: {
      launchDate: {
        gte: windowStart,
        lte: now,
      },
      ...getPublicLaunchWhere(now),
    },
    include: {
      tool: {
        include: {
          logoMedia: true,
          _count: {
            select: {
              toolVotes: true,
            },
          },
          toolCategories: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: [{ priorityWeight: "desc" }, { launchDate: "desc" }],
  });

  const viewerVotes = options?.viewerUserId
    ? await prisma.toolVote.findMany({
        where: {
          userId: options.viewerUserId,
          toolId: {
            in: launches.map((launch) => launch.toolId),
          },
        },
        select: {
          toolId: true,
        },
      })
    : [];
  const viewerVotedToolIds = new Set(viewerVotes.map((vote) => vote.toolId));

  return launches.map((launch) => ({
    ...launch,
    tool: {
      ...launch.tool,
      upvoteCount: launch.tool._count.toolVotes,
      hasUpvoted: viewerVotedToolIds.has(launch.toolId),
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
