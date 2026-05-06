import { prisma } from "@/server/db/client";
import { sendLaunchPrepEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

type LaunchPrepReminderResult = {
  sentCount: number;
  processedAt: string;
};

function formatLaunchWeekForEmail(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getLaunchBoardUrl() {
  return `${getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/launches/weekly`;
}

export async function sendDueLaunchPrepReminders(now = new Date()) {
  const reminderWindowStart = new Date(now.getTime() + ONE_DAY_IN_MS);
  const launches = await prisma.launch.findMany({
    where: {
      status: "APPROVED",
      preLaunchEmailSentAt: null,
      launchDate: {
        gt: now,
        lte: reminderWindowStart,
      },
    },
    include: {
      createdBy: {
        select: {
          email: true,
          name: true,
        },
      },
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
    orderBy: [{ launchDate: "asc" }, { priorityWeight: "desc" }],
  });

  let sentCount = 0;
  const launchBoardUrl = getLaunchBoardUrl();

  for (const launch of launches) {
    const recipient = launch.tool.owner?.email ? launch.tool.owner : launch.createdBy;

    if (!recipient.email) {
      continue;
    }

    try {
      await sendLaunchPrepEmailMessage({
        to: recipient.email,
        name: recipient.name,
        launchBoardUrl,
        toolName: launch.tool.name,
        launchDate: formatLaunchWeekForEmail(launch.launchDate),
      });
    } catch (error) {
      console.error("[shipboost launch prep reminder:error]", {
        launchId: launch.id,
        toolId: launch.toolId,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    await prisma.launch.update({
      where: {
        id: launch.id,
      },
      data: {
        preLaunchEmailSentAt: now,
      },
    });

    sentCount += 1;
  }

  return {
    sentCount,
    processedAt: now.toISOString(),
  } satisfies LaunchPrepReminderResult;
}
