import { z } from "zod";

import { cuidSchema } from "@/server/validators/shared";

export const launchBundleCheckoutSchema = z.object({
  submissionId: cuidSchema,
  launchType: z.enum(["FREE", "FEATURED"]),
  preferredLaunchDate: z.string().optional(),
  sponsorSlots: z
    .array(z.enum(["SIDEBAR", "INLINE_BANNER", "INLINE_PRODUCT"]))
    .default([]),
});

export type LaunchBundleCheckoutInput = z.infer<typeof launchBundleCheckoutSchema>;
