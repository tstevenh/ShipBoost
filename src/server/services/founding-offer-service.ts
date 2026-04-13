import { prisma } from "@/server/db/client";
import { getEnv } from "@/server/env";

export async function getRemainingFoundingPremiumLaunchSpots() {
  const limit = getEnv().FOUNDING_PREMIUM_LAUNCH_LIMIT;
  const used = await prisma.submission.count({
    where: {
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
    },
  });

  return Math.max(limit - used, 0);
}
