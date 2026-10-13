import { getLaunchVideoAddOn } from "@/lib/launch-video";
import { prisma } from "@/server/db/client";
import { sendLaunchVideoOfferEmailMessage } from "@/server/email/transactional";
import {
  getLaunchVideoOffer,
  getStandaloneDeliveryWindow,
} from "@/server/services/launch-video-service";
import { getLaunchVideoBriefUrl } from "@/server/services/launch-video-brief-service";
import { sendProductEmailSafely } from "@/server/services/submission-service-shared";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
// Ten days ahead: a free launcher who orders that week still gets the
// video (due 7 days after the order) before the launch week starts.
export const LAUNCH_VIDEO_OFFER_LEAD_DAYS = 10;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

/**
 * One launch video offer per scheduled launch, sent when the launch is 10 days
 * out. Skips launches that already have a video.
 */
export async function sendDueLaunchVideoOfferEmails(now = new Date()) {
  const launches = await prisma.launch.findMany({
    where: {
      launchType: { in: ["FREE", "FEATURED"] },
      status: "APPROVED",
      launchVideoOfferSentAt: null,
      launchDate: {
        gt: now,
        lte: new Date(now.getTime() + LAUNCH_VIDEO_OFFER_LEAD_DAYS * DAY_IN_MS),
      },
    },
    select: { id: true, toolId: true, launchType: true, status: true, launchDate: true },
    orderBy: { launchDate: "asc" },
  });

  if (launches.length === 0) {
    return { launchVideoOffersChecked: 0, launchVideoOffersSent: 0 };
  }

  const offer = await getLaunchVideoOffer();

  if (!offer.available) {
    return { launchVideoOffersChecked: launches.length, launchVideoOffersSent: 0 };
  }

  let sent = 0;

  for (const launch of launches) {
    const submission = await prisma.submission.findFirst({
      where: { toolId: launch.toolId, reviewStatus: "APPROVED" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        submissionType: true,
        paymentStatus: true,
        user: { select: { email: true, name: true } },
        tool: { select: { name: true } },
        launchVideoOrders: {
          where: { status: { in: ["PAID", "DELIVERED"] } },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!submission?.user.email) continue;

    // Judged on this launch alone, so the email always matches its date.
    const addOn = getLaunchVideoAddOn(
      {
        submissionType: submission.submissionType,
        paymentStatus: submission.paymentStatus,
        hasVideo: submission.launchVideoOrders.length > 0,
        launches: [launch],
      },
      offer,
      now,
    );

    // Claim first so overlapping cron runs never send it twice.
    const claimed = await prisma.launch.updateMany({
      where: { id: launch.id, launchVideoOfferSentAt: null },
      data: { launchVideoOfferSentAt: now },
    });
    if (claimed.count === 0 || !addOn.ok) continue;

    const { deliverBy } = getStandaloneDeliveryWindow(now);

    await sendProductEmailSafely(
      sendLaunchVideoOfferEmailMessage({
        to: submission.user.email,
        name: submission.user.name,
        toolName: submission.tool.name,
        launchWeek: formatDate(launch.launchDate),
        // The brief page shows the sample and checkout until the video is bought.
        offerUrl: getLaunchVideoBriefUrl(submission.id),
        priceUsd: addOn.priceUsd,
        delivery:
          addOn.delivery === "launch_week"
            ? { kind: "premium" }
            : {
                kind: "standalone",
                readyBeforeLaunch: deliverBy.getTime() <= launch.launchDate.getTime(),
                arrivesBy: formatDate(deliverBy),
              },
        launchPriceSpotsLeft: offer.launchPriceSpotsLeft,
      }),
    );
    sent += 1;
  }

  return { launchVideoOffersChecked: launches.length, launchVideoOffersSent: sent };
}
