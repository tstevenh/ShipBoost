import { Webhooks } from "@polar-sh/nextjs";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import {
  handleFeaturedLaunchOrderPaid,
  handleFeaturedLaunchRefund,
} from "@/server/services/submission-service";

const env = getEnv();

export const POST = Webhooks({
  webhookSecret: env.POLAR_WEBHOOK_SECRET ?? "polar_webhook_secret_missing",
  onOrderPaid: async (payload) => {
    await handleFeaturedLaunchOrderPaid(payload);
    revalidateAllPublicContent();
  },
  onOrderRefunded: async (payload) => {
    await handleFeaturedLaunchRefund(payload.data.id);
  },
});
