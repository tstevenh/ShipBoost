import { z } from "zod";

import { cuidSchema } from "@/server/validators/shared";

export const sponsorPlacementCheckoutSchema = z.object({
  toolId: cuidSchema,
});

export const sponsorPlacementDisableSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

export type SponsorPlacementCheckoutInput = z.infer<
  typeof sponsorPlacementCheckoutSchema
>;
