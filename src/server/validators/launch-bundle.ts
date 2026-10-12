import { z } from "zod";

import { LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH } from "@/lib/launch-video";
import { cuidSchema } from "@/server/validators/shared";

export const launchBundleCheckoutSchema = z.object({
  submissionId: cuidSchema,
  launchType: z.enum(["FREE", "FEATURED"]),
  preferredLaunchDate: z.string().optional(),
  sponsorSlots: z
    .array(z.enum(["SIDEBAR", "INLINE_BANNER", "INLINE_PRODUCT"]))
    .default([]),
  launchVideo: z
    .object({
      focusNote: z.string().trim().max(LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH).optional(),
    })
    .optional(),
});

export type LaunchBundleCheckoutInput = z.infer<typeof launchBundleCheckoutSchema>;
