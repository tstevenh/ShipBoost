import { z } from "zod";

import { cuidSchema } from "@/server/validators/shared";

export const launchFunnelEventSchema = z.object({
  submissionId: cuidSchema,
  event: z.enum(["launch_step_viewed", "launch_type_selected"]),
  launchType: z.enum(["FREE", "FEATURED"]),
});

export type LaunchFunnelEventInput = z.infer<typeof launchFunnelEventSchema>;
