import { prisma } from "@/server/db/client";
import { sendLaunchPrepEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { buildLaunchKit } from "@/lib/distribution/launch-kit";

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
  const appUrl = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  for (const launch of launches) {
    const recipient = launch.tool.owner?.email ? launch.tool.owner : launch.createdBy;

    if (!recipient.email) {
      continue;
    }

    const kit = buildLaunchKit({
      appUrl,
      slug: launch.tool.slug,
      toolId: launch.toolId,
      name: launch.tool.name,
      tagline: launch.tool.tagline ?? "",
    });

    try {
      await sendLaunchPrepEmailMessage({
        to: recipient.email,
        name: recipient.name,
        launchBoardUrl,
        toolName: launch.tool.name,
        launchDate: formatLaunchWeekForEmail(launch.launchDate),
        launchKit: {
          listingUrl: kit.listingUrl,
          twitterShareUrl: kit.shareUrls.twitter,
          linkedinShareUrl: kit.shareUrls.linkedin,
          launchKitUrl: `${appUrl}/dashboard/tools/${launch.toolId}`,
        },
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
