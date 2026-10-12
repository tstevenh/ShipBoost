import type { Prisma } from "@prisma/client";

import type { LaunchVideoBrief, LaunchVideoScreenshot } from "@/lib/launch-video";
import { prisma } from "@/server/db/client";
import { sendLaunchVideoBriefReminderEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import {
  type AuthenticatedFounder,
  sendProductEmailSafely,
} from "@/server/services/submission-service-shared";
import type { LaunchVideoBriefInput } from "@/server/validators/launch-video-brief";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Premium: remind 4 days before the launch week. Standalone: a day after payment.
const PREMIUM_REMINDER_LEAD_DAYS = 4;
const STANDALONE_REMINDER_DELAY_DAYS = 1;

const orderWithToolInclude = {
  submission: { select: { tool: { select: { name: true } } } },
} satisfies Prisma.LaunchVideoOrderInclude;

type OrderWithTool = Prisma.LaunchVideoOrderGetPayload<{
  include: typeof orderWithToolInclude;
}>;

export function getLaunchVideoBriefUrl(submissionId: string) {
  const base = getEnv().NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/dashboard/submissions/${submissionId}/launch-video`;
}

function readScreenshots(value: Prisma.JsonValue | null): LaunchVideoScreenshot[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { role, url, publicId } = item as Record<string, unknown>;
    if ((role !== "before" && role !== "after") || typeof url !== "string") return [];
    return [{ role, url, publicId: typeof publicId === "string" ? publicId : "" }];
  });
}

function toBrief(order: OrderWithTool): LaunchVideoBrief {
  return {
    submissionId: order.submissionId,
    toolName: order.submission.tool.name,
    status: order.status === "DELIVERED" ? "DELIVERED" : "PAID",
    standalone: order.standalone,
    launchWeekStart: order.launchWeekStart.toISOString(),
    deliverBy: order.deliverBy?.toISOString() ?? null,
    focusNote: order.focusNote ?? "",
    highlightClaim: order.highlightClaim ?? "",
    avoidNote: order.avoidNote ?? "",
    screenshots: readScreenshots(order.screenshots),
    briefUpdatedAt: order.briefUpdatedAt?.toISOString() ?? null,
  };
}

async function findPaidOrderForFounder(submissionId: string, founder: AuthenticatedFounder) {
  const order = await prisma.launchVideoOrder.findFirst({
    where: {
      submissionId,
      status: { in: ["PAID", "DELIVERED"] },
      submission: { userId: founder.id },
    },
    orderBy: { createdAt: "desc" },
    include: orderWithToolInclude,
  });

  if (!order) {
    throw new AppError(404, "There is no launch video order for this submission.");
  }

  return order;
}

/** Screenshots must come from our own Cloudinary uploads, never an arbitrary URL. */
function assertOwnCloudinaryUrls(screenshots: LaunchVideoScreenshot[]) {
  const cloudName = getEnv().CLOUDINARY_CLOUD_NAME;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;

  for (const screenshot of screenshots) {
    if (!cloudName || !screenshot.url.startsWith(prefix)) {
      throw new AppError(400, "Upload screenshots with the uploader on this page.");
    }
  }
}

export async function getFounderLaunchVideoBrief(
  submissionId: string,
  founder: AuthenticatedFounder,
) {
  return toBrief(await findPaidOrderForFounder(submissionId, founder));
}

export async function saveFounderLaunchVideoBrief(
  submissionId: string,
  founder: AuthenticatedFounder,
  input: LaunchVideoBriefInput,
) {
  const order = await findPaidOrderForFounder(submissionId, founder);

  if (order.status === "DELIVERED") {
    throw new AppError(409, "This video has been delivered, so the brief can no longer change.");
  }

  assertOwnCloudinaryUrls(input.screenshots);

  const updated = await prisma.launchVideoOrder.update({
    where: { id: order.id },
    data: {
      focusNote: input.focusNote || null,
      highlightClaim: input.highlightClaim || null,
      avoidNote: input.avoidNote || null,
      screenshots: input.screenshots,
      briefUpdatedAt: new Date(),
    },
    include: orderWithToolInclude,
  });

  return toBrief(updated);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function isReminderDue(
  order: { standalone: boolean; launchWeekStart: Date; paidAt: Date | null },
  now: Date,
) {
  if (order.standalone) {
    return (
      order.paidAt !== null &&
      now.getTime() >= order.paidAt.getTime() + STANDALONE_REMINDER_DELAY_DAYS * DAY_IN_MS
    );
  }

  return (
    now.getTime() >= order.launchWeekStart.getTime() - PREMIUM_REMINDER_LEAD_DAYS * DAY_IN_MS
  );
}

/** One reminder per order, only while the brief is untouched and the video is not due yet. */
export async function sendDueLaunchVideoBriefReminders(now = new Date()) {
  const candidates = await prisma.launchVideoOrder.findMany({
    where: {
      status: "PAID",
      briefUpdatedAt: null,
      briefReminderSentAt: null,
      deliverBy: { gt: now },
    },
    include: { submission: { select: { id: true, user: true, tool: { select: { name: true } } } } },
  });

  let sent = 0;

  for (const order of candidates) {
    if (!isReminderDue(order, now)) continue;

    // Claim the reminder first so overlapping cron runs never send it twice.
    const claimed = await prisma.launchVideoOrder.updateMany({
      where: { id: order.id, briefReminderSentAt: null },
      data: { briefReminderSentAt: now },
    });
    if (claimed.count === 0) continue;

    const { user, tool } = order.submission;
    await sendProductEmailSafely(
      sendLaunchVideoBriefReminderEmailMessage({
        to: user.email,
        name: user.name,
        toolName: tool.name,
        briefUrl: getLaunchVideoBriefUrl(order.submission.id),
        delivery: order.standalone
          ? { kind: "standalone", deliverBy: formatDate(order.deliverBy ?? now) }
          : { kind: "premium", launchWeek: formatDate(order.launchWeekStart) },
      }),
    );
    sent += 1;
  }

  return { launchVideoBriefsChecked: candidates.length, launchVideoBriefRemindersSent: sent };
}
