import { prisma } from "@/server/db/client";
import { sendPremiumLaunchSpotlightReminderEmailMessage } from "@/server/email/transactional";
import { getDashboardUrl } from "@/server/services/submission-service-shared";

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

type DueReminderResult = {
  threeDaysBeforeCount: number;
  launchWeekStartCount: number;
};

type SpotlightReminderCandidate = {
  submissionId: string;
  launchDate: Date;
  stage: "THREE_DAYS_BEFORE" | "LAUNCH_WEEK_START";
  user: {
    email: string;
    name: string | null;
  };
  tool: {
    name: string;
  };
};

function getSpotlightDashboardUrl() {
  return `${getDashboardUrl()}?tab=submissions`;
}

function getReminderStage(input: {
  now: Date;
  launchDate: Date;
  reminderThreeDaysSentAt: Date | null;
  reminderLaunchWeekSentAt: Date | null;
}) {
  if (
    input.launchDate.getTime() <= input.now.getTime() &&
    !input.reminderLaunchWeekSentAt
  ) {
    return "LAUNCH_WEEK_START" as const;
  }

  if (
    input.launchDate.getTime() - THREE_DAYS_IN_MS <= input.now.getTime() &&
    !input.reminderThreeDaysSentAt
  ) {
    return "THREE_DAYS_BEFORE" as const;
  }

  return null;
}

export async function sendDuePremiumLaunchSpotlightReminders(now = new Date()) {
  const spotlightDashboardUrl = getSpotlightDashboardUrl();
  const briefs = await prisma.submissionSpotlightBrief.findMany({
    where: {
      status: {
        not: "PUBLISHED",
      },
      submission: {
        submissionType: "FEATURED_LAUNCH",
        paymentStatus: "PAID",
      },
    },
    select: {
      submissionId: true,
      reminderThreeDaysSentAt: true,
      reminderLaunchWeekSentAt: true,
      submission: {
        select: {
          preferredLaunchDate: true,
          user: {
            select: {
              email: true,
              name: true,
            },
          },
          tool: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  const dueReminders = briefs
    .map((brief) => {
      const launchDate = brief.submission.preferredLaunchDate;

      if (!launchDate) {
        return null;
      }

      const stage = getReminderStage({
        now,
        launchDate,
        reminderThreeDaysSentAt: brief.reminderThreeDaysSentAt,
        reminderLaunchWeekSentAt: brief.reminderLaunchWeekSentAt,
      });

      if (!stage) {
        return null;
      }

      return {
        submissionId: brief.submissionId,
        launchDate,
        stage,
        user: brief.submission.user,
        tool: brief.submission.tool,
      } satisfies SpotlightReminderCandidate;
    })
    .filter((candidate): candidate is SpotlightReminderCandidate => candidate !== null);

  let threeDaysBeforeCount = 0;
  let launchWeekStartCount = 0;

  for (const reminder of dueReminders) {
    try {
      await sendPremiumLaunchSpotlightReminderEmailMessage({
        to: reminder.user.email,
        name: reminder.user.name,
        toolName: reminder.tool.name,
        launchDate: new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(reminder.launchDate),
        dashboardUrl: spotlightDashboardUrl,
        stage: reminder.stage,
      });
    } catch (error) {
      console.error("[shipboost spotlight reminder:error]", {
        submissionId: reminder.submissionId,
        stage: reminder.stage,
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    await prisma.submissionSpotlightBrief.update({
      where: {
        submissionId: reminder.submissionId,
      },
      data:
        reminder.stage === "THREE_DAYS_BEFORE"
          ? {
              reminderThreeDaysSentAt: now,
            }
          : {
              reminderLaunchWeekSentAt: now,
            },
    });

    if (reminder.stage === "THREE_DAYS_BEFORE") {
      threeDaysBeforeCount += 1;
    } else {
      launchWeekStartCount += 1;
    }
  }

  return {
    threeDaysBeforeCount,
    launchWeekStartCount,
  } satisfies DueReminderResult;
}
