import { subDays } from "@/server/services/time";
import { prisma } from "@/server/db/client";
import { sendLaunchLiveEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";

export async function listLaunchBoard(board: "daily" | "weekly" | "monthly") {
  const now = new Date();
  const windowStart =
    board === "daily"
      ? subDays(now, 1)
      : board === "weekly"
        ? subDays(now, 7)
        : subDays(now, 30);

  return prisma.launch.findMany({
    where: {
      launchDate: {
        gte: windowStart,
        lte: now,
      },
      status: {
        in: ["LIVE", "ENDED"],
      },
    },
    include: {
      tool: {
        include: {
          logoMedia: true,
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
