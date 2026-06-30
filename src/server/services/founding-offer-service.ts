import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";

export async function getPaidPremiumLaunchCount() {
  return prisma.submission.count({
    where: { submissionType: "FEATURED_LAUNCH", paymentStatus: "PAID" },
  });
}

export async function getRemainingFoundingPremiumLaunchSpots() {
  const limit = getEnv().FOUNDING_PREMIUM_LAUNCH_LIMIT;
  const used = await getPaidPremiumLaunchCount();
  return Math.max(limit - used, 0);
}

export async function getListedToolCount() {
  return prisma.tool.count();
}
